"""add users.auto_sl_percent column

Revision ID: 0007
Revises: 0006
Create Date: 2026-03-04

Adds auto stop-loss percentage setting per user.
Idempotent — skips if column already exists.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("users")]

    if "auto_sl_percent" not in columns:
        op.add_column(
            "users",
            sa.Column(
                "auto_sl_percent",
                sa.Numeric(5, 2),
                nullable=True,
                comment="Auto stop-loss percentage below entry price (e.g. 15.0 = -15%)",
            ),
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("users")]

    if "auto_sl_percent" in columns:
        op.drop_column("users", "auto_sl_percent")
