"""Portfolio API endpoints — user positions and P&L."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.position import PortfolioResponse
from app.services.portfolio_service import portfolio_service

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("", response_model=PortfolioResponse)
async def get_portfolio(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PortfolioResponse:
    """Get user's portfolio with all positions and P&L.

    Returns positions from local DB. Use POST /portfolio/sync to
    refresh from Polymarket first.
    """
    return await portfolio_service.get_portfolio(db, current_user)


@router.post("/sync")
async def sync_portfolio(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Sync positions from Polymarket public Data API.

    Uses wallet address to fetch positions (no L2 creds needed).
    Fetches latest positions and upserts into local DB.
    """
    count = await portfolio_service.sync_positions(db, current_user)
    return {
        "synced_count": count,
        "message": f"Synced {count} positions from Polymarket",
    }
