"""Portfolio service — user positions, P&L calculations, sync."""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.position import position_crud
from app.models.user import User
from app.schemas.position import PortfolioResponse, PositionResponse
from app.services.polymarket_client import polymarket_client

logger = logging.getLogger(__name__)


class PortfolioService:
    """Business logic for portfolio operations."""

    async def get_portfolio(
        self,
        db: AsyncSession,
        user: User,
    ) -> PortfolioResponse:
        """Get user's portfolio with P&L calculations.

        Fetches positions from DB and computes aggregated P&L.
        Market info (title, slug, icon) is denormalized in positions.
        """
        positions = await position_crud.get_user_positions(
            db, user_id=user.id, limit=200,
        )

        position_responses: list[PositionResponse] = []
        for pos in positions:
            position_responses.append(
                PositionResponse(
                    id=str(pos.id),
                    user_id=str(pos.user_id),
                    market_id=pos.market_id,
                    token_id=pos.token_id,
                    outcome=pos.outcome,
                    size=float(pos.size),
                    avg_price=float(pos.avg_price),
                    current_price=float(pos.current_price) if pos.current_price else None,
                    realized_pnl=float(pos.realized_pnl),
                    synced_at=pos.synced_at,
                    market_question=pos.title,
                    market_image=pos.icon,
                    market_slug=pos.slug,
                    take_profit_price=float(pos.take_profit_price) if pos.take_profit_price else None,
                    stop_loss_price=float(pos.stop_loss_price) if pos.stop_loss_price else None,
                    tp_order_id=pos.tp_order_id,
                )
            )

        # Aggregates
        total_value = sum(p.current_value for p in position_responses)
        total_cost = sum(p.cost_basis for p in position_responses)
        total_unrealized = sum(p.unrealized_pnl for p in position_responses)
        total_realized = sum(p.realized_pnl for p in position_responses)
        total_pnl_pct = (total_unrealized / total_cost * 100) if total_cost else 0.0

        # Fetch USDC cash balance from Polygon
        cash_balance = 0.0
        try:
            wallet = user.portfolio_wallet
            cash_balance = await polymarket_client.get_usdc_balance(
                wallet_address=wallet,
            )
        except Exception as e:
            logger.warning("Failed to fetch cash balance: %s", e)

        return PortfolioResponse(
            positions=position_responses,
            total_value=total_value,
            total_cost=total_cost,
            total_unrealized_pnl=total_unrealized,
            total_realized_pnl=total_realized,
            total_pnl_percent=total_pnl_pct,
            positions_count=len(position_responses),
            cash_balance=cash_balance,
        )

    async def sync_positions(
        self,
        db: AsyncSession,
        user: User,
    ) -> int:
        """Sync positions from Polymarket public Data API.

        Uses proxy wallet (or EOA fallback) to fetch positions.
        Data API provides title, slug, icon — stored denormalized in positions.

        Returns number of positions synced.
        """
        # Use proxy wallet if set, otherwise fall back to EOA
        wallet = user.portfolio_wallet
        logger.info(
            "Syncing positions for user %s (wallet=%s, proxy=%s)",
            user.wallet_address[:10],
            wallet[:10],
            user.proxy_wallet[:10] if user.proxy_wallet else "not set",
        )

        # Fetch from Polymarket Data API (public, wallet-based)
        raw_positions = await polymarket_client.get_user_positions(
            wallet_address=wallet,
        )

        if not raw_positions:
            logger.info("No positions found for wallet %s", wallet)
            return 0

        # Transform Data API response to our format
        # Data API fields: asset, conditionId, size, avgPrice, curPrice,
        # cashPnl, realizedPnl, outcome, title, slug, icon, etc.
        positions_data: list[dict] = []
        all_token_ids: set[str] = set()  # Track ALL token_ids from API
        for raw in raw_positions:
            token_id = raw.get("asset", "")
            if not token_id:
                continue

            all_token_ids.add(str(token_id))

            market_id = raw.get("conditionId", "")
            size = _parse_float(raw.get("size", 0))
            avg_price = _parse_float(raw.get("avgPrice", 0))
            current_price = _parse_float(raw.get("curPrice"))
            realized_pnl = _parse_float(raw.get("realizedPnl", 0))
            outcome = raw.get("outcome", "Unknown")

            if size > 0 and market_id:
                positions_data.append({
                    "market_id": str(market_id),
                    "token_id": str(token_id),
                    "outcome": outcome,
                    "size": size,
                    "avg_price": avg_price,
                    "current_price": current_price,
                    "realized_pnl": realized_pnl,
                    "title": raw.get("title"),
                    "slug": raw.get("eventSlug") or raw.get("slug"),
                    "icon": raw.get("icon"),
                    "redeemable": bool(raw.get("redeemable", False)),
                })

        # Upsert positions from API
        count = await position_crud.upsert_many(
            db,
            user_id=user.id,
            positions_data=positions_data,
        )

        # Zero out positions that are no longer in the API response
        # (sold, closed, or otherwise removed from Polymarket)
        if all_token_ids:
            zeroed = await position_crud.zero_missing_positions(
                db,
                user_id=user.id,
                active_token_ids=all_token_ids,
            )
            if zeroed:
                logger.info(
                    "Zeroed %d stale positions for user %s",
                    zeroed,
                    user.wallet_address[:10],
                )

        logger.info(
            "Synced %d positions for user %s (wallet=%s)",
            count,
            user.wallet_address[:10],
            wallet[:10],
        )
        return count


def _parse_float(value) -> float:
    """Safely parse a float value."""
    if value is None:
        return 0.0
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0


# Module-level singleton
portfolio_service = PortfolioService()
