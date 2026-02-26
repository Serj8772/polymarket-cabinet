"""add_positions

Revision ID: 0003
Revises: 0002
Create Date: 2026-02-17
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "positions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("market_id", sa.String(100), nullable=False),
        sa.Column("token_id", sa.String(256), nullable=False, comment="Polymarket CLOB token ID"),
        sa.Column("outcome", sa.String(50), nullable=False, comment="Yes / No / outcome name"),
        sa.Column("size", sa.Numeric(20, 6), nullable=False, server_default=sa.text("0"), comment="Number of tokens held"),
        sa.Column("avg_price", sa.Numeric(10, 6), nullable=False, server_default=sa.text("0"), comment="Average entry price per token"),
        sa.Column("current_price", sa.Numeric(10, 6), nullable=True, comment="Cached current price (updated on sync)"),
        sa.Column("realized_pnl", sa.Numeric(20, 6), nullable=False, server_default=sa.text("0"), comment="Realized P&L from closed trades"),
        sa.Column("synced_at", sa.DateTime(timezone=True), nullable=True, comment="Last sync from Polymarket"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["market_id"], ["markets.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "token_id", name="uq_positions_user_token"),
    )
    op.create_index(op.f("ix_positions_user_id"), "positions", ["user_id"])
    op.create_index(op.f("ix_positions_market_id"), "positions", ["market_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_positions_market_id"), table_name="positions")
    op.drop_index(op.f("ix_positions_user_id"), table_name="positions")
    op.drop_table("positions")
