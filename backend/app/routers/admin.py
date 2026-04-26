"""Admin router — /api/admin/* (admin role required for every endpoint)."""
from __future__ import annotations

import csv
import io
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import AdminUser
from app.schemas.admin import (
    AdminAnalyticsResponse,
    AdminFeedbackListResponse,
    AdminLogListResponse,
    AdminModelVersionItem,
    AdminStatsResponse,
    AdminUpdateFeedbackRequest,
    AdminUpdateModelRequest,
    AdminUpdateUserRequest,
    AdminUserItem,
    AdminUserListResponse,
)
from app.services import admin_service

router = APIRouter()


# ── Stats ──────────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=AdminStatsResponse, summary="Platform KPIs")
async def get_stats(
    _admin: AdminUser,
    db:     AsyncSession = Depends(get_db),
) -> AdminStatsResponse:
    return await admin_service.get_stats(db)


# ── Users ──────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=AdminUserListResponse, summary="List all users")
async def list_users(
    _admin:    AdminUser,
    db:        AsyncSession = Depends(get_db),
    page:      int           = Query(1, ge=1),
    page_size: int           = Query(50, ge=1, le=200),
    search:    str | None    = Query(None),
    role:      str | None    = Query(None, pattern="^(user|admin)$"),
    is_active: bool | None   = Query(None),
    sort_by:   str           = Query("created_at", pattern="^(created_at|last_login_at|name|email)$"),
    sort_dir:  str           = Query("desc", pattern="^(asc|desc)$"),
) -> AdminUserListResponse:
    return await admin_service.list_users(
        db, page=page, page_size=page_size,
        search=search, role=role, is_active=is_active,
        sort_by=sort_by, sort_dir=sort_dir,
    )


@router.patch("/users/{user_id}", response_model=AdminUserItem, summary="Update user (role/status/verified)")
async def update_user(
    user_id: uuid.UUID,
    body:    AdminUpdateUserRequest,
    _admin:  AdminUser,
    db:      AsyncSession = Depends(get_db),
) -> AdminUserItem:
    return await admin_service.update_user(db, user_id, body)


@router.get("/users/export", summary="Export users CSV")
async def export_users_csv(
    _admin: AdminUser,
    db:     AsyncSession = Depends(get_db),
) -> Response:
    result = await admin_service.list_users(db, page=1, page_size=10_000)
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=[
        "id", "name", "email", "role", "is_active", "is_verified",
        "report_count", "created_at", "last_login_at",
    ])
    writer.writeheader()
    for u in result.items:
        writer.writerow({
            "id":           str(u.id),
            "name":         u.name,
            "email":        u.email,
            "role":         u.role,
            "is_active":    u.is_active,
            "is_verified":  u.is_verified,
            "report_count": u.report_count,
            "created_at":   u.created_at.isoformat(),
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else "",
        })
    return Response(
        content      = buf.getvalue(),
        media_type   = "text/csv",
        headers      = {"Content-Disposition": "attachment; filename=mediverse_users.csv"},
    )


# ── Logs ──────────────────────────────────────────────────────────────────────

@router.get("/logs", response_model=AdminLogListResponse, summary="Request/audit logs")
async def get_logs(
    _admin:     AdminUser,
    db:         AsyncSession = Depends(get_db),
    page:       int          = Query(1, ge=1),
    page_size:  int          = Query(100, ge=1, le=500),
    endpoint:   str | None   = Query(None),
    errors_only: bool        = Query(False),
) -> AdminLogListResponse:
    return await admin_service.list_logs(
        db, page=page, page_size=page_size,
        endpoint=endpoint, status_min=500 if errors_only else None,
    )


# ── Feedback ──────────────────────────────────────────────────────────────────

@router.get("/feedback", response_model=AdminFeedbackListResponse, summary="All feedback")
async def list_feedback(
    _admin:    AdminUser,
    db:        AsyncSession = Depends(get_db),
    page:      int          = Query(1, ge=1),
    page_size: int          = Query(50, ge=1, le=200),
    status:    str | None   = Query(None, pattern="^(open|reviewed|closed)$"),
    search:    str | None   = Query(None),
) -> AdminFeedbackListResponse:
    return await admin_service.list_feedback(db, page=page, page_size=page_size, status=status, search=search)


@router.patch("/feedback/{feedback_id}", summary="Update feedback status")
async def update_feedback(
    feedback_id: uuid.UUID,
    body:        AdminUpdateFeedbackRequest,
    _admin:      AdminUser,
    db:          AsyncSession = Depends(get_db),
):
    return await admin_service.update_feedback(db, feedback_id, body)


# ── Model versions ────────────────────────────────────────────────────────────

@router.get("/models", response_model=list[AdminModelVersionItem], summary="All AI model versions")
async def list_models(
    _admin: AdminUser,
    db:     AsyncSession = Depends(get_db),
) -> list[AdminModelVersionItem]:
    return await admin_service.list_models(db)


@router.patch("/models/{model_id}", response_model=AdminModelVersionItem, summary="Activate / update model")
async def update_model(
    model_id: uuid.UUID,
    body:     AdminUpdateModelRequest,
    _admin:   AdminUser,
    db:       AsyncSession = Depends(get_db),
) -> AdminModelVersionItem:
    return await admin_service.update_model(db, model_id, body)


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/analytics", response_model=AdminAnalyticsResponse, summary="30-day analytics data")
async def get_analytics(
    _admin: AdminUser,
    db:     AsyncSession = Depends(get_db),
) -> AdminAnalyticsResponse:
    return await admin_service.get_analytics(db)
