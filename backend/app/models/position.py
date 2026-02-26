"""Position model — user's holdings on Polymarket markets."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Position(Base, TimestampMixin):
    """User position (holding) on a specific market token."""

    __tablename__ = "positions"
    __table_args__ = (
        UniqueConstraint("user_id", "token_id", name="uq_positions_user_token"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    market_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="conditionId from Polymarket Data API (0x-hash)",
    )
    token_id: Mapped[str] = mapped_column(
        String(256),
        nullable=False,
        comment="Polymarket CLOB token ID",
    )
    outcome: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Yes / No / outcome name",
    )
    size: Mapped[float] = mapped_column(
        Numeric(20, 6),
        nullable=False,
        default=0,
        comment="Number of tokens held",
    )
    avg_price: Mapped[float] = mapped_column(
        Numeric(10, 6),
        nullable=False,
        default=0,
        comment="Average entry price per token",
    )
    current_price: Mapped[float | None] = mapped_column(
        Numeric(10, 6),
        nullable=True,
        comment="Cached current price (updated on sync)",
    )
    realized_pnl: Mapped[float] = mapped_column(
        Numeric(20, 6),
        nullable=False,
        default=0,
        comment="Realized P&L from closed trades",
    )
    synced_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Last sync from Polymarket",
    )

    # Denormalized market info from Data API (no FK to markets table)
    title: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Market question/title from Data API",
    )
    slug: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="Market slug for URL",
    )
    icon: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Market icon URL from Data API",
    )
    redeemable: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="True if market is resolved and position can be redeemed",
    )

    # Trading: Take Profit / Stop Loss
    take_profit_price: Mapped[float | None] = mapped_column(
        Numeric(10, 6),
        nullable=True,
        comment="Target sell price for take profit (GTC limit order on CLOB)",
    )
    stop_loss_price: Mapped[float | None] = mapped_column(
        Numeric(10, 6),
        nullable=True,
        comment="Stop loss trigger price (monitored by scheduler)",
    )
    tp_order_id: Mapped[str | None] = mapped_column(
        String(256),
        nullable=True,
        comment="Polymarket CLOB order ID for active TP limit order",
    )

    def __repr__(self) -> str:
        return f"<Position user={self.user_id} token={self.token_id} size={self.size}>"
