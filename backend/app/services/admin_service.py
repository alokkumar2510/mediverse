"""
Admin service — all DB query logic for the admin panel.
All queries are scoped with async SQLAlchemy, optimized with indexes.
"""
from __future__ import annotations

import math
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feedback import Feedback
from app.models.model_version import ModelVersion
from app.models.report import Report
from app.models.usage_log import UsageLog
from app.models.user import User
from app.schemas.admin import (
    AdminAnalyticsResponse,
    AdminFeedbackItem,
    AdminFeedbackListResponse,
    AdminLogItem,
    AdminLogListResponse,
    AdminModelVersionItem,
    AdminStatsResponse,
    AdminUpdateFeedbackRequest,
    AdminUpdateModelRequest,
    AdminUpdateUserRequest,
    AdminUserItem,
    AdminUserListResponse,
    DailyCount,
    LatencyStat,
    ModuleUsageStat,
)

UTC = timezone.utc


def _now() -> datetime:
    return datetime.now(UTC)


# ── Helpers ────────────────────────────────────────────────────────────────────

async def _daily_counts(
    db:          AsyncSession,
    model,
    days:        int,
    date_col:    str = "created_at",
    where_extra  = None,
) -> list[DailyCount]:
    since = _now() - timedelta(days=days)
    col   = getattr(model, date_col)
    stmt  = (
        select(func.date(col).label("d"), func.count().label("n"))
        .where(col >= since)
        .group_by(func.date(col))
        .order_by(func.date(col))
    )
    if where_extra is not None:
        stmt = stmt.where(where_extra)
    rows = (await db.execute(stmt)).all()
    result: dict[str, int] = {str(r.d): r.n for r in rows}
    out: list[DailyCount] = []
    for i in range(days, -1, -1):
        d = (_now() - timedelta(days=i)).date().isoformat()
        out.append(DailyCount(date=d, count=result.get(d, 0)))
    return out


# ── Platform stats ─────────────────────────────────────────────────────────────

async def get_stats(db: AsyncSession) -> AdminStatsResponse:
    now = _now()
    since_7d  = now - timedelta(days=7)
    since_30d = now - timedelta(days=30)
    today_0   = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_users   = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    total_reports = (await db.execute(
        select(func.count()).select_from(Report).where(Report.is_deleted == False)
    )).scalar_one()

    active_7d = (await db.execute(
        select(func.count(func.distinct(Report.user_id)))
        .where(Report.created_at >= since_7d, Report.is_deleted == False)
    )).scalar_one()
    active_30d = (await db.execute(
        select(func.count(func.distinct(Report.user_id)))
        .where(Report.created_at >= since_30d, Report.is_deleted == False)
    )).scalar_one()
    reports_today = (await db.execute(
        select(func.count()).select_from(Report)
        .where(Report.created_at >= today_0, Report.is_deleted == False)
    )).scalar_one()

    new_7d  = (await db.execute(select(func.count()).select_from(User).where(User.created_at >= since_7d))).scalar_one()
    new_30d = (await db.execute(select(func.count()).select_from(User).where(User.created_at >= since_30d))).scalar_one()

    module_rows = (await db.execute(
        select(Report.module_type, func.count().label("n"))
        .where(Report.is_deleted == False)
        .group_by(Report.module_type)
        .order_by(desc("n"))
    )).all()
    module_total = sum(r.n for r in module_rows) or 1
    module_breakdown = [
        ModuleUsageStat(module_type=r.module_type, count=r.n, pct=round(r.n / module_total * 100, 1))
        for r in module_rows
    ]
    most_used_module = module_rows[0].module_type if module_rows else None

    latency_val = (await db.execute(
        select(func.avg(UsageLog.latency_ms))
        .where(UsageLog.created_at >= since_7d, UsageLog.latency_ms != None)
    )).scalar_one()
    avg_latency_ms = round(float(latency_val), 1) if latency_val else None

    failed = (await db.execute(
        select(func.count()).select_from(UsageLog)
        .where(UsageLog.created_at >= since_7d, UsageLog.status_code >= 500)
    )).scalar_one()
    total_req_7d = (await db.execute(
        select(func.count()).select_from(UsageLog).where(UsageLog.created_at >= since_7d)
    )).scalar_one() or 1
    error_rate_pct = round(failed / total_req_7d * 100, 2)

    daily_reports_14d = await _daily_counts(db, Report, 14, where_extra=(Report.is_deleted == False))
    daily_signups_14d = await _daily_counts(db, User, 14)

    lat_rows = (await db.execute(
        select(func.date(UsageLog.created_at).label("d"), func.avg(UsageLog.latency_ms).label("avg_ms"))
        .where(UsageLog.created_at >= since_7d, UsageLog.latency_ms != None)
        .group_by(func.date(UsageLog.created_at))
        .order_by(func.date(UsageLog.created_at))
    )).all()
    latency_trend_7d = [LatencyStat(date=str(r.d), avg_ms=round(float(r.avg_ms), 1)) for r in lat_rows]

    return AdminStatsResponse(
        total_users=total_users, active_users_7d=active_7d, active_users_30d=active_30d,
        total_reports=total_reports, reports_today=reports_today, most_used_module=most_used_module,
        avg_latency_ms=avg_latency_ms, failed_requests=failed, error_rate_pct=error_rate_pct,
        new_users_7d=new_7d, new_users_30d=new_30d, module_breakdown=module_breakdown,
        daily_reports_14d=daily_reports_14d, daily_signups_14d=daily_signups_14d,
        latency_trend_7d=latency_trend_7d,
    )


# ── Users ──────────────────────────────────────────────────────────────────────

async def list_users(
    db:        AsyncSession,
    page:      int  = 1,
    page_size: int  = 50,
    search:    str  | None = None,
    role:      str  | None = None,
    is_active: bool | None = None,
    sort_by:   str  = "created_at",
    sort_dir:  str  = "desc",
) -> AdminUserListResponse:
    stmt = select(User)
    if search:
        q = f"%{search.lower()}%"
        stmt = stmt.where(func.lower(User.email).like(q) | func.lower(User.name).like(q))
    if role:
        stmt = stmt.where(User.role == role)
    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    order_col = {"created_at": User.created_at, "last_login_at": User.last_login_at,
                 "name": User.name, "email": User.email}.get(sort_by, User.created_at)
    stmt = stmt.order_by(desc(order_col) if sort_dir == "desc" else order_col)
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    users = (await db.execute(stmt)).scalars().all()

    user_ids = [u.id for u in users]
    counts: dict[uuid.UUID, int] = {}
    if user_ids:
        count_rows = (await db.execute(
            select(Report.user_id, func.count().label("n"))
            .where(Report.user_id.in_(user_ids), Report.is_deleted == False)
            .group_by(Report.user_id)
        )).all()
        counts = {r.user_id: r.n for r in count_rows}

    items = [
        AdminUserItem(
            id=u.id, name=u.name, email=u.email, role=u.role,
            is_active=u.is_active, is_verified=u.is_verified,
            report_count=counts.get(u.id, 0),
            created_at=u.created_at, last_login_at=u.last_login_at,
        )
        for u in users
    ]
    return AdminUserListResponse(
        items=items, total=total, page=page, page_size=page_size,
        total_pages=max(1, math.ceil(total / page_size)),
    )


async def update_user(
    db: AsyncSession, user_id: uuid.UUID, body: AdminUpdateUserRequest
) -> AdminUserItem:
    from fastapi import HTTPException
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if body.is_active is not None:   user.is_active   = body.is_active
    if body.role is not None and body.role in ("user", "admin"): user.role = body.role
    if body.is_verified is not None: user.is_verified = body.is_verified
    await db.commit()
    await db.refresh(user)
    count = (await db.execute(
        select(func.count()).select_from(Report)
        .where(Report.user_id == user_id, Report.is_deleted == False)
    )).scalar_one()
    return AdminUserItem(
        id=user.id, name=user.name, email=user.email, role=user.role,
        is_active=user.is_active, is_verified=user.is_verified,
        report_count=count, created_at=user.created_at, last_login_at=user.last_login_at,
    )


# ── Logs ──────────────────────────────────────────────────────────────────────

async def list_logs(
    db:         AsyncSession,
    limit:      int = 100,      # kept for backward compat
    page:       int = 1,
    page_size:  int = 100,
    endpoint:   str | None = None,
    status_min: int | None = None,
) -> AdminLogListResponse:
    stmt = select(UsageLog)
    if endpoint:
        stmt = stmt.where(UsageLog.endpoint.ilike(f"%{endpoint}%"))
    if status_min is not None:
        stmt = stmt.where(UsageLog.status_code >= status_min)
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    stmt  = stmt.order_by(desc(UsageLog.created_at)).offset((page - 1) * page_size).limit(page_size)
    rows  = (await db.execute(stmt)).scalars().all()
    return AdminLogListResponse(
        items=[AdminLogItem.model_validate(r) for r in rows],
        total=total, total_pages=max(1, math.ceil(total / page_size)), page=page,
    )


# ── Feedback ──────────────────────────────────────────────────────────────────

async def list_feedback(
    db:        AsyncSession,
    page:      int = 1,
    page_size: int = 50,
    status:    str | None = None,
    search:    str | None = None,
) -> AdminFeedbackListResponse:
    stmt = select(Feedback)
    if status:
        stmt = stmt.where(Feedback.status == status)
    if search:
        stmt = stmt.where(Feedback.message.ilike(f"%{search}%"))
    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    stmt  = stmt.order_by(desc(Feedback.created_at)).offset((page - 1) * page_size).limit(page_size)
    rows  = (await db.execute(stmt)).scalars().all()
    user_ids = list({r.user_id for r in rows})
    email_map: dict[uuid.UUID, str] = {}
    if user_ids:
        ue = (await db.execute(select(User.id, User.email).where(User.id.in_(user_ids)))).all()
        email_map = {r.id: r.email for r in ue}
    items = [
        AdminFeedbackItem(
            id=r.id, user_id=r.user_id, user_email=email_map.get(r.user_id, ""),
            rating=r.rating, message=r.message, status=r.status, created_at=r.created_at,
        )
        for r in rows
    ]
    return AdminFeedbackListResponse(
        items=items, total=total,
        total_pages=max(1, math.ceil(total / page_size)), page=page,
    )


async def update_feedback(
    db: AsyncSession, feedback_id: uuid.UUID, body: AdminUpdateFeedbackRequest
) -> AdminFeedbackItem:
    from fastapi import HTTPException
    fb = (await db.execute(select(Feedback).where(Feedback.id == feedback_id))).scalar_one_or_none()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found.")
    fb.status = body.status
    await db.commit()
    await db.refresh(fb)
    email = (await db.execute(select(User.email).where(User.id == fb.user_id))).scalar_one_or_none()
    return AdminFeedbackItem(
        id=fb.id, user_id=fb.user_id, user_email=email or "",
        rating=fb.rating, message=fb.message, status=fb.status, created_at=fb.created_at,
    )


# ── Model versions ────────────────────────────────────────────────────────────

async def list_models(db: AsyncSession) -> list[AdminModelVersionItem]:
    rows = (await db.execute(
        select(ModelVersion).order_by(ModelVersion.module_type, desc(ModelVersion.created_at))
    )).scalars().all()
    return [AdminModelVersionItem.model_validate(r) for r in rows]


async def update_model(
    db: AsyncSession, model_id: uuid.UUID, body: AdminUpdateModelRequest
) -> AdminModelVersionItem:
    from fastapi import HTTPException
    mv = (await db.execute(select(ModelVersion).where(ModelVersion.id == model_id))).scalar_one_or_none()
    if not mv:
        raise HTTPException(status_code=404, detail="Model version not found.")
    if body.is_active is not None:
        if body.is_active:
            await db.execute(
                update(ModelVersion)
                .where(ModelVersion.module_type == mv.module_type, ModelVersion.id != model_id)
                .values(is_active=False)
            )
        mv.is_active = body.is_active
    if body.description is not None: mv.description = body.description
    if body.accuracy is not None:    mv.accuracy    = body.accuracy
    await db.commit()
    await db.refresh(mv)
    return AdminModelVersionItem.model_validate(mv)


# ── Analytics ─────────────────────────────────────────────────────────────────

async def get_analytics(db: AsyncSession) -> AdminAnalyticsResponse:
    now = _now()
    since_30d = now - timedelta(days=30)

    module_rows = (await db.execute(
        select(Report.module_type, func.count().label("n"))
        .where(Report.is_deleted == False)
        .group_by(Report.module_type).order_by(desc("n"))
    )).all()
    module_total = sum(r.n for r in module_rows) or 1
    module_breakdown = [
        ModuleUsageStat(module_type=r.module_type, count=r.n, pct=round(r.n / module_total * 100, 1))
        for r in module_rows
    ]

    daily_reports_30d = await _daily_counts(db, Report, 30, where_extra=(Report.is_deleted == False))
    daily_signups_30d = await _daily_counts(db, User, 30)

    lat_rows = (await db.execute(
        select(func.date(UsageLog.created_at).label("d"), func.avg(UsageLog.latency_ms).label("avg_ms"))
        .where(UsageLog.created_at >= since_30d, UsageLog.latency_ms != None)
        .group_by(func.date(UsageLog.created_at)).order_by(func.date(UsageLog.created_at))
    )).all()
    latency_trend_30d = [LatencyStat(date=str(r.d), avg_ms=round(float(r.avg_ms), 1)) for r in lat_rows]

    err_rows = (await db.execute(
        select(func.date(UsageLog.created_at).label("d"), func.count().label("n"))
        .where(UsageLog.created_at >= since_30d, UsageLog.status_code >= 500)
        .group_by(func.date(UsageLog.created_at)).order_by(func.date(UsageLog.created_at))
    )).all()
    err_map = {str(r.d): r.n for r in err_rows}
    error_trend_30d = [DailyCount(date=d.date, count=err_map.get(d.date, 0)) for d in daily_reports_30d]

    ep_rows = (await db.execute(
        select(UsageLog.endpoint, func.count().label("n"))
        .where(UsageLog.created_at >= since_30d)
        .group_by(UsageLog.endpoint).order_by(desc("n")).limit(10)
    )).all()
    top_endpoints = [{"endpoint": r.endpoint, "count": r.n} for r in ep_rows]

    return AdminAnalyticsResponse(
        module_breakdown=module_breakdown, daily_reports_30d=daily_reports_30d,
        daily_signups_30d=daily_signups_30d, latency_trend_30d=latency_trend_30d,
        error_trend_30d=error_trend_30d, top_endpoints=top_endpoints,
    )
