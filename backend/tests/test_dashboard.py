"""
Tests for /api/dashboard/* and /api/notifications endpoints.
"""
import pytest
from httpx import AsyncClient


# ── Dashboard summary ──────────────────────────────────────────────────────────

async def test_dashboard_summary_authenticated(authed_client: AsyncClient):
    res = await authed_client.get("/api/dashboard/summary")
    assert res.status_code == 200
    body = res.json()
    assert "total_reports" in body
    assert "reports_this_month" in body
    assert "avg_confidence" in body
    assert body["plan"] == "free"
    # Fresh user — no reports yet
    assert body["total_reports"] == 0
    assert body["reports_this_month"] == 0
    assert body["last_module_type"] is None


async def test_dashboard_summary_unauthenticated(client: AsyncClient):
    res = await client.get("/api/dashboard/summary")
    assert res.status_code == 401


# ── Dashboard activity ─────────────────────────────────────────────────────────

async def test_dashboard_activity_empty(authed_client: AsyncClient):
    res = await authed_client.get("/api/dashboard/activity")
    assert res.status_code == 200
    assert res.json() == []


async def test_dashboard_activity_unauthenticated(client: AsyncClient):
    res = await client.get("/api/dashboard/activity")
    assert res.status_code == 401


# ── Dashboard metrics ──────────────────────────────────────────────────────────

async def test_dashboard_metrics_structure(authed_client: AsyncClient):
    res = await authed_client.get("/api/dashboard/metrics")
    assert res.status_code == 200
    body = res.json()
    assert "daily_reports" in body
    assert "by_module" in body
    assert isinstance(body["daily_reports"], list)
    assert isinstance(body["by_module"], dict)


# ── Notifications ──────────────────────────────────────────────────────────────

async def test_notifications_empty(authed_client: AsyncClient):
    res = await authed_client.get("/api/notifications")
    assert res.status_code == 200
    assert res.json() == []


async def test_notifications_unauthenticated(client: AsyncClient):
    res = await client.get("/api/notifications")
    assert res.status_code == 401


async def test_mark_notification_not_found(authed_client: AsyncClient):
    fake_id = "00000000-0000-0000-0000-000000000000"
    res = await authed_client.patch(f"/api/notifications/{fake_id}/read")
    assert res.status_code == 404


async def test_mark_all_read_empty(authed_client: AsyncClient):
    res = await authed_client.patch("/api/notifications/read-all")
    assert res.status_code == 200
    assert "message" in res.json()
