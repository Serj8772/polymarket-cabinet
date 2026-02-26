"""Market CRUD operations."""

from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.market import Market


class CRUDMarket(CRUDBase[Market, dict, dict]):
    """CRUD operations for Market model."""

    async def get_multi_filtered(
        self,
        db: AsyncSession,
        *,
        category: str | None = None,
        active: bool | None = None,
        closed: bool | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Market]:
        """Get markets with optional filters and pagination."""
        stmt = select(Market)

        if category is not None:
            stmt = stmt.where(Market.category == category)
        if active is not None:
            stmt = stmt.where(Market.active == active)
        if closed is not None:
            stmt = stmt.where(Market.closed == closed)

        stmt = stmt.order_by(Market.volume.desc().nulls_last()).offset(skip).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def search(
        self,
        db: AsyncSession,
        *,
        query: str,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Market]:
        """Search markets by question text using ilike."""
        pattern = f"%{query}%"
        stmt = (
            select(Market)
            .where(
                or_(
                    Market.question.ilike(pattern),
                    Market.slug.ilike(pattern),
                )
            )
            .order_by(Market.volume.desc().nulls_last())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def count_filtered(
        self,
        db: AsyncSession,
        *,
        category: str | None = None,
        active: bool | None = None,
        closed: bool | None = None,
        query: str | None = None,
    ) -> int:
        """Count markets matching filters."""
        stmt = select(func.count()).select_from(Market)

        if category is not None:
            stmt = stmt.where(Market.category == category)
        if active is not None:
            stmt = stmt.where(Market.active == active)
        if closed is not None:
            stmt = stmt.where(Market.closed == closed)
        if query:
            pattern = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Market.question.ilike(pattern),
                    Market.slug.ilike(pattern),
                )
            )

        result = await db.execute(stmt)
        return result.scalar_one()

    async def upsert_many(
        self,
        db: AsyncSession,
        *,
        markets_data: list[dict[str, Any]],
    ) -> int:
        """Bulk upsert markets using PostgreSQL INSERT ... ON CONFLICT."""
        if not markets_data:
            return 0

        stmt = pg_insert(Market).values(markets_data)
        stmt = stmt.on_conflict_do_update(
            index_elements=["id"],
            set_={
                "question": stmt.excluded.question,
                "slug": stmt.excluded.slug,
                "category": stmt.excluded.category,
                "end_date": stmt.excluded.end_date,
                "active": stmt.excluded.active,
                "closed": stmt.excluded.closed,
                "tokens": stmt.excluded.tokens,
                "volume": stmt.excluded.volume,
                "liquidity": stmt.excluded.liquidity,
                "description": stmt.excluded.description,
                "image": stmt.excluded.image,
                "synced_at": stmt.excluded.synced_at,
                "updated_at": func.now(),
            },
        )

        await db.execute(stmt)
        await db.commit()
        return len(markets_data)


market_crud = CRUDMarket(Market)
