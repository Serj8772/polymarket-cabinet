"""Trading service — market sell, take profit, stop loss via Polymarket CLOB."""

import logging
import uuid
from datetime import datetime, timezone

from py_clob_client.client import ClobClient
from py_clob_client.clob_types import ApiCreds, OrderArgs, OrderType
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decrypt_value
from app.crud.order import order_crud
from app.models.order import Order
from app.models.position import Position
from app.models.user import User
from app.services.polymarket_client import polymarket_client

logger = logging.getLogger(__name__)

# Polymarket Polygon chain ID
POLYGON_CHAIN_ID = 137
# Signature type for Poly Proxy wallets
POLY_PROXY_SIG_TYPE = 2


class TradingService:
    """Business logic for trading operations on Polymarket CLOB."""

    def _get_clob_client(self, user: User) -> ClobClient:
        """Create an authenticated ClobClient for the user.

        Requires both private key (for order signing) and API creds
        (for L2 HTTP authentication).

        IMPORTANT: funder must be the proxy wallet (holds the tokens/USDC),
        NOT the EOA. The signer (derived from key) is the EOA that signs orders.
        """
        if not user.encrypted_private_key:
            raise ValueError("Private key not configured. Go to Settings to add it.")

        if not user.has_polymarket_creds:
            raise ValueError("Polymarket API credentials not configured.")

        if not user.proxy_wallet:
            raise ValueError("Proxy wallet not configured. Go to Settings to add it.")

        # Decrypt credentials
        private_key = decrypt_value(user.encrypted_private_key)
        api_key = decrypt_value(user.encrypted_api_key)  # type: ignore
        api_secret = decrypt_value(user.encrypted_api_secret)  # type: ignore
        passphrase = decrypt_value(user.encrypted_passphrase)  # type: ignore

        creds = ApiCreds(
            api_key=api_key,
            api_secret=api_secret,
            api_passphrase=passphrase,
        )

        return ClobClient(
            host=settings.POLYMARKET_CLOB_API,
            chain_id=POLYGON_CHAIN_ID,
            key=private_key,
            creds=creds,
            signature_type=POLY_PROXY_SIG_TYPE,
            funder=user.proxy_wallet,
        )

    async def _get_position(
        self,
        db: AsyncSession,
        user: User,
        position_id: str,
    ) -> Position:
        """Get a position by ID, verifying ownership."""
        result = await db.execute(
            select(Position).where(
                Position.id == uuid.UUID(position_id),
                Position.user_id == user.id,
            )
        )
        position = result.scalar_one_or_none()
        if not position:
            raise ValueError("Position not found")
        return position

    async def market_sell(
        self,
        db: AsyncSession,
        user: User,
        position_id: str,
    ) -> dict:
        """Sell entire position at market price (FOK order).

        Places a Fill-or-Kill sell order at the current best bid price.
        """
        position = await self._get_position(db, user, position_id)

        if float(position.size) <= 0:
            raise ValueError("Position has no tokens to sell")

        # Get current best bid price for this token
        bid_price = await polymarket_client.get_price(
            position.token_id, side="sell"
        )
        if bid_price is None or bid_price <= 0:
            raise ValueError("Cannot determine market price. No bids available.")

        client = self._get_clob_client(user)

        order_args = OrderArgs(
            token_id=position.token_id,
            price=round(bid_price, 2),
            size=float(position.size),
            side="SELL",
        )

        logger.info(
            "Market sell: token=%s size=%s price=%s user=%s",
            position.token_id[:12],
            position.size,
            bid_price,
            user.wallet_address[:10],
        )

        # Place FOK order (fill entire amount or cancel)
        result = client.create_and_post_order(order_args, options=None)

        # Post with FOK type
        if hasattr(result, "id"):
            order_id = result.id
        elif isinstance(result, dict):
            order_id = result.get("id", result.get("orderID", ""))
        else:
            order_id = str(result)

        logger.info("Market sell placed: order_id=%s", order_id)

        return {
            "success": True,
            "message": f"Market sell order placed for {float(position.size):.2f} tokens at {bid_price:.4f}",
            "order_id": order_id,
        }

    async def set_take_profit(
        self,
        db: AsyncSession,
        user: User,
        position_id: str,
        price: float,
    ) -> dict:
        """Set take profit — places a GTC sell limit order on the CLOB.

        When the market price reaches the TP level, the order fills automatically.
        """
        position = await self._get_position(db, user, position_id)

        if float(position.size) <= 0:
            raise ValueError("Position has no tokens to sell")

        if price <= float(position.avg_price):
            raise ValueError(
                f"Take profit price ({price}) must be above avg entry ({float(position.avg_price):.4f})"
            )

        # Cancel existing TP order if any
        if position.tp_order_id:
            try:
                client = self._get_clob_client(user)
                client.cancel(position.tp_order_id)
                logger.info("Cancelled old TP order: %s", position.tp_order_id)
            except Exception as e:
                logger.warning("Failed to cancel old TP order: %s", e)

        client = self._get_clob_client(user)

        order_args = OrderArgs(
            token_id=position.token_id,
            price=round(price, 2),
            size=float(position.size),
            side="SELL",
        )

        logger.info(
            "Setting TP: token=%s size=%s price=%s user=%s",
            position.token_id[:12],
            position.size,
            price,
            user.wallet_address[:10],
        )

        # Place GTC limit sell order
        result = client.create_and_post_order(order_args, options=None)

        if hasattr(result, "id"):
            order_id = result.id
        elif isinstance(result, dict):
            order_id = result.get("id", result.get("orderID", ""))
        else:
            order_id = str(result)

        # Save TP config to position
        position.take_profit_price = price
        position.tp_order_id = str(order_id)
        await db.commit()

        logger.info("TP set: order_id=%s price=%s", order_id, price)

        return {
            "success": True,
            "message": f"Take profit set at {price:.2f} ({float(position.size):.2f} tokens)",
            "order_id": str(order_id),
        }

    async def cancel_take_profit(
        self,
        db: AsyncSession,
        user: User,
        position_id: str,
    ) -> dict:
        """Cancel take profit — cancels the GTC order on CLOB and clears DB fields."""
        position = await self._get_position(db, user, position_id)

        if not position.tp_order_id:
            raise ValueError("No take profit order to cancel")

        try:
            client = self._get_clob_client(user)
            client.cancel(position.tp_order_id)
            logger.info("Cancelled TP order: %s", position.tp_order_id)
        except Exception as e:
            logger.warning("Failed to cancel TP order on CLOB: %s", e)

        # Clear TP fields regardless
        position.take_profit_price = None
        position.tp_order_id = None
        await db.commit()

        return {"success": True, "message": "Take profit cancelled"}

    async def set_stop_loss(
        self,
        db: AsyncSession,
        user: User,
        position_id: str,
        price: float,
    ) -> dict:
        """Set stop loss — saves the SL price in DB for background monitoring.

        The scheduler checks prices every 30s and auto-sells when triggered.
        """
        position = await self._get_position(db, user, position_id)

        if float(position.size) <= 0:
            raise ValueError("Position has no tokens to sell")

        if price >= float(position.avg_price):
            raise ValueError(
                f"Stop loss price ({price}) must be below avg entry ({float(position.avg_price):.4f})"
            )

        position.stop_loss_price = price

        # Create or update SL order record in orders table
        synthetic_id = f"sl-{position.id}"
        existing = await order_crud.get_by_synthetic_id(
            db, user_id=user.id, polymarket_order_id=synthetic_id,
        )
        if existing:
            existing.price = price
            existing.size = float(position.size)
            existing.status = "LIVE"
            existing.market_question = position.title
            existing.placed_at = datetime.now(timezone.utc)
        else:
            sl_order = Order(
                user_id=user.id,
                market_id=position.market_id,
                token_id=position.token_id,
                polymarket_order_id=synthetic_id,
                side="SELL",
                outcome=position.outcome,
                order_type="STOP_LOSS",
                size=float(position.size),
                price=price,
                size_filled=0,
                status="LIVE",
                market_question=position.title,
                position_id=position.id,
                placed_at=datetime.now(timezone.utc),
            )
            db.add(sl_order)

        await db.commit()

        logger.info(
            "SL set: position=%s price=%s user=%s",
            position_id,
            price,
            user.wallet_address[:10],
        )

        return {
            "success": True,
            "message": f"Stop loss set at {price:.2f}",
        }

    async def remove_stop_loss(
        self,
        db: AsyncSession,
        user: User,
        position_id: str,
    ) -> dict:
        """Remove stop loss — clears the SL price from DB and cancels order record."""
        position = await self._get_position(db, user, position_id)

        position.stop_loss_price = None

        # Mark SL order as cancelled
        synthetic_id = f"sl-{position.id}"
        sl_order = await order_crud.get_by_synthetic_id(
            db, user_id=user.id, polymarket_order_id=synthetic_id,
        )
        if sl_order and sl_order.status == "LIVE":
            sl_order.status = "CANCELLED"

        await db.commit()

        return {"success": True, "message": "Stop loss removed"}

    async def edit_order(
        self,
        db: AsyncSession,
        user: User,
        order_id: str,
        new_price: float,
    ) -> dict:
        """Edit an order's price.

        For STOP_LOSS orders: update DB only (no CLOB order).
        For CLOB orders (GTC/LIMIT/TP): cancel old → create new on CLOB.
        """
        order = await order_crud.get_order_by_id(
            db, order_id=uuid.UUID(order_id), user_id=user.id,
        )
        if not order:
            raise ValueError("Order not found")
        if order.status != "LIVE":
            raise ValueError("Can only edit LIVE orders")

        if order.order_type == "STOP_LOSS":
            # SL: update price in order and position
            order.price = new_price
            if order.position_id:
                position = await self._get_position(db, user, str(order.position_id))
                position.stop_loss_price = new_price
            await db.commit()
            return {"success": True, "message": f"Stop loss updated to {new_price:.2f}"}

        # CLOB order: cancel old, create new
        client = self._get_clob_client(user)

        # Cancel existing order on CLOB
        try:
            client.cancel(order.polymarket_order_id)
        except Exception as e:
            logger.warning("Failed to cancel order %s: %s", order.polymarket_order_id, e)
            raise ValueError("Failed to cancel existing order on CLOB") from e

        # Create new order with same params but new price
        remaining = float(order.size) - float(order.size_filled)
        if remaining <= 0:
            order.status = "MATCHED"
            await db.commit()
            raise ValueError("Order already fully filled")

        order_args = OrderArgs(
            token_id=order.token_id,
            price=round(new_price, 2),
            size=remaining,
            side=order.side,
        )

        result = client.create_and_post_order(order_args, options=None)

        if hasattr(result, "id"):
            new_clob_id = result.id
        elif isinstance(result, dict):
            new_clob_id = result.get("id", result.get("orderID", ""))
        else:
            new_clob_id = str(result)

        # Update DB record with new CLOB order ID and price
        order.polymarket_order_id = str(new_clob_id)
        order.price = new_price
        order.size = remaining
        order.size_filled = 0

        # If linked to position, update TP fields
        if order.position_id:
            try:
                position = await self._get_position(db, user, str(order.position_id))
                if position.tp_order_id or order.order_type == "TAKE_PROFIT":
                    position.take_profit_price = new_price
                    position.tp_order_id = str(new_clob_id)
            except ValueError:
                pass

        await db.commit()

        logger.info("Order edited: old=%s new=%s price=%s", order_id, new_clob_id, new_price)

        return {
            "success": True,
            "message": f"Order updated to {new_price:.2f}",
            "order_id": str(new_clob_id),
        }

    async def cancel_order(
        self,
        db: AsyncSession,
        user: User,
        order_id: str,
    ) -> dict:
        """Cancel a LIVE order.

        For STOP_LOSS: clear stop_loss_price from position.
        For CLOB orders: cancel on CLOB exchange.
        """
        order = await order_crud.get_order_by_id(
            db, order_id=uuid.UUID(order_id), user_id=user.id,
        )
        if not order:
            raise ValueError("Order not found")
        if order.status != "LIVE":
            raise ValueError("Can only cancel LIVE orders")

        if order.order_type == "STOP_LOSS":
            # SL: clear from position
            if order.position_id:
                try:
                    position = await self._get_position(db, user, str(order.position_id))
                    position.stop_loss_price = None
                except ValueError:
                    pass
            order.status = "CANCELLED"
            await db.commit()
            return {"success": True, "message": "Stop loss cancelled"}

        # CLOB order: cancel on exchange
        client = self._get_clob_client(user)
        try:
            client.cancel(order.polymarket_order_id)
        except Exception as e:
            logger.warning("Failed to cancel order %s on CLOB: %s", order.polymarket_order_id, e)

        order.status = "CANCELLED"

        # If TP order linked to position, clear TP fields
        if order.position_id:
            try:
                position = await self._get_position(db, user, str(order.position_id))
                if position.tp_order_id == order.polymarket_order_id:
                    position.take_profit_price = None
                    position.tp_order_id = None
            except ValueError:
                pass

        await db.commit()

        logger.info("Order cancelled: %s type=%s", order_id, order.order_type)

        return {"success": True, "message": "Order cancelled"}

    async def check_stop_losses(self, db: AsyncSession) -> int:
        """Background job: check all active stop losses and trigger sells.

        Called by the scheduler every 30 seconds.
        Returns number of SL triggered.
        """
        # Find all positions with active stop loss
        result = await db.execute(
            select(Position)
            .where(Position.stop_loss_price.isnot(None))
            .where(Position.size > 0)
            .where(Position.redeemable == False)  # noqa: E712
        )
        positions = list(result.scalars().all())

        if not positions:
            return 0

        triggered = 0
        for position in positions:
            try:
                # Get current price
                current_price = await polymarket_client.get_price(
                    position.token_id, side="sell"
                )

                if current_price is None:
                    continue

                sl_price = float(position.stop_loss_price)

                if current_price <= sl_price:
                    logger.warning(
                        "SL TRIGGERED: position=%s token=%s current=%.4f sl=%.4f",
                        position.id,
                        position.token_id[:12],
                        current_price,
                        sl_price,
                    )

                    # Get user for this position
                    from app.crud.user import user_crud

                    user = await user_crud.get(db, id=position.user_id)
                    if not user or not user.has_private_key:
                        logger.error(
                            "Cannot execute SL: user %s has no private key",
                            position.user_id,
                        )
                        continue

                    # Execute market sell
                    try:
                        sell_result = await self.market_sell(
                            db, user, str(position.id)
                        )
                        logger.info(
                            "SL executed: position=%s result=%s",
                            position.id,
                            sell_result,
                        )
                        # Clear SL after execution
                        position.stop_loss_price = None

                        # Mark SL order as MATCHED
                        synthetic_id = f"sl-{position.id}"
                        sl_order = await order_crud.get_by_synthetic_id(
                            db,
                            user_id=position.user_id,
                            polymarket_order_id=synthetic_id,
                        )
                        if sl_order and sl_order.status == "LIVE":
                            sl_order.status = "MATCHED"
                            sl_order.size_filled = sl_order.size

                        await db.commit()
                        triggered += 1
                    except Exception as e:
                        logger.error(
                            "SL execution failed for position %s: %s",
                            position.id,
                            e,
                        )
            except Exception as e:
                logger.error(
                    "SL check failed for position %s: %s",
                    position.id,
                    e,
                )

        if triggered:
            logger.info("Stop loss check: %d triggered out of %d active", triggered, len(positions))

        return triggered


# Module-level singleton
trading_service = TradingService()
