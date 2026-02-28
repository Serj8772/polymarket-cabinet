"""add orders.position_id column

Revision ID: 0006
Revises: 0005
Create Date: 2026-02-28

Migration 0005 was deployed without this column initially.
This migration is idempotent — skips if column already exists.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("orders")]

    if "position_id" not in columns:
        op.add_column(
            "orders",
            sa.Column(
                "position_id",
                sa.UUID(),
                nullable=True,
                comment="Source position (for SL/TP orders)",
            ),
        )
        op.create_foreign_key(
            "fk_orders_position_id",
            "orders",
            "positions",
            ["position_id"],
            ["id"],
            ondelete="SET NULL",
        )
        op.create_index(
            op.f("ix_orders_position_id"), "orders", ["position_id"]
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("orders")]

    if "position_id" in columns:
        op.drop_index(op.f("ix_orders_position_id"), table_name="orders")
        op.drop_constraint("fk_orders_position_id", "orders", type_="foreignkey")
        op.drop_column("orders", "position_id")
