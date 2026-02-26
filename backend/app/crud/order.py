"""CRUD operations for Order model."""

import uuid
from datetime import datetime, timezone

from pydantic import BaseModel
from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.order import Order


class CRUDOrder(CRUDBase[Order, BaseModel, BaseModel]):
    """Order CRUD with user-scoped operations."""

    async def get_user_orders(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        status: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Order]:
        """Get orders for a user, optionally filtered by status."""
        query = select(Order).where(Order.user_id == user_id)
        if status:
            query = query.where(Order.status == status.upper())
        query = query.order_by(Order.placed_at.desc().nullslast()).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    async def count_user_orders(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        status: str | None = None,
    ) -> int:
        """Count orders for a user, optionally filtered by status."""
        query = (
            select(func.count())
            .select_from(Order)
            .where(Order.user_id == user_id)
        )
        if status:
            query = query.where(Order.status == status.upper())
        result = await db.execute(query)
        return result.scalar_one()

    async def count_by_statuses(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
    ) -> dict[str, int]:
        """Count orders grouped by status for summary."""
        result = await db.execute(
            select(Order.status, func.count())
            .where(Order.user_id == user_id)
            .group_by(Order.status)
        )
        counts = {row[0]: row[1] for row in result.all()}
        return {
            "LIVE": counts.get("LIVE", 0),
            "MATCHED": counts.get("MATCHED", 0),
            "CANCELLED": counts.get("CANCELLED", 0),
        }

    async def upsert_many(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        orders_data: list[dict],
    ) -> int:
        """Bulk upsert orders from Polymarket API sync.

        Args:
            user_id: Owner of the orders.
            orders_data: List of dicts with keys:
                polymarket_order_id, market_id, token_id, side, outcome,
                order_type, size, price, size_filled, status,
                market_question, placed_at

        Returns:
            Number of rows upserted.
        """
        if not orders_data:
            return 0

        rows = []
        for o in orders_data:
            rows.append({
                "id": uuid.uuid4(),
                "user_id": user_id,
                "market_id": o["market_id"],
                "token_id": o["token_id"],
                "polymarket_order_id": o["polymarket_order_id"],
                "side": o.get("side", "BUY"),
                "outcome": o.get("outcome", "Unknown"),
                "order_type": o.get("order_type", "LIMIT"),
                "size": o.get("size", 0),
                "price": o.get("price", 0),
                "size_filled": o.get("size_filled", 0),
                "status": o.get("status", "LIVE"),
                "market_question": o.get("market_question"),
                "placed_at": o.get("placed_at"),
            })

        stmt = pg_insert(Order).values(rows)
        stmt = stmt.on_conflict_do_update(
            constraint="uq_orders_user_pm_order",
            set_={
                "size": stmt.excluded.size,
                "price": stmt.excluded.price,
                "size_filled": stmt.excluded.size_filled,
                "status": stmt.excluded.status,
                "market_question": stmt.excluded.market_question,
                "updated_at": func.now(),
            },
        )

        await db.execute(stmt)
        await db.commit()
        return len(rows)

    async def resolve_missing_live_orders(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        live_order_ids: set[str],
    ) -> int:
        """Mark LIVE orders not in the API response as MATCHED.

        ClobClient.get_orders() only returns LIVE orders.
        If a previously LIVE order disappears, it was filled (MATCHED)
        or cancelled. We default to MATCHED since fills are most common.

        Args:
            user_id: Owner of the orders.
            live_order_ids: Set of polymarket_order_ids currently LIVE on CLOB.

        Returns:
            Number of orders resolved.
        """
        query = (
            select(Order.polymarket_order_id)
            .where(
                Order.user_id == user_id,
                Order.status == "LIVE",
                Order.order_type.notin_(["STOP_LOSS"]),  # SL orders are not on CLOB
            )
        )
        if live_order_ids:
            query = query.where(
                Order.polymarket_order_id.notin_(live_order_ids),
            )

        result = await db.execute(query)
        missing_ids = [row[0] for row in result.all()]

        if not missing_ids:
            return 0

        stmt = (
            update(Order)
            .where(
                Order.user_id == user_id,
                Order.polymarket_order_id.in_(missing_ids),
            )
            .values(
                status="MATCHED",
                size_filled=Order.size,
                updated_at=func.now(),
            )
        )
        await db.execute(stmt)
        await db.commit()
        return len(missing_ids)

    async def get_order_by_id(
        self,
        db: AsyncSession,
        *,
        order_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Order | None:
        """Get a single order by its DB id, scoped to user."""
        result = await db.execute(
            select(Order).where(
                Order.id == order_id,
                Order.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_synthetic_id(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        polymarket_order_id: str,
    ) -> Order | None:
        """Get order by polymarket_order_id (including synthetic sl-* ids)."""
        result = await db.execute(
            select(Order).where(
                Order.user_id == user_id,
                Order.polymarket_order_id == polymarket_order_id,
            )
        )
        return result.scalar_one_or_none()


# Module-level singleton
order_crud = CRUDOrder(Order)
