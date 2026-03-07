"""Strategy schemas — arbitrage scanner request/response models."""

from pydantic import BaseModel, Field


class BracketResponse(BaseModel):
    """Single bracket within a multi-outcome event."""

    market_id: str
    question: str
    yes_price: float
    no_price: float
    is_tail: bool
    profit_pct: float = Field(description="ROI % when buying NO on this tail")
    token_id_yes: str | None = None
    token_id_no: str | None = None


class ArbitrageOpportunityResponse(BaseModel):
    """Multi-bracket event with arbitrage metrics."""

    event_slug: str
    event_title: str
    image: str | None = None
    brackets: list[BracketResponse]
    sum_yes: float = Field(description="Sum of all YES prices (ideal = 1.0)")
    overround: float = Field(description="sum_yes - 1.0")
    tail_count: int
    best_tail_profit: float
    volume: float = Field(default=0.0, description="Sum of all brackets' volumes")
    end_date: str | None = Field(default=None, description="Earliest expiration (ISO)")


class ArbitrageScanResponse(BaseModel):
    """Response for arbitrage scan endpoint."""

    opportunities: list[ArbitrageOpportunityResponse]
    scanned_events: int
    tail_threshold: float
