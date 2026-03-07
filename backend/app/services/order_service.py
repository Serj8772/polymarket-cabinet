"""Order service — order history, sync from Polymarket."""

import logging
from datetime import UTC, datetime

import httpx
from py_clob_client.client import ClobClient
from py_clob_client.clob_types import ApiCreds, TradeParams
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decrypt_value
from app.crud.order import order_crud
from app.crud.position import position_crud
from app.models.user import User
from app.schemas.order import OrderListResponse, OrderResponse

logger = logging.getLogger(__name__)


class OrderService:
    """Business logic for order operations."""

    async def get_orders(
        self,
        db: AsyncSession,
        user: User,
        *,
        status: str | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> OrderListResponse:
        """Get user's orders with pagination and optional status filter."""
        skip = (page - 1) * page_size

        orders = await order_crud.get_user_orders(
            db, user_id=user.id, status=status, skip=skip, limit=page_size,
        )
        total = await order_crud.count_user_orders(
            db, user_id=user.id, status=status,
        )
        status_counts = await order_crud.count_by_statuses(
            db, user_id=user.id,
        )

        order_responses: list[OrderResponse] = []
        for order in orders:
            order_responses.append(
                OrderResponse(
                    id=str(order.id),
                    user_id=str(order.user_id),
                    market_id=order.market_id,
                    token_id=order.token_id,
                    polymarket_order_id=order.polymarket_order_id,
                    side=order.side,
                    outcome=order.outcome,
                    order_type=order.order_type,
                    size=float(order.size),
                    price=float(order.price),
                    size_filled=float(order.size_filled),
                    status=order.status,
                    market_question=order.market_question,
                    position_id=str(order.position_id) if order.position_id else None,
                    placed_at=order.placed_at,
                    created_at=order.created_at,
                )
            )

        return OrderListResponse(
            orders=order_responses,
            total=total,
            page=page,
            page_size=page_size,
            total_live=status_counts.get("LIVE", 0),
            total_matched=status_counts.get("MATCHED", 0),
            total_cancelled=status_counts.get("CANCELLED", 0),
        )

    async def sync_orders(
        self,
        db: AsyncSession,
        user: User,
    ) -> int:
        """Sync orders from Polymarket CLOB API via py-clob-client.

        Uses ClobClient.get_orders() with proper L2 HMAC auth.
        Returns number of orders synced.
        """
        if not user.has_polymarket_creds:
            logger.warning("User %s has no Polymarket credentials", user.wallet_address)
            return 0

        if not user.encrypted_private_key:
            logger.warning("User %s has no private key", user.wallet_address)
            return 0

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

        client = ClobClient(
            host=settings.POLYMARKET_CLOB_API,
            chain_id=137,
            key=private_key,
            creds=creds,
            signature_type=2,
            funder=user.proxy_wallet or user.wallet_address,
        )

        # Build token_id → title lookup from user's positions
        positions = await position_crud.get_user_positions(
            db, user_id=user.id, active_only=False, limit=500,
        )
        token_title_map: dict[str, str] = {
            pos.token_id: pos.title for pos in positions if pos.title
        }

        # Fetch LIVE orders from Polymarket CLOB API
        try:
            raw_orders = client.get_orders()
        except Exception as e:
            logger.error("Failed to fetch orders from CLOB API: %s", e)
            raw_orders = []

        if not raw_orders:
            logger.info("No live orders found for user %s", user.wallet_address)
            # All LIVE orders are gone — resolve them as MATCHED
            resolved = await order_crud.resolve_missing_live_orders(
                db,
                user_id=user.id,
                live_order_ids=set(),
            )
            if resolved:
                logger.info(
                    "Resolved %d filled orders for user %s",
                    resolved,
                    user.wallet_address,
                )

        # Process LIVE orders from CLOB API
        count = 0
        if raw_orders:
            # Collect token_ids missing from positions for title lookup
            all_token_ids = {
                str(raw.get("asset_id", ""))
                for raw in raw_orders
                if raw.get("asset_id")
            }
            missing_token_ids = all_token_ids - set(token_title_map.keys())
            if missing_token_ids:
                gamma_titles = await _fetch_market_titles(missing_token_ids)
                token_title_map.update(gamma_titles)

            # Transform CLOB API response to our format
            orders_data: list[dict] = []
            for raw in raw_orders:
                order_id = raw.get("id", "")
                if not order_id:
                    continue

                market_id = raw.get("market", "")
                token_id = raw.get("asset_id", "")
                if not market_id or not token_id:
                    continue

                placed_at = _parse_datetime(raw.get("created_at"))
                orders_data.append({
                    "polymarket_order_id": str(order_id),
                    "market_id": str(market_id),
                    "token_id": str(token_id),
                    "side": raw.get("side", "BUY").upper(),
                    "outcome": raw.get("outcome", "Unknown"),
                    "order_type": raw.get("order_type", raw.get("type", "GTC")).upper(),
                    "size": _parse_float(raw.get("original_size", 0)),
                    "price": _parse_float(raw.get("price", 0)),
                    "size_filled": _parse_float(raw.get("size_matched", 0)),
                    "status": _map_status(raw.get("status", "LIVE")),
                    "market_question": token_title_map.get(str(token_id)),
                    "placed_at": placed_at,
                })

            count = await order_crud.upsert_many(
                db, user_id=user.id, orders_data=orders_data,
            )

            # Resolve LIVE orders that disappeared from CLOB API
            live_order_ids = {d["polymarket_order_id"] for d in orders_data}
            resolved = await order_crud.resolve_missing_live_orders(
                db, user_id=user.id, live_order_ids=live_order_ids,
            )
            if resolved:
                logger.info(
                    "Resolved %d filled orders for user %s",
                    resolved, user.wallet_address,
                )

        logger.info(
            "Synced %d live orders for user %s",
            count, user.wallet_address,
        )

        # Also fetch trade history to capture executed/matched orders
        trades_count = await self._sync_trades(db, user, client, token_title_map)

        return count + trades_count

    async def _sync_trades(
        self,
        db: AsyncSession,
        user: User,
        client: ClobClient,
        token_title_map: dict[str, str],
    ) -> int:
        """Sync trade history from CLOB API to capture executed orders.

        get_trades() returns fill events — orders that already matched.
        This ensures executed orders appear in the user's order history.
        """
        try:
            raw_trades = client.get_trades(TradeParams())
        except Exception as e:
            logger.error("Failed to fetch trades from CLOB API: %s", e)
            return 0

        if not raw_trades:
            return 0

        # Deduplicate by taker_order_id — each order can have multiple fills
        # We want one Order record per order, not per fill
        order_fills: dict[str, dict] = {}
        for trade in raw_trades:
            order_id = trade.get("taker_order_id") or trade.get("id", "")
            if not order_id:
                continue

            market_id = trade.get("market", "")
            token_id = trade.get("asset_id", "")
            if not market_id or not token_id:
                continue

            if order_id not in order_fills:
                placed_at = _parse_datetime(
                    trade.get("match_time") or trade.get("created_at")
                )
                order_fills[order_id] = {
                    "polymarket_order_id": str(order_id),
                    "market_id": str(market_id),
                    "token_id": str(token_id),
                    "side": trade.get("side", "BUY").upper(),
                    "outcome": trade.get("outcome", "Unknown"),
                    "order_type": trade.get("type", trade.get("order_type", "FOK")).upper(),
                    "size": _parse_float(trade.get("size", 0)),
                    "price": _parse_float(trade.get("price", 0)),
                    "size_filled": _parse_float(trade.get("size", 0)),
                    "status": "MATCHED",
                    "market_question": token_title_map.get(str(token_id)),
                    "placed_at": placed_at,
                }
            else:
                # Aggregate multiple fills for the same order
                existing = order_fills[order_id]
                existing["size"] += _parse_float(trade.get("size", 0))
                existing["size_filled"] += _parse_float(trade.get("size", 0))

        if not order_fills:
            return 0

        # Fetch titles for any token_ids not yet in the map
        missing_tokens = {
            v["token_id"] for v in order_fills.values()
            if not v.get("market_question")
        }
        if missing_tokens:
            extra_titles = await _fetch_market_titles(missing_tokens)
            for fill in order_fills.values():
                if not fill.get("market_question"):
                    fill["market_question"] = extra_titles.get(fill["token_id"])

        trades_data = list(order_fills.values())
        count = await order_crud.upsert_many(
            db, user_id=user.id, orders_data=trades_data,
        )

        logger.info(
            "Synced %d trades (executed orders) for user %s",
            count,
            user.wallet_address,
        )
        return count


async def _fetch_market_titles(token_ids: set[str]) -> dict[str, str]:
    """Fetch market questions from Gamma API by clob_token_ids.

    Returns dict mapping token_id → market question.
    """
    result: dict[str, str] = {}
    try:
        async with httpx.AsyncClient(timeout=15.0) as http:
            for token_id in token_ids:
                try:
                    resp = await http.get(
                        f"{settings.POLYMARKET_GAMMA_API}/markets",
                        params={"clob_token_ids": token_id},
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    if data and isinstance(data, list) and data[0].get("question"):
                        result[token_id] = data[0]["question"]
                except Exception as e:
                    logger.debug("Gamma lookup failed for token %s: %s", token_id[:20], e)
    except Exception as e:
        logger.warning("Failed to fetch market titles from Gamma: %s", e)
    return result


def _parse_float(value) -> float:
    """Safely parse a float value."""
    if value is None:
        return 0.0
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0


def _parse_datetime(value) -> datetime | None:
    """Parse datetime from various Polymarket formats."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, (int, float)):
        # Unix timestamp (seconds or milliseconds)
        ts = value if value < 1e12 else value / 1000
        return datetime.fromtimestamp(ts, tz=UTC)
    if isinstance(value, str):
        try:
            # ISO format
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            pass
        try:
            # Unix timestamp as string
            ts = float(value)
            ts = ts if ts < 1e12 else ts / 1000
            return datetime.fromtimestamp(ts, tz=UTC)
        except (ValueError, TypeError):
            pass
    return None


def _map_status(raw_status: str) -> str:
    """Map Polymarket order status to our normalized status."""
    status = raw_status.upper()
    status_map = {
        "LIVE": "LIVE",
        "OPEN": "LIVE",
        "ACTIVE": "LIVE",
        "MATCHED": "MATCHED",
        "FILLED": "MATCHED",
        "CLOSED": "MATCHED",
        "CANCELLED": "CANCELLED",
        "CANCELED": "CANCELLED",
        "EXPIRED": "CANCELLED",
    }
    return status_map.get(status, status)


# Module-level singleton
order_service = OrderService()
