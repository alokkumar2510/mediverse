-- ============================================================
-- MediVerse AI — Complete PostgreSQL Schema
-- PostgreSQL 15+, UUID-native, Supabase-compatible
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast ILIKE searches

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE report_module AS ENUM ('xray', 'ecg', 'skin', 'diabetes', 'ocr', 'symptom');
CREATE TYPE report_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE upload_status AS ENUM ('uploaded', 'processed', 'failed');
CREATE TYPE feedback_status AS ENUM ('open', 'reviewed', 'closed');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'clinic');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trialing');
CREATE TYPE model_framework AS ENUM ('onnx', 'xgboost', 'sklearn', 'pytorch', 'stub');

-- ============================================================
-- TABLE: users
-- ============================================================

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name                VARCHAR(100)    NOT NULL,
    email               VARCHAR(255)    NOT NULL,
    password_hash       TEXT            NOT NULL,
    avatar_url          TEXT,

    -- OAuth readiness
    oauth_provider      VARCHAR(50),
    oauth_provider_id   VARCHAR(255),

    -- RBAC
    role                user_role       NOT NULL DEFAULT 'user',

    -- Account status
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    is_verified         BOOLEAN         NOT NULL DEFAULT FALSE,
    email_verified_at   TIMESTAMPTZ,

    -- Audit
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    last_login_at       TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT ck_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$')
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE UNIQUE INDEX uq_users_email_lower ON users (LOWER(email));
CREATE INDEX ix_users_role ON users (role);
CREATE INDEX ix_users_is_active ON users (is_active);
CREATE INDEX ix_users_created_at ON users (created_at DESC);
-- Trigram index for name search (admin panel)
CREATE INDEX ix_users_name_trgm ON users USING gin (name gin_trgm_ops);

-- ============================================================
-- TABLE: sessions
-- ============================================================

CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    token_hash      VARCHAR(64)     NOT NULL,   -- SHA-256 of refresh token
    device_name     VARCHAR(255),
    ip_address      VARCHAR(100),
    user_agent      TEXT,

    is_revoked      BOOLEAN         NOT NULL DEFAULT FALSE,
    expires_at      TIMESTAMPTZ     NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    last_used_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_sessions_token_hash UNIQUE (token_hash)
);

CREATE INDEX ix_sessions_user_id     ON sessions (user_id);
CREATE INDEX ix_sessions_token_hash  ON sessions (token_hash);
CREATE INDEX ix_sessions_is_revoked  ON sessions (is_revoked) WHERE is_revoked = FALSE;
CREATE INDEX ix_sessions_expires_at  ON sessions (expires_at);

-- ============================================================
-- TABLE: password_resets
-- ============================================================

CREATE TABLE password_resets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    token_hash  VARCHAR(64)     NOT NULL,   -- SHA-256 of emailed token
    is_used     BOOLEAN         NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMPTZ     NOT NULL,

    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    used_at     TIMESTAMPTZ,

    CONSTRAINT uq_password_resets_token UNIQUE (token_hash)
);

CREATE INDEX ix_password_resets_user_id    ON password_resets (user_id);
CREATE INDEX ix_password_resets_token_hash ON password_resets (token_hash);
-- Only index active (unused, unexpired) tokens
CREATE INDEX ix_password_resets_active     ON password_resets (token_hash)
    WHERE is_used = FALSE;

-- ============================================================
-- TABLE: reports
-- ============================================================

CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    module_type     report_module   NOT NULL,
    title           VARCHAR(255),

    -- Full structured AI result — JSONB for indexability
    result_json     JSONB           NOT NULL DEFAULT '{}',
    confidence      FLOAT CHECK (confidence BETWEEN 0.0 AND 1.0),

    -- Model tracking
    model_version_id UUID REFERENCES model_versions(id) ON DELETE SET NULL,

    status          report_status   NOT NULL DEFAULT 'completed',

    -- Soft delete — never hard-delete medical records
    is_deleted      BOOLEAN         NOT NULL DEFAULT FALSE,
    deleted_at      TIMESTAMPTZ,

    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX ix_reports_user_id          ON reports (user_id);
CREATE INDEX ix_reports_module_type      ON reports (module_type);
CREATE INDEX ix_reports_created_at       ON reports (created_at DESC);
CREATE INDEX ix_reports_user_module      ON reports (user_id, module_type);
CREATE INDEX ix_reports_not_deleted      ON reports (user_id, created_at DESC) WHERE is_deleted = FALSE;
-- JSONB GIN index for ad-hoc JSON queries
CREATE INDEX ix_reports_result_gin       ON reports USING gin (result_json);

-- ============================================================
-- TABLE: model_versions
-- (Referenced by reports — must be created before reports)
-- ============================================================

CREATE TABLE model_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    module_type     VARCHAR(50)     NOT NULL,
    version         VARCHAR(50)     NOT NULL,
    description     TEXT,
    artifact_path   TEXT,

    -- Metrics
    accuracy        FLOAT,
    auc_roc         FLOAT,
    precision       FLOAT,
    recall          FLOAT,

    framework       model_framework,

    -- Only one active model per module
    is_active       BOOLEAN         NOT NULL DEFAULT FALSE,

    released_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_model_version UNIQUE (module_type, version)
);

CREATE INDEX ix_model_versions_module     ON model_versions (module_type);
CREATE INDEX ix_model_versions_active     ON model_versions (module_type, is_active)
    WHERE is_active = TRUE;

-- ============================================================
-- TABLE: uploads
-- ============================================================

CREATE TABLE uploads (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    module_type VARCHAR(50),
    file_name   VARCHAR(255),
    file_url    TEXT,
    mime_type   VARCHAR(100),
    file_size   BIGINT CHECK (file_size > 0),

    status      upload_status   NOT NULL DEFAULT 'uploaded',

    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_uploads_user_id     ON uploads (user_id);
CREATE INDEX ix_uploads_created_at  ON uploads (created_at DESC);
CREATE INDEX ix_uploads_module_type ON uploads (module_type);

-- ============================================================
-- TABLE: feedback
-- ============================================================

CREATE TABLE feedback (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    rating      SMALLINT CHECK (rating BETWEEN 1 AND 5),
    message     TEXT,

    status      feedback_status NOT NULL DEFAULT 'open',

    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_feedback_user_id    ON feedback (user_id);
CREATE INDEX ix_feedback_status     ON feedback (status);
CREATE INDEX ix_feedback_created_at ON feedback (created_at DESC);

-- ============================================================
-- TABLE: usage_logs
-- ============================================================

CREATE TABLE usage_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,  -- nullable

    endpoint    VARCHAR(255)    NOT NULL,
    method      VARCHAR(10)     NOT NULL,
    latency_ms  INTEGER CHECK (latency_ms >= 0),
    status_code SMALLINT,
    ip_address  VARCHAR(100),

    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);  -- partition by month for scale

-- Initial partition covering current period
CREATE TABLE usage_logs_2026_q2 PARTITION OF usage_logs
    FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE usage_logs_2026_q3 PARTITION OF usage_logs
    FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE usage_logs_2026_q4 PARTITION OF usage_logs
    FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');
CREATE TABLE usage_logs_2027_q1 PARTITION OF usage_logs
    FOR VALUES FROM ('2027-01-01') TO ('2027-04-01');

CREATE INDEX ix_usage_logs_user_id    ON usage_logs (user_id);
CREATE INDEX ix_usage_logs_endpoint   ON usage_logs (endpoint);
CREATE INDEX ix_usage_logs_created_at ON usage_logs (created_at DESC);
CREATE INDEX ix_usage_logs_status     ON usage_logs (status_code);

-- ============================================================
-- TABLE: notifications
-- ============================================================

CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    title       VARCHAR(255)    NOT NULL,
    message     TEXT,
    is_read     BOOLEAN         NOT NULL DEFAULT FALSE,

    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_notifications_user_id  ON notifications (user_id);
CREATE INDEX ix_notifications_unread   ON notifications (user_id, created_at DESC)
    WHERE is_read = FALSE;

-- ============================================================
-- TABLE: subscriptions
-- ============================================================

CREATE TABLE subscriptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    plan        subscription_plan   NOT NULL DEFAULT 'free',
    status      subscription_status NOT NULL DEFAULT 'active',

    -- External billing reference (Stripe subscription ID, etc.)
    external_id VARCHAR(255),

    starts_at   TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ,

    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX ix_subscriptions_user_id   ON subscriptions (user_id);
CREATE INDEX ix_subscriptions_status    ON subscriptions (status);
CREATE INDEX ix_subscriptions_plan      ON subscriptions (plan);

-- ============================================================
-- TABLE: api_keys
-- ============================================================

CREATE TABLE api_keys (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name                    VARCHAR(255)    NOT NULL,
    prefix                  VARCHAR(12)     NOT NULL,
    key_hash                VARCHAR(64)     NOT NULL,
    scopes                  TEXT[],
    rate_limit_per_minute   INTEGER,

    is_active               BOOLEAN         NOT NULL DEFAULT TRUE,
    last_used_at            TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_api_keys_hash UNIQUE (key_hash)
);

CREATE INDEX ix_api_keys_user_id  ON api_keys (user_id);
CREATE INDEX ix_api_keys_hash     ON api_keys (key_hash);
CREATE INDEX ix_api_keys_active   ON api_keys (is_active) WHERE is_active = TRUE;

-- ============================================================
-- ROW LEVEL SECURITY (Supabase-ready, disabled by default)
-- Enable per table when using Supabase Auth:
--   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY "users_own_data" ON users
--       USING (id = auth.uid());
-- ============================================================

-- ============================================================
-- VIEWS — convenience for common queries
-- ============================================================

-- Active users with their latest subscription plan
CREATE VIEW v_active_users AS
SELECT
    u.id,
    u.name,
    u.email,
    u.role,
    u.is_verified,
    u.created_at,
    u.last_login_at,
    s.plan,
    s.status AS subscription_status
FROM users u
LEFT JOIN LATERAL (
    SELECT plan, status
    FROM subscriptions
    WHERE user_id = u.id
    ORDER BY created_at DESC
    LIMIT 1
) s ON TRUE
WHERE u.is_active = TRUE;

-- Report analytics summary per user
CREATE VIEW v_user_report_counts AS
SELECT
    user_id,
    module_type,
    COUNT(*) AS total_reports,
    AVG(confidence)::NUMERIC(5,4) AS avg_confidence,
    MAX(created_at) AS last_report_at
FROM reports
WHERE is_deleted = FALSE
GROUP BY user_id, module_type;

-- Admin dashboard stats
CREATE VIEW v_platform_stats AS
SELECT
    (SELECT COUNT(*) FROM users WHERE is_active = TRUE)               AS active_users,
    (SELECT COUNT(*) FROM reports WHERE is_deleted = FALSE)           AS total_reports,
    (SELECT COUNT(*) FROM reports WHERE created_at > NOW() - INTERVAL '24 hours') AS reports_today,
    (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days')     AS new_users_7d;
