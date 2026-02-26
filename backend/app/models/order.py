"""Order model — user's order history on Polymarket."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Order(Base, TimestampMixin):
    """User order (historical or active) on Polymarket CLOB."""

    __tablename__ = "orders"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "polymarket_order_id", name="uq_orders_user_pm_order"
        ),
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
        comment="Polymarket condition_id",
    )
    token_id: Mapped[str] = mapped_column(
        String(256),
        nullable=False,
        comment="Polymarket CLOB token ID",
    )
    polymarket_order_id: Mapped[str] = mapped_column(
        String(256),
        nullable=False,
        unique=True,
        comment="Order ID from Polymarket CLOB",
    )
    side: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        comment="BUY or SELL",
    )
    outcome: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Yes / No / outcome name",
    )
    order_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="LIMIT",
        comment="LIMIT / MARKET / FOK / GTC / STOP_LOSS / TAKE_PROFIT",
    )
    size: Mapped[float] = mapped_column(
        Numeric(20, 6),
        nullable=False,
        default=0,
        comment="Order size in tokens",
    )
    price: Mapped[float] = mapped_column(
        Numeric(10, 6),
        nullable=False,
        default=0,
        comment="Limit price per token",
    )
    size_filled: Mapped[float] = mapped_column(
        Numeric(20, 6),
        nullable=False,
        default=0,
        comment="Amount already filled",
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="LIVE",
        index=True,
        comment="LIVE / MATCHED / CANCELLED",
    )
    market_question: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Denormalized market question for display",
    )
    position_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("positions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Source position (for SL/TP orders)",
    )
    placed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="When order was placed on Polymarket",
    )

    def __repr__(self) -> str:
        return (
            f"<Order user={self.user_id} side={self.side} "
            f"size={self.size} status={self.status}>"
        )
