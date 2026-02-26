"""add_markets_and_price_snapshots

Revision ID: 0002
Revises: 0001
Create Date: 2026-02-16
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Markets table
    op.create_table(
        "markets",
        sa.Column("id", sa.String(100), nullable=False, comment="condition_id from Polymarket"),
        sa.Column("question", sa.Text(), nullable=False, comment="Market question text"),
        sa.Column("slug", sa.String(255), nullable=True),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("closed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("tokens", JSONB(), nullable=True, comment="[{token_id, outcome, price}] from Polymarket"),
        sa.Column("volume", sa.Numeric(), nullable=True),
        sa.Column("liquidity", sa.Numeric(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image", sa.Text(), nullable=True, comment="Market image URL"),
        sa.Column("synced_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_markets_slug"), "markets", ["slug"])
    op.create_index(op.f("ix_markets_category"), "markets", ["category"])

    # Price snapshots table
    op.create_table(
        "price_snapshots",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("token_id", sa.String(100), nullable=False, comment="Polymarket token ID"),
        sa.Column("price", sa.Numeric(10, 6), nullable=False, comment="Midpoint price at snapshot time"),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_price_snapshots_token_id"), "price_snapshots", ["token_id"])
    op.create_index("idx_snapshots_token_ts", "price_snapshots", ["token_id", sa.text("timestamp DESC")])


def downgrade() -> None:
    op.drop_index("idx_snapshots_token_ts", table_name="price_snapshots")
    op.drop_index(op.f("ix_price_snapshots_token_id"), table_name="price_snapshots")
    op.drop_table("price_snapshots")
    op.drop_index(op.f("ix_markets_category"), table_name="markets")
    op.drop_index(op.f("ix_markets_slug"), table_name="markets")
    op.drop_table("markets")
