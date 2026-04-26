"""
Admin schemas — all request/response types for /api/admin/*.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel


# ── Stats ──────────────────────────────────────────────────────────────────────

class ModuleUsageStat(BaseModel):
    module_type: str
    count:       int
    pct:         float

class DailyCount(BaseModel):
    date:  str   # YYYY-MM-DD
    count: int

class LatencyStat(BaseModel):
    date:   str
    avg_ms: float

class AdminStatsResponse(BaseModel):
    total_users:       int
    active_users_7d:   int
    active_users_30d:  int
    total_reports:     int
    reports_today:     int
    most_used_module:  str | None
    avg_latency_ms:    float | None
    failed_requests:   int
    error_rate_pct:    float
    new_users_7d:      int
    new_users_30d:     int
    module_breakdown:  list[ModuleUsageStat] = []
    daily_reports_14d: list[DailyCount]      = []
    daily_signups_14d: list[DailyCount]      = []
    latency_trend_7d:  list[LatencyStat]     = []


# ── Users ──────────────────────────────────────────────────────────────────────

class AdminUserItem(BaseModel):
    id:            uuid.UUID
    name:          str
    email:         str
    role:          str
    is_active:     bool
    is_verified:   bool
    report_count:  int = 0
    created_at:    datetime
    last_login_at: datetime | None

    model_config = {"from_attributes": True}

class AdminUserListResponse(BaseModel):
    items:       list[AdminUserItem]
    total:       int
    page:        int
    page_size:   int
    total_pages: int

class AdminUpdateUserRequest(BaseModel):
    is_active:   bool | None = None
    role:        str  | None = None
    is_verified: bool | None = None


# ── Logs ──────────────────────────────────────────────────────────────────────

class AdminLogItem(BaseModel):
    id:          uuid.UUID
    user_id:     uuid.UUID | None
    endpoint:    str
    method:      str
    status_code: int | None
    latency_ms:  int | None
    ip_address:  str | None
    created_at:  datetime

    model_config = {"from_attributes": True}

class AdminLogListResponse(BaseModel):
    items:       list[AdminLogItem]
    total:       int
    total_pages: int
    page:        int


# ── Feedback ──────────────────────────────────────────────────────────────────

class AdminFeedbackItem(BaseModel):
    id:         uuid.UUID
    user_id:    uuid.UUID
    user_email: str = ""
    rating:     int | None
    message:    str | None
    status:     str
    created_at: datetime

    model_config = {"from_attributes": True}

class AdminFeedbackListResponse(BaseModel):
    items:       list[AdminFeedbackItem]
    total:       int
    total_pages: int
    page:        int

class AdminUpdateFeedbackRequest(BaseModel):
    status: str   # open | reviewed | closed


# ── Model versions ────────────────────────────────────────────────────────────

class AdminModelVersionItem(BaseModel):
    id:            uuid.UUID
    module_type:   str
    version:       str
    description:   str | None
    artifact_path: str | None
    accuracy:      float | None
    auc_roc:       float | None
    precision:     float | None
    recall:        float | None
    framework:     str | None
    is_active:     bool
    released_at:   datetime | None
    created_at:    datetime

    model_config = {"from_attributes": True}

class AdminUpdateModelRequest(BaseModel):
    is_active:   bool  | None = None
    description: str   | None = None
    accuracy:    float | None = None


# ── Analytics ─────────────────────────────────────────────────────────────────

class AdminAnalyticsResponse(BaseModel):
    module_breakdown:  list[ModuleUsageStat]
    daily_reports_30d: list[DailyCount]
    daily_signups_30d: list[DailyCount]
    latency_trend_30d: list[LatencyStat]
    error_trend_30d:   list[DailyCount]
    top_endpoints:     list[dict[str, Any]] = []
