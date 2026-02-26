"""Order request-response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, computed_field


class OrderResponse(BaseModel):
    """Single order with computed fields."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    market_id: str
    token_id: str
    polymarket_order_id: str
    side: str
    outcome: str
    order_type: str
    size: float
    price: float
    size_filled: float
    status: str
    market_question: str | None = None
    position_id: str | None = None
    placed_at: datetime | None = None
    created_at: datetime | None = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def fill_percent(self) -> float:
        """Percentage of order filled."""
        if self.size == 0:
            return 0.0
        return (self.size_filled / self.size) * 100

    @computed_field  # type: ignore[prop-decorator]
    @property
    def total_cost(self) -> float:
        """Total cost of the order = size × price."""
        return self.size * self.price

    @computed_field  # type: ignore[prop-decorator]
    @property
    def filled_cost(self) -> float:
        """Cost of filled portion = size_filled × price."""
        return self.size_filled * self.price


class OrderListResponse(BaseModel):
    """Paginated list of orders with summary."""

    orders: list[OrderResponse]
    total: int
    page: int
    page_size: int
    # Summary
    total_live: int = 0
    total_matched: int = 0
    total_cancelled: int = 0
