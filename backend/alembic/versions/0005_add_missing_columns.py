"""add missing columns to users and positions

Revision ID: 0005
Revises: 0004
Create Date: 2026-02-27

Columns added via manual DDL during development that were never
captured in Alembic migrations:
- users: proxy_wallet, encrypted_private_key
- positions: title, slug, icon, redeemable, take_profit_price,
  stop_loss_price, tp_order_id
Also drops the FK from positions.market_id → markets.id because
Gamma API (markets) and Data API (positions) use different ID systems.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── Users: add proxy_wallet and encrypted_private_key ───
    op.add_column(
        "users",
        sa.Column(
            "proxy_wallet",
            sa.String(42),
            nullable=True,
            comment="Polymarket proxy wallet address on Polygon",
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "encrypted_private_key",
            sa.Text(),
            nullable=True,
            comment="Fernet-encrypted wallet private key for CLOB order signing",
        ),
    )

    # ─── Positions: add denormalized market info columns ───
    op.add_column(
        "positions",
        sa.Column(
            "title",
            sa.Text(),
            nullable=True,
            comment="Market question/title from Data API",
        ),
    )
    op.add_column(
        "positions",
        sa.Column(
            "slug",
            sa.String(255),
            nullable=True,
            comment="Market slug for URL",
        ),
    )
    op.add_column(
        "positions",
        sa.Column(
            "icon",
            sa.Text(),
            nullable=True,
            comment="Market icon URL from Data API",
        ),
    )
    op.add_column(
        "positions",
        sa.Column(
            "redeemable",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
            comment="True if market is resolved and position can be redeemed",
        ),
    )

    # ─── Positions: add trading columns (TP/SL) ───
    op.add_column(
        "positions",
        sa.Column(
            "take_profit_price",
            sa.Numeric(10, 6),
            nullable=True,
            comment="Target sell price for take profit (GTC limit order on CLOB)",
        ),
    )
    op.add_column(
        "positions",
        sa.Column(
            "stop_loss_price",
            sa.Numeric(10, 6),
            nullable=True,
            comment="Stop loss trigger price (monitored by scheduler)",
        ),
    )
    op.add_column(
        "positions",
        sa.Column(
            "tp_order_id",
            sa.String(256),
            nullable=True,
            comment="Polymarket CLOB order ID for active TP limit order",
        ),
    )

    # ─── Drop FK from positions.market_id → markets.id ───
    # Gamma API uses numeric id for markets, Data API uses conditionId (0x-hash)
    # These are different systems, so FK is invalid
    op.drop_constraint(
        "positions_market_id_fkey", "positions", type_="foreignkey"
    )


def downgrade() -> None:
    # Re-add FK
    op.create_foreign_key(
        "positions_market_id_fkey",
        "positions",
        "markets",
        ["market_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # Drop trading columns
    op.drop_column("positions", "tp_order_id")
    op.drop_column("positions", "stop_loss_price")
    op.drop_column("positions", "take_profit_price")

    # Drop market info columns
    op.drop_column("positions", "redeemable")
    op.drop_column("positions", "icon")
    op.drop_column("positions", "slug")
    op.drop_column("positions", "title")

    # Drop user columns
    op.drop_column("users", "encrypted_private_key")
    op.drop_column("users", "proxy_wallet")
