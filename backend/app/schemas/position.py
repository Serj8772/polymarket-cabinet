"""Position / Portfolio request-response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, computed_field


class PositionResponse(BaseModel):
    """Single position with P&L calculations."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    market_id: str
    token_id: str
    outcome: str
    size: float
    avg_price: float
    current_price: float | None = None
    realized_pnl: float
    synced_at: datetime | None = None

    # Market info (from joined relationship)
    market_question: str | None = None
    market_image: str | None = None
    market_slug: str | None = None

    # Trading: TP/SL
    take_profit_price: float | None = None
    stop_loss_price: float | None = None
    tp_order_id: str | None = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cost_basis(self) -> float:
        """Total cost of entering the position."""
        return self.size * self.avg_price

    @computed_field  # type: ignore[prop-decorator]
    @property
    def current_value(self) -> float:
        """Current value of the position."""
        if self.current_price is None:
            return 0.0
        return self.size * self.current_price

    @computed_field  # type: ignore[prop-decorator]
    @property
    def unrealized_pnl(self) -> float:
        """Unrealized P&L = current_value - cost_basis."""
        return self.current_value - self.cost_basis

    @computed_field  # type: ignore[prop-decorator]
    @property
    def pnl_percent(self) -> float:
        """P&L percentage."""
        if self.cost_basis == 0:
            return 0.0
        return (self.unrealized_pnl / self.cost_basis) * 100


class PortfolioResponse(BaseModel):
    """Full portfolio summary with positions."""

    positions: list[PositionResponse]
    total_value: float
    total_cost: float
    total_unrealized_pnl: float
    total_realized_pnl: float
    total_pnl_percent: float
    positions_count: int
    cash_balance: float = 0.0
