"""Trading request/response schemas — market sell, TP, SL."""

from pydantic import BaseModel, Field


class MarketSellRequest(BaseModel):
    """Request to sell a position at market price."""

    position_id: str = Field(..., description="UUID of the position to sell")


class TakeProfitRequest(BaseModel):
    """Request to set take profit for a position."""

    position_id: str = Field(..., description="UUID of the position")
    price: float = Field(
        ...,
        gt=0.0,
        lt=1.0,
        description="Take profit price (0.01 - 0.99)",
    )


class StopLossRequest(BaseModel):
    """Request to set stop loss for a position."""

    position_id: str = Field(..., description="UUID of the position")
    price: float = Field(
        ...,
        gt=0.0,
        lt=1.0,
        description="Stop loss trigger price (0.01 - 0.99)",
    )


class EditOrderPriceBody(BaseModel):
    """Request to edit an order's price."""

    new_price: float = Field(
        ...,
        gt=0.0,
        lt=1.0,
        description="New price (0.01 - 0.99)",
    )


class TradingResponse(BaseModel):
    """Response for trading operations."""

    success: bool
    message: str
    order_id: str | None = None
