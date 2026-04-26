"""
Alembic migration — Add starred, archived, tags, notes, updated_at to reports.
Run: alembic upgrade head
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


revision = "a1b2_reports_v2"
down_revision = None   # Set to previous migration ID if applicable
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns (idempotent-friendly with try/except in real deployments)
    op.add_column("reports", sa.Column("is_starred",  sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("reports", sa.Column("is_archived", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("reports", sa.Column("tags",        JSON(),       nullable=False, server_default="[]"))
    op.add_column("reports", sa.Column("notes",       sa.Text(),    nullable=True))
    op.add_column("reports", sa.Column(
        "updated_at",
        sa.DateTime(timezone=True),
        nullable=False,
        server_default=sa.text("NOW()"),
    ))

    # Composite indexes for the hot query paths
    op.create_index(
        "ix_reports_user_module_deleted",
        "reports", ["user_id", "module_type", "is_deleted"],
    )
    op.create_index(
        "ix_reports_user_starred",
        "reports", ["user_id", "is_starred"],
    )
    op.create_index(
        "ix_reports_user_created",
        "reports", ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_reports_user_created",       table_name="reports")
    op.drop_index("ix_reports_user_starred",       table_name="reports")
    op.drop_index("ix_reports_user_module_deleted", table_name="reports")
    op.drop_column("reports", "updated_at")
    op.drop_column("reports", "notes")
    op.drop_column("reports", "tags")
    op.drop_column("reports", "is_archived")
    op.drop_column("reports", "is_starred")
