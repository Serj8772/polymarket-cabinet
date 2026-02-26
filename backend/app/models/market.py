"""Market model — cached Polymarket market data."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Market(Base, TimestampMixin):
    """Cached market data from Polymarket Gamma API."""

    __tablename__ = "markets"

    id: Mapped[str] = mapped_column(
        String(100),
        primary_key=True,
        comment="condition_id from Polymarket",
    )
    question: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Market question text",
    )
    slug: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )
    end_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    closed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    tokens: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="[{token_id, outcome, price}] from Polymarket",
    )
    volume: Mapped[float | None] = mapped_column(
        Numeric,
        nullable=True,
    )
    liquidity: Mapped[float | None] = mapped_column(
        Numeric,
        nullable=True,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    image: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Market image URL",
    )
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Market {self.id}: {self.question[:50]}>"
