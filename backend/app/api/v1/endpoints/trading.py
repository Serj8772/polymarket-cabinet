"""Trading API endpoints — market sell, take profit, stop loss."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.trading import (
    EditOrderPriceBody,
    MarketSellRequest,
    StopLossRequest,
    TakeProfitRequest,
    TradingResponse,
)
from app.services.trading_service import trading_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/trading", tags=["trading"])


def _require_trading_setup(user: User) -> None:
    """Verify user has private key and API creds for trading."""
    if not user.has_private_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Private key not configured. Go to Settings → Trading Key.",
        )
    if not user.has_polymarket_creds:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Polymarket API credentials not configured. Go to Settings.",
        )


@router.post("/market-sell", response_model=TradingResponse)
async def market_sell(
    body: MarketSellRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TradingResponse:
    """Sell entire position at current market price (FOK order)."""
    _require_trading_setup(current_user)

    try:
        result = await trading_service.market_sell(
            db, current_user, body.position_id,
        )
        return TradingResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception:
        logger.exception("Market sell failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Market sell failed. Please try again later.",
        )


@router.post("/take-profit", response_model=TradingResponse)
async def set_take_profit(
    body: TakeProfitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TradingResponse:
    """Set take profit — places a GTC sell limit order on Polymarket CLOB."""
    _require_trading_setup(current_user)

    try:
        result = await trading_service.set_take_profit(
            db, current_user, body.position_id, body.price,
        )
        return TradingResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception:
        logger.exception("Set take profit failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Set take profit failed. Please try again later.",
        )


@router.delete("/take-profit/{position_id}", response_model=TradingResponse)
async def cancel_take_profit(
    position_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TradingResponse:
    """Cancel take profit — cancels the GTC order on CLOB."""
    _require_trading_setup(current_user)

    try:
        result = await trading_service.cancel_take_profit(
            db, current_user, position_id,
        )
        return TradingResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception:
        logger.exception("Cancel take profit failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cancel take profit failed. Please try again later.",
        )


@router.post("/stop-loss", response_model=TradingResponse)
async def set_stop_loss(
    body: StopLossRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TradingResponse:
    """Set stop loss — price is monitored by backend, auto-sells when triggered."""
    # SL only needs private key for execution, not for setting
    try:
        result = await trading_service.set_stop_loss(
            db, current_user, body.position_id, body.price,
        )
        return TradingResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception:
        logger.exception("Set stop loss failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Set stop loss failed. Please try again later.",
        )


@router.delete("/stop-loss/{position_id}", response_model=TradingResponse)
async def remove_stop_loss(
    position_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TradingResponse:
    """Remove stop loss monitoring for a position."""
    try:
        result = await trading_service.remove_stop_loss(
            db, current_user, position_id,
        )
        return TradingResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception:
        logger.exception("Remove stop loss failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Remove stop loss failed. Please try again later.",
        )


# --- Order edit / cancel (from Orders page) ---


@router.put("/orders/{order_id}", response_model=TradingResponse)
async def edit_order(
    order_id: str,
    body: EditOrderPriceBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TradingResponse:
    """Edit order price — cancel + recreate for CLOB orders, direct update for SL."""
    _require_trading_setup(current_user)

    try:
        result = await trading_service.edit_order(
            db, current_user, order_id, body.new_price,
        )
        return TradingResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception:
        logger.exception("Edit order failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Edit order failed. Please try again later.",
        )


@router.delete("/orders/{order_id}", response_model=TradingResponse)
async def cancel_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TradingResponse:
    """Cancel a LIVE order — cancels on CLOB or clears SL from position."""
    _require_trading_setup(current_user)

    try:
        result = await trading_service.cancel_order(
            db, current_user, order_id,
        )
        return TradingResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception:
        logger.exception("Cancel order failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cancel order failed. Please try again later.",
        )
