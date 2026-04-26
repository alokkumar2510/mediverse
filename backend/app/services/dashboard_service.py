"""
Dashboard Service — aggregated stats and activity for the dashboard.
"""
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import Report
from app.models.user import User


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def get_summary(db: AsyncSession, user: User) -> dict[str, Any]:
    """
    Returns KPI summary for the dashboard header widgets:
    - total_reports
    - reports_this_month
    - last_module_type
    - avg_confidence
    - health_score (placeholder)
    """
    # Total reports (non-deleted)
    total_q = await db.execute(
        select(func.count(Report.id)).where(
            Report.user_id == user.id,
            Report.is_deleted == False,  # noqa: E712
        )
    )
    total_reports: int = total_q.scalar_one() or 0

    # Reports this month
    first_of_month = _now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_q = await db.execute(
        select(func.count(Report.id)).where(
            Report.user_id == user.id,
            Report.is_deleted == False,  # noqa: E712
            Report.created_at >= first_of_month,
        )
    )
    reports_this_month: int = month_q.scalar_one() or 0

    # Last scan type + confidence
    last_q = await db.execute(
        select(Report.module_type, Report.confidence, Report.created_at)
        .where(
            Report.user_id == user.id,
            Report.is_deleted == False,  # noqa: E712
        )
        .order_by(Report.created_at.desc())
        .limit(1)
    )
    last_row = last_q.first()
    last_module_type     = last_row[0] if last_row else None
    last_confidence      = float(last_row[1]) if last_row and last_row[1] else None
    last_scan_at         = last_row[2].isoformat() if last_row and last_row[2] else None

    # Average confidence across all reports
    avg_q = await db.execute(
        select(func.avg(Report.confidence)).where(
            Report.user_id == user.id,
            Report.is_deleted == False,  # noqa: E712
            Report.confidence.isnot(None),
        )
    )
    avg_confidence_raw = avg_q.scalar_one()
    avg_confidence = round(float(avg_confidence_raw), 1) if avg_confidence_raw else None

    return {
        "total_reports": total_reports,
        "reports_this_month": reports_this_month,
        "last_module_type": last_module_type,
        "last_confidence": last_confidence,
        "last_scan_at": last_scan_at,
        "avg_confidence": avg_confidence,
        "health_score": None,  # Wave 2: derived from multi-module analysis
        "plan": "free",        # Wave 2: from subscriptions table
    }


async def get_recent_activity(db: AsyncSession, user: User) -> list[dict[str, Any]]:
    """
    Returns the last 10 non-deleted reports with key metadata.
    """
    q = await db.execute(
        select(
            Report.id,
            Report.module_type,
            Report.title,
            Report.confidence,
            Report.status,
            Report.created_at,
        )
        .where(
            Report.user_id == user.id,
            Report.is_deleted == False,  # noqa: E712
        )
        .order_by(Report.created_at.desc())
        .limit(10)
    )
    rows = q.all()
    return [
        {
            "id": str(r[0]),
            "module_type": r[1],
            "title": r[2] or _default_title(r[1]),
            "confidence": float(r[3]) if r[3] else None,
            "status": r[4],
            "created_at": r[5].isoformat() if r[5] else None,
        }
        for r in rows
    ]


async def get_metrics(db: AsyncSession, user: User) -> dict[str, Any]:
    """
    Returns daily report count for the last 30 days (for chart rendering).
    """
    since = _now() - timedelta(days=30)
    q = await db.execute(
        select(
            func.date(Report.created_at).label("day"),
            func.count(Report.id).label("count"),
        )
        .where(
            Report.user_id == user.id,
            Report.is_deleted == False,  # noqa: E712
            Report.created_at >= since,
        )
        .group_by(func.date(Report.created_at))
        .order_by(func.date(Report.created_at))
    )
    daily = [{"date": str(r[0]), "count": r[1]} for r in q.all()]

    # Module breakdown
    module_q = await db.execute(
        select(Report.module_type, func.count(Report.id).label("count"))
        .where(
            Report.user_id == user.id,
            Report.is_deleted == False,  # noqa: E712
        )
        .group_by(Report.module_type)
    )
    by_module = {r[0]: r[1] for r in module_q.all()}

    return {
        "daily_reports": daily,
        "by_module": by_module,
    }


def _default_title(module_type: str | None) -> str:
    TITLES = {
        "xray":         "X-Ray Analysis",
        "ecg":          "ECG Analysis",
        "skin":         "Skin Analysis",
        "diabetes":     "Diabetes Risk Assessment",
        "prescription": "Prescription OCR",
        "symptoms":     "Symptom Check",
    }
    return TITLES.get(module_type or "", "Analysis")
