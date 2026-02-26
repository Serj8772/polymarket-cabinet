"""add_orders

Revision ID: 0004
Revises: 0003
Create Date: 2026-02-19
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "orders",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column(
            "market_id",
            sa.String(100),
            nullable=False,
            comment="Polymarket condition_id",
        ),
        sa.Column(
            "token_id",
            sa.String(256),
            nullable=False,
            comment="Polymarket CLOB token ID",
        ),
        sa.Column(
            "polymarket_order_id",
            sa.String(256),
            nullable=False,
            comment="Order ID from Polymarket CLOB",
        ),
        sa.Column("side", sa.String(10), nullable=False, comment="BUY or SELL"),
        sa.Column(
            "outcome",
            sa.String(50),
            nullable=False,
            comment="Yes / No / outcome name",
        ),
        sa.Column(
            "order_type",
            sa.String(20),
            nullable=False,
            server_default=sa.text("'LIMIT'"),
            comment="LIMIT / MARKET / FOK / GTC",
        ),
        sa.Column(
            "size",
            sa.Numeric(20, 6),
            nullable=False,
            server_default=sa.text("0"),
            comment="Order size in tokens",
        ),
        sa.Column(
            "price",
            sa.Numeric(10, 6),
            nullable=False,
            server_default=sa.text("0"),
            comment="Limit price per token",
        ),
        sa.Column(
            "size_filled",
            sa.Numeric(20, 6),
            nullable=False,
            server_default=sa.text("0"),
            comment="Amount already filled",
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default=sa.text("'LIVE'"),
            comment="LIVE / MATCHED / CANCELLED",
        ),
        sa.Column(
            "market_question",
            sa.Text(),
            nullable=True,
            comment="Denormalized market question for display",
        ),
        sa.Column(
            "placed_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="When order was placed on Polymarket",
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "user_id", "polymarket_order_id", name="uq_orders_user_pm_order"
        ),
        sa.UniqueConstraint("polymarket_order_id", name="uq_orders_pm_order_id"),
    )
    op.create_index(op.f("ix_orders_user_id"), "orders", ["user_id"])
    op.create_index(op.f("ix_orders_market_id"), "orders", ["market_id"])
    op.create_index(op.f("ix_orders_status"), "orders", ["status"])


def downgrade() -> None:
    op.drop_index(op.f("ix_orders_status"), table_name="orders")
    op.drop_index(op.f("ix_orders_market_id"), table_name="orders")
    op.drop_index(op.f("ix_orders_user_id"), table_name="orders")
    op.drop_table("orders")
