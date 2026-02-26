"""Orders API endpoints — order history and sync."""

from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.order import OrderListResponse
from app.services.order_service import order_service

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=OrderListResponse)
async def get_orders(
    status: Literal["LIVE", "MATCHED", "CANCELLED"] | None = Query(
        None, description="Filter by status: LIVE, MATCHED, CANCELLED",
    ),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderListResponse:
    """Get user's order history with optional status filter.

    Returns orders from local DB. Use POST /orders/sync to
    refresh from Polymarket first.
    """
    return await order_service.get_orders(
        db,
        current_user,
        status=status,
        page=page,
        page_size=page_size,
    )


@router.post("/sync")
async def sync_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Sync orders from Polymarket API.

    Requires Polymarket API credentials to be saved.
    Fetches latest order history and upserts into local DB.
    """
    count = await order_service.sync_orders(db, current_user)
    return {
        "synced_count": count,
        "message": f"Synced {count} orders from Polymarket",
    }
