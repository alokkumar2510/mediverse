-- ============================================================
-- MediVerse AI — Common Query Examples
-- Optimized for PostgreSQL 15+ with the schema in schema.sql
-- ============================================================


-- ── AUTH QUERIES ──────────────────────────────────────────────────────────────

-- 1. Login: find user by email (case-insensitive)
SELECT id, name, email, password_hash, role, is_active, is_verified
FROM users
WHERE LOWER(email) = LOWER($1)
LIMIT 1;
-- Uses: uq_users_email_lower (unique index on LOWER(email))

-- 2. Validate a refresh token session
SELECT s.id, s.user_id, s.expires_at, s.is_revoked, u.role, u.is_active
FROM sessions s
JOIN users u ON u.id = s.user_id
WHERE s.token_hash = $1
  AND s.is_revoked = FALSE
  AND s.expires_at > NOW();
-- Uses: ix_sessions_token_hash, ix_sessions_active (partial index)

-- 3. Revoke all sessions for a user (force logout all devices)
UPDATE sessions
SET is_revoked = TRUE
WHERE user_id = $1
  AND is_revoked = FALSE;

-- 4. Validate a password reset token
SELECT id, user_id, expires_at, is_used
FROM password_resets
WHERE token_hash = $1
  AND is_used = FALSE
  AND expires_at > NOW();
-- Uses: ix_password_resets_active (partial WHERE is_used = FALSE)


-- ── USER QUERIES ──────────────────────────────────────────────────────────────

-- 5. Admin: search users by name (trigram fuzzy search)
SELECT id, name, email, role, is_active, created_at
FROM users
WHERE name % $1          -- pg_trgm similarity operator
ORDER BY similarity(name, $1) DESC
LIMIT 20;
-- Uses: ix_users_name_trgm (GIN trigram index)

-- 6. Admin: active users with current plan
SELECT * FROM v_active_users
ORDER BY created_at DESC
LIMIT 50 OFFSET $1;


-- ── REPORT QUERIES ────────────────────────────────────────────────────────────

-- 7. List user's reports (paginated, newest first, exclude soft-deleted)
SELECT id, module_type, title, confidence, status, created_at
FROM reports
WHERE user_id = $1
  AND is_deleted = FALSE
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
-- Uses: ix_reports_not_deleted (partial index)

-- 8. Filter reports by module type
SELECT id, title, result_json, confidence, created_at
FROM reports
WHERE user_id = $1
  AND module_type = $2
  AND is_deleted = FALSE
ORDER BY created_at DESC
LIMIT 20;
-- Uses: ix_reports_user_module

-- 9. JSONB query — find all reports where risk_level = 'high'
SELECT id, user_id, module_type, result_json, created_at
FROM reports
WHERE result_json->>'risk_level' = 'high'
  AND is_deleted = FALSE;
-- Uses: ix_reports_result_gin (GIN index on result_json)

-- 10. Soft delete a report (never hard-delete medical data)
UPDATE reports
SET is_deleted = TRUE, deleted_at = NOW()
WHERE id = $1
  AND user_id = $2;

-- 11. Admin: report counts by module (last 30 days)
SELECT
    module_type,
    COUNT(*) AS total,
    ROUND(AVG(confidence)::NUMERIC, 3) AS avg_confidence,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed_count
FROM reports
WHERE created_at > NOW() - INTERVAL '30 days'
  AND is_deleted = FALSE
GROUP BY module_type
ORDER BY total DESC;


-- ── ANALYTICS QUERIES ─────────────────────────────────────────────────────────

-- 12. Platform stats snapshot (uses materialized view pattern)
SELECT * FROM v_platform_stats;

-- 13. Daily active users (last 14 days)
SELECT
    created_at::DATE AS day,
    COUNT(DISTINCT user_id) AS dau
FROM usage_logs
WHERE created_at > NOW() - INTERVAL '14 days'
  AND user_id IS NOT NULL
GROUP BY 1
ORDER BY 1 DESC;

-- 14. API error rate per endpoint (last 24h)
SELECT
    endpoint,
    method,
    COUNT(*) AS total_requests,
    COUNT(*) FILTER (WHERE status_code >= 500) AS errors,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status_code >= 500) / COUNT(*), 2) AS error_pct,
    ROUND(AVG(latency_ms)::NUMERIC, 0) AS avg_latency_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms
FROM usage_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY endpoint, method
ORDER BY error_pct DESC, total_requests DESC;

-- 15. User report history with model version info
SELECT
    r.id,
    r.module_type,
    r.title,
    r.confidence,
    r.status,
    r.created_at,
    mv.version AS model_version,
    mv.accuracy AS model_accuracy
FROM reports r
LEFT JOIN model_versions mv ON mv.id = r.model_version_id
WHERE r.user_id = $1
  AND r.is_deleted = FALSE
ORDER BY r.created_at DESC;


-- ── SUBSCRIPTION QUERIES ──────────────────────────────────────────────────────

-- 16. Get user's current active subscription
SELECT plan, status, expires_at
FROM subscriptions
WHERE user_id = $1
  AND status = 'active'
ORDER BY created_at DESC
LIMIT 1;

-- 17. Expiring subscriptions in next 7 days (for renewal reminders)
SELECT
    u.email,
    u.name,
    s.plan,
    s.expires_at
FROM subscriptions s
JOIN users u ON u.id = s.user_id
WHERE s.status = 'active'
  AND s.expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days';


-- ── MAINTENANCE QUERIES ───────────────────────────────────────────────────────

-- 18. Purge expired (> 90 days) revoked sessions
DELETE FROM sessions
WHERE is_revoked = TRUE
  AND created_at < NOW() - INTERVAL '90 days';

-- 19. Expire unused password reset tokens
DELETE FROM password_resets
WHERE expires_at < NOW()
  AND is_used = FALSE;

-- 20. Table size analysis
SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS index_size,
    n_live_tup AS live_rows
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
