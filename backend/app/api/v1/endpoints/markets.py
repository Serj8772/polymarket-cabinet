"""Markets API endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.market import (
    MarketDetailResponse,
    MarketListResponse,
    MarketSearchParams,
)
from app.services.market_service import market_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/markets", tags=["markets"])


@router.get("", response_model=MarketListResponse)
async def list_markets(
    category: str | None = Query(None, description="Filter by category"),
    active: bool | None = Query(None, description="Filter by active status"),
    closed: bool | None = Query(None, description="Filter by closed status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
) -> MarketListResponse:
    """List markets with filtering and pagination."""
    params = MarketSearchParams(
        category=category,
        active=active,
        closed=closed,
        page=page,
        page_size=page_size,
    )
    return await market_service.get_markets(db, params=params)


@router.get("/search", response_model=MarketListResponse)
async def search_markets(
    q: str = Query(..., min_length=2, description="Search query"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> MarketListResponse:
    """Search markets by question text."""
    return await market_service.search_markets(
        db, query=q, page=page, page_size=page_size,
    )


@router.post("/sync")
async def sync_markets(
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Manually trigger market sync from Gamma API."""
    try:
        count = await market_service.sync_markets_from_gamma(db)
        return {"synced": count}
    except Exception as e:
        logger.exception("Manual sync failed")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/debug/gamma")
async def debug_gamma() -> dict:
    """Debug: fetch 1 market from Gamma and show parsed fields."""
    from app.services.polymarket_client import polymarket_client

    raw = await polymarket_client.get_markets(limit=1, active=True, closed=False)
    if not raw:
        return {"error": "no markets from gamma"}
    m = raw[0]
    tokens = market_service._parse_tokens(m)
    return {
        "id": m.get("id"),
        "conditionId": m.get("conditionId"),
        "question": m.get("question", "")[:80],
        "clobTokenIds": m.get("clobTokenIds"),
        "clob_token_ids": m.get("clob_token_ids"),
        "outcomes": m.get("outcomes"),
        "outcomePrices": m.get("outcomePrices"),
        "parsed_tokens": tokens,
        "event_slug": market_service._extract_event_slug(m),
        "groupItemTitle": m.get("groupItemTitle"),
        "endDateIso": m.get("endDateIso"),
    }


@router.get("/{market_id}", response_model=MarketDetailResponse)
async def get_market(
    market_id: str,
    db: AsyncSession = Depends(get_db),
) -> MarketDetailResponse:
    """Get single market with current price data."""
    result = await market_service.get_market_detail(db, market_id=market_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Market not found",
        )
    return result
