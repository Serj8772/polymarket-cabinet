"""User model for Web3-authenticated users."""

import uuid

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    """User authenticated via MetaMask wallet."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    wallet_address: Mapped[str] = mapped_column(
        String(42),
        unique=True,
        index=True,
        nullable=False,
        comment="Ethereum wallet address (0x...)",
    )

    # Encrypted Polymarket L2 API credentials (optional)
    encrypted_api_key: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Fernet-encrypted Polymarket API key",
    )
    encrypted_api_secret: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Fernet-encrypted Polymarket API secret",
    )
    encrypted_passphrase: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Fernet-encrypted Polymarket API passphrase",
    )

    @property
    def has_polymarket_creds(self) -> bool:
        """Check if user has linked Polymarket API credentials."""
        return all([
            self.encrypted_api_key,
            self.encrypted_api_secret,
            self.encrypted_passphrase,
        ])

    def __repr__(self) -> str:
        return f"<User {self.wallet_address}>"
