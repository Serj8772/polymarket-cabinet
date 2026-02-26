"""CRUD operations for Position model."""

import uuid
from datetime import datetime, timezone

from pydantic import BaseModel
from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.position import Position


class CRUDPosition(CRUDBase[Position, BaseModel, BaseModel]):
    """Position CRUD with user-scoped operations."""

    async def get_user_positions(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Position]:
        """Get positions for a user. If active_only, exclude resolved markets."""
        query = (
            select(Position)
            .where(Position.user_id == user_id)
            .where(Position.size > 0)
        )
        if active_only:
            query = query.where(Position.redeemable == False)  # noqa: E712
        result = await db.execute(
            query
            .order_by(Position.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_user_positions(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
    ) -> int:
        """Count non-zero positions for a user."""
        result = await db.execute(
            select(func.count())
            .select_from(Position)
            .where(Position.user_id == user_id)
            .where(Position.size > 0)
        )
        return result.scalar_one()

    async def get_by_user_token(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        token_id: str,
    ) -> Position | None:
        """Get single position by user + token_id."""
        result = await db.execute(
            select(Position).where(
                Position.user_id == user_id,
                Position.token_id == token_id,
            )
        )
        return result.scalar_one_or_none()

    async def upsert_many(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        positions_data: list[dict],
    ) -> int:
        """Bulk upsert positions from Polymarket API sync.

        Args:
            user_id: Owner of the positions.
            positions_data: List of dicts with keys:
                market_id, token_id, outcome, size, avg_price, current_price,
                realized_pnl, title, slug, icon

        Returns:
            Number of rows upserted.
        """
        if not positions_data:
            return 0

        now = datetime.now(timezone.utc)
        rows = []
        for p in positions_data:
            rows.append({
                "id": uuid.uuid4(),
                "user_id": user_id,
                "market_id": p["market_id"],
                "token_id": p["token_id"],
                "outcome": p.get("outcome", "Unknown"),
                "size": p.get("size", 0),
                "avg_price": p.get("avg_price", 0),
                "current_price": p.get("current_price"),
                "realized_pnl": p.get("realized_pnl", 0),
                "title": p.get("title"),
                "slug": p.get("slug"),
                "icon": p.get("icon"),
                "redeemable": p.get("redeemable", False),
                "synced_at": now,
            })

        stmt = pg_insert(Position).values(rows)
        stmt = stmt.on_conflict_do_update(
            constraint="uq_positions_user_token",
            set_={
                "size": stmt.excluded.size,
                "avg_price": stmt.excluded.avg_price,
                "current_price": stmt.excluded.current_price,
                "realized_pnl": stmt.excluded.realized_pnl,
                "title": stmt.excluded.title,
                "slug": stmt.excluded.slug,
                "icon": stmt.excluded.icon,
                "redeemable": stmt.excluded.redeemable,
                "synced_at": stmt.excluded.synced_at,
                "updated_at": func.now(),
            },
        )

        await db.execute(stmt)
        await db.commit()
        return len(rows)

    async def zero_missing_positions(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        active_token_ids: set[str],
    ) -> int:
        """Zero out size for positions not in the API response.

        When a position is sold or closed on Polymarket, the Data API
        no longer returns it (or returns with size=0). We need to set
        size=0 for any DB positions whose token_id is NOT in the set
        of token_ids returned by the API.

        Returns number of rows zeroed.
        """
        stmt = (
            update(Position)
            .where(
                Position.user_id == user_id,
                Position.size > 0,
                Position.token_id.notin_(active_token_ids),
            )
            .values(size=0, current_price=0, updated_at=func.now())
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount  # type: ignore[return-value]


# Module-level singleton
position_crud = CRUDPosition(Position)
