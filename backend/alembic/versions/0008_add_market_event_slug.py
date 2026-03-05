"""add markets.event_slug column

Revision ID: 0008
Revises: 0007
Create Date: 2026-03-04

Adds event_slug for grouping related bracket markets.
Idempotent — skips if column already exists.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("markets")]

    if "event_slug" not in columns:
        op.add_column(
            "markets",
            sa.Column("event_slug", sa.String(255), nullable=True,
                       comment="Event slug for grouping related bracket markets"),
        )
        op.create_index("ix_markets_event_slug", "markets", ["event_slug"])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("markets")]

    if "event_slug" in columns:
        op.drop_index("ix_markets_event_slug", "markets")
        op.drop_column("markets", "event_slug")
