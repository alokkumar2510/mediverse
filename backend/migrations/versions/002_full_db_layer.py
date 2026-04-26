"""002_full_database_layer

Revision ID: 002_full_db_layer
Revises: 001_initial_schema
Create Date: 2026-04-25

Adds: sessions, password_resets, model_versions, api_keys
Upgrades: users (oauth fields, last_login_at, email_verified_at)
Upgrades: reports (model_version_id FK, deleted_at, JSONB result_json)
Upgrades: subscriptions (external_id)
Adds: database views, pg_trgm extension, updated_at triggers
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# ---------------------------------------------------------------------------
revision: str = "002_full_db_layer"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None
# ---------------------------------------------------------------------------


def upgrade() -> None:
    conn = op.get_bind()

    # ── Extensions ────────────────────────────────────────────────────────────
    if conn.dialect.name == "postgresql":
        conn.execute(sa.text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))

    # ── Shared updated_at trigger function ────────────────────────────────────
    if conn.dialect.name == "postgresql":
        conn.execute(sa.text("""
            CREATE OR REPLACE FUNCTION update_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        """))

    # ── ENUMs ─────────────────────────────────────────────────────────────────
    if conn.dialect.name == "postgresql":
        for enum_name, values in [
            ("user_role",            ["user", "admin"]),
            ("report_module",        ["xray", "ecg", "skin", "diabetes", "ocr", "symptom"]),
            ("report_status",        ["pending", "completed", "failed"]),
            ("upload_status",        ["uploaded", "processed", "failed"]),
            ("feedback_status",      ["open", "reviewed", "closed"]),
            ("subscription_plan",    ["free", "pro", "clinic"]),
            ("subscription_status",  ["active", "cancelled", "expired", "trialing"]),
            ("model_framework",      ["onnx", "xgboost", "sklearn", "pytorch", "stub"]),
        ]:
            vals = ", ".join(f"'{v}'" for v in values)
            conn.execute(sa.text(
                f"DO $$ BEGIN CREATE TYPE {enum_name} AS ENUM ({vals}); "
                f"EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
            ))

    # ── Upgrade: users ────────────────────────────────────────────────────────
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("oauth_provider",    sa.String(50),  nullable=True))
        batch_op.add_column(sa.Column("oauth_provider_id", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("last_login_at",     sa.DateTime(timezone=True), nullable=True))
        
    # Trigram index for name search
    if conn.dialect.name == "postgresql":
        conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_users_name_trgm ON users USING gin (name gin_trgm_ops)"))
        conn.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (LOWER(email))"))
        conn.execute(sa.text("""
            CREATE TRIGGER trg_users_updated_at
                BEFORE UPDATE ON users
                FOR EACH ROW EXECUTE FUNCTION update_updated_at();
        """))

    # ── New table: model_versions (referenced by reports) ─────────────────────
    op.create_table(
        "model_versions",
        sa.Column("id",           postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("module_type",  sa.String(50),  nullable=False),
        sa.Column("version",      sa.String(50),  nullable=False),
        sa.Column("description",  sa.Text,        nullable=True),
        sa.Column("artifact_path",sa.Text,        nullable=True),
        sa.Column("accuracy",     sa.Float,       nullable=True),
        sa.Column("auc_roc",      sa.Float,       nullable=True),
        sa.Column("precision",    sa.Float,       nullable=True),
        sa.Column("recall",       sa.Float,       nullable=True),
        sa.Column("framework",    sa.String(50),  nullable=True),
        sa.Column("is_active",    sa.Boolean,     nullable=False, server_default=sa.false()),
        sa.Column("released_at",  sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at",   sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("module_type", "version", name="uq_model_version"),
    )
    op.create_index("ix_model_versions_module", "model_versions", ["module_type"])

    # ── Upgrade: reports ──────────────────────────────────────────────────────
    with op.batch_alter_table("reports") as batch_op:
        batch_op.add_column(sa.Column(
            "model_version_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("model_versions.id", ondelete="SET NULL"),
            nullable=True,
        ))
        batch_op.add_column(sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
        
    # Convert result_json from JSON → JSONB for GIN indexability
    if conn.dialect.name == "postgresql":
        conn.execute(sa.text(
            "ALTER TABLE reports ALTER COLUMN result_json TYPE JSONB USING result_json::JSONB"
        ))
        conn.execute(sa.text(
            "CREATE INDEX IF NOT EXISTS ix_reports_result_gin ON reports USING gin (result_json)"
        ))
        conn.execute(sa.text("""
            CREATE TRIGGER trg_reports_updated_at
                BEFORE UPDATE ON reports
                FOR EACH ROW EXECUTE FUNCTION update_updated_at();
        """))

    # ── New table: sessions ───────────────────────────────────────────────────
    op.create_table(
        "sessions",
        sa.Column("id",           postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id",      postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash",   sa.String(64),  nullable=False),
        sa.Column("device_name",  sa.String(255), nullable=True),
        sa.Column("ip_address",   sa.String(100), nullable=True),
        sa.Column("user_agent",   sa.Text,        nullable=True),
        sa.Column("is_revoked",   sa.Boolean,     nullable=False, server_default=sa.false()),
        sa.Column("expires_at",   sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at",   sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_used_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("token_hash", name="uq_sessions_token_hash"),
    )
    op.create_index("ix_sessions_user_id",    "sessions", ["user_id"])
    op.create_index("ix_sessions_token_hash", "sessions", ["token_hash"])
    if conn.dialect.name == "postgresql":
        conn.execute(sa.text(
            "CREATE INDEX ix_sessions_active ON sessions (user_id, expires_at) WHERE is_revoked = FALSE"
        ))

    # ── New table: password_resets ────────────────────────────────────────────
    op.create_table(
        "password_resets",
        sa.Column("id",         postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id",    postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(64),  nullable=False),
        sa.Column("is_used",    sa.Boolean,     nullable=False, server_default=sa.false()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("used_at",    sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("token_hash", name="uq_password_resets_token"),
    )
    op.create_index("ix_password_resets_user_id",    "password_resets", ["user_id"])
    op.create_index("ix_password_resets_token_hash", "password_resets", ["token_hash"])

    # ── New table: api_keys ───────────────────────────────────────────────────
    op.create_table(
        "api_keys",
        sa.Column("id",                    postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id",               postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name",                  sa.String(255),   nullable=False),
        sa.Column("prefix",                sa.String(12),    nullable=False),
        sa.Column("key_hash",              sa.String(64),    nullable=False),
        sa.Column("scopes",                sa.JSON,          nullable=True),
        sa.Column("rate_limit_per_minute", sa.Integer,       nullable=True),
        sa.Column("is_active",             sa.Boolean,       nullable=False, server_default=sa.true()),
        sa.Column("last_used_at",          sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at",            sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at",            sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("key_hash", name="uq_api_keys_hash"),
    )
    op.create_index("ix_api_keys_user_id", "api_keys", ["user_id"])
    op.create_index("ix_api_keys_hash",    "api_keys", ["key_hash"])

    # ── Upgrade: subscriptions ────────────────────────────────────────────────
    with op.batch_alter_table("subscriptions") as batch_op:
        batch_op.add_column(sa.Column("external_id", sa.String(255), nullable=True))
        batch_op.add_column(sa.Column("updated_at",  sa.DateTime(timezone=True),
                                                  server_default=sa.func.now(), nullable=True))
    if conn.dialect.name == "postgresql":
        conn.execute(sa.text("""
            CREATE TRIGGER trg_subscriptions_updated_at
                BEFORE UPDATE ON subscriptions
                FOR EACH ROW EXECUTE FUNCTION update_updated_at();
        """))

    # ── Views ─────────────────────────────────────────────────────────────────
    if conn.dialect.name == "postgresql":
        conn.execute(sa.text("""
            CREATE OR REPLACE VIEW v_active_users AS
            SELECT
                u.id, u.name, u.email, u.role, u.is_verified,
                u.created_at, u.last_login_at,
                s.plan, s.status AS subscription_status
            FROM users u
            LEFT JOIN LATERAL (
                SELECT plan, status FROM subscriptions
                WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
            ) s ON TRUE
            WHERE u.is_active = TRUE;
        """))

        conn.execute(sa.text("""
            CREATE OR REPLACE VIEW v_user_report_counts AS
            SELECT
                user_id, module_type,
                COUNT(*) AS total_reports,
                ROUND(AVG(confidence)::NUMERIC, 4) AS avg_confidence,
                MAX(created_at) AS last_report_at
            FROM reports
            WHERE is_deleted = FALSE
            GROUP BY user_id, module_type;
        """))

        conn.execute(sa.text("""
            CREATE OR REPLACE VIEW v_platform_stats AS
            SELECT
                (SELECT COUNT(*) FROM users WHERE is_active = TRUE)                             AS active_users,
                (SELECT COUNT(*) FROM reports WHERE is_deleted = FALSE)                         AS total_reports,
                (SELECT COUNT(*) FROM reports WHERE created_at > NOW() - INTERVAL '24 hours')   AS reports_today,
                (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days')       AS new_users_7d;
        """))


def downgrade() -> None:
    conn = op.get_bind()

    # Drop views first
    for view in ["v_platform_stats", "v_user_report_counts", "v_active_users"]:
        conn.execute(sa.text(f"DROP VIEW IF EXISTS {view} CASCADE"))

    # Drop triggers
    for table, trigger in [
        ("subscriptions", "trg_subscriptions_updated_at"),
        ("reports",       "trg_reports_updated_at"),
        ("users",         "trg_users_updated_at"),
    ]:
        conn.execute(sa.text(f"DROP TRIGGER IF EXISTS {trigger} ON {table}"))

    # Drop new tables
    for t in ["api_keys", "password_resets", "sessions"]:
        op.drop_table(t)

    # Drop model_versions (after removing FK from reports)
    op.drop_column("reports", "model_version_id")
    op.drop_column("reports", "deleted_at")
    op.drop_table("model_versions")

    # Revert users columns
    for col in ["oauth_provider", "oauth_provider_id", "email_verified_at", "last_login_at"]:
        op.drop_column("users", col)

    # Drop extensions (careful in production!)
    # conn.execute(sa.text("DROP EXTENSION IF EXISTS pg_trgm"))
