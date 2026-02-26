"""init_users_table

Revision ID: 0001
Revises:
Create Date: 2026-02-16
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "wallet_address",
            sa.String(42),
            nullable=False,
            comment="Ethereum wallet address (0x...)",
        ),
        sa.Column(
            "encrypted_api_key",
            sa.Text(),
            nullable=True,
            comment="Fernet-encrypted Polymarket API key",
        ),
        sa.Column(
            "encrypted_api_secret",
            sa.Text(),
            nullable=True,
            comment="Fernet-encrypted Polymarket API secret",
        ),
        sa.Column(
            "encrypted_passphrase",
            sa.Text(),
            nullable=True,
            comment="Fernet-encrypted Polymarket API passphrase",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("wallet_address"),
    )
    op.create_index(
        op.f("ix_users_wallet_address"),
        "users",
        ["wallet_address"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_users_wallet_address"), table_name="users")
    op.drop_table("users")
