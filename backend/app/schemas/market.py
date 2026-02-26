"""Market request/response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TokenInfo(BaseModel):
    """Token info within a market."""

    token_id: str
    outcome: str
    price: float | None = None


class MarketResponse(BaseModel):
    """Single market response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    question: str
    slug: str | None = None
    category: str | None = None
    end_date: datetime | None = None
    active: bool
    closed: bool
    tokens: list[TokenInfo] | None = None
    volume: float | None = None
    liquidity: float | None = None
    description: str | None = None
    image: str | None = None
    synced_at: datetime


class MarketDetailResponse(MarketResponse):
    """Market detail with live price data from CLOB API."""

    best_bid: float | None = None
    best_ask: float | None = None
    midpoint: float | None = None


class MarketListResponse(BaseModel):
    """Paginated market list."""

    markets: list[MarketResponse]
    total: int
    page: int
    page_size: int


class MarketSearchParams(BaseModel):
    """Query parameters for market filtering/search."""

    q: str | None = Field(None, description="Search query text")
    category: str | None = Field(None, description="Filter by category tag")
    active: bool | None = Field(None, description="Filter by active status")
    closed: bool | None = Field(None, description="Filter by closed status")
    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(20, ge=1, le=100, description="Items per page")
