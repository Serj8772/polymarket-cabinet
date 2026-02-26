"""PriceSnapshot model — periodic price captures for charting."""

from datetime import datetime

from sqlalchemy import DateTime, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PriceSnapshot(Base):
    """Point-in-time price capture for a market token."""

    __tablename__ = "price_snapshots"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    token_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="Polymarket token ID",
    )
    price: Mapped[float] = mapped_column(
        Numeric(10, 6),
        nullable=False,
        comment="Midpoint price at snapshot time",
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_snapshots_token_ts", "token_id", timestamp.desc()),
    )

    def __repr__(self) -> str:
        return f"<PriceSnapshot {self.token_id} @ {self.price}>"
