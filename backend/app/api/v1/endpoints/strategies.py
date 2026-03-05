"""Strategy endpoints — arbitrage scanner."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.strategy import (
    ArbitrageOpportunityResponse,
    ArbitrageScanResponse,
    BracketResponse,
)
from app.services.arbitrage_service import arbitrage_service

router = APIRouter(prefix="/strategies", tags=["strategies"])


@router.get("/arbitrage/scan", response_model=ArbitrageScanResponse)
async def scan_arbitrage(
    tail_threshold: float = Query(0.10, ge=0.01, le=0.50, description="Max YES price for tail"),
    min_brackets: int = Query(3, ge=2, le=20, description="Min brackets per event"),
    _current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ArbitrageScanResponse:
    """Scan multi-bracket events for tail-collecting arbitrage opportunities."""
    opportunities = await arbitrage_service.scan_opportunities(
        db, tail_threshold=tail_threshold, min_brackets=min_brackets,
    )

    return ArbitrageScanResponse(
        opportunities=[
            ArbitrageOpportunityResponse(
                event_slug=opp.event_slug,
                event_title=opp.event_title,
                image=opp.image,
                brackets=[
                    BracketResponse(
                        market_id=b.market_id,
                        question=b.question,
                        yes_price=b.yes_price,
                        no_price=b.no_price,
                        is_tail=b.is_tail,
                        profit_pct=b.profit_pct,
                        token_id_yes=b.token_id_yes,
                        token_id_no=b.token_id_no,
                    )
                    for b in opp.brackets
                ],
                sum_yes=opp.sum_yes,
                overround=opp.overround,
                tail_count=opp.tail_count,
                best_tail_profit=opp.best_tail_profit,
            )
            for opp in opportunities
        ],
        scanned_events=len(opportunities),
        tail_threshold=tail_threshold,
    )
