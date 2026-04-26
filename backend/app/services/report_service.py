"""Report service — full production CRUD + search + compare."""
from __future__ import annotations

import math
import uuid
from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import Report
from app.models.user import User
from app.schemas.report import (
    CompareReportResponse,
    CreateReportRequest,
    ReportListResponse,
    ReportResponse,
    UpdateReportRequest,
)


# ── helpers ────────────────────────────────────────────────────────────────────

async def _get_or_404(
    db: AsyncSession, user: User, report_id: uuid.UUID
) -> Report:
    result = await db.execute(
        select(Report).where(
            Report.id == report_id,
            Report.user_id == user.id,
            Report.is_deleted == False,
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


# ── CRUD ───────────────────────────────────────────────────────────────────────

async def create_report(
    db: AsyncSession, user: User, data: CreateReportRequest
) -> Report:
    report = Report(
        user_id     = user.id,
        module_type = data.module_type,
        title       = data.title,
        result_json = data.result_json,
        confidence  = data.confidence,
    )
    db.add(report)
    await db.flush()
    return report


async def list_reports(
    db:           AsyncSession,
    user:         User,
    page:         int = 1,
    page_size:    int = 20,
    module_type:  str | None = None,
    search:       str | None = None,
    sort_by:      str = "date",          # date | confidence | module
    sort_dir:     str = "desc",          # asc | desc
    starred_only: bool = False,
    include_archived: bool = False,
) -> ReportListResponse:
    q = select(Report).where(
        Report.user_id   == user.id,
        Report.is_deleted == False,
    )

    if not include_archived:
        q = q.where(Report.is_archived == False)
    if module_type:
        q = q.where(Report.module_type == module_type)
    if starred_only:
        q = q.where(Report.is_starred == True)
    if search:
        pattern = f"%{search.lower()}%"
        q = q.where(
            or_(
                func.lower(Report.title).like(pattern),
                func.lower(Report.module_type).like(pattern),
            )
        )

    # Sorting
    sort_col = {
        "date":       Report.created_at,
        "confidence": Report.confidence,
        "module":     Report.module_type,
    }.get(sort_by, Report.created_at)

    if sort_dir == "asc":
        q = q.order_by(sort_col.asc().nulls_last())
    else:
        q = q.order_by(sort_col.desc().nulls_last())

    # Total count (fast)
    count_q = select(func.count()).select_from(q.subquery())
    total   = (await db.execute(count_q)).scalar_one()

    # Paginated rows
    rows = (
        await db.execute(q.offset((page - 1) * page_size).limit(page_size))
    ).scalars().all()

    return ReportListResponse(
        items       = [ReportResponse.model_validate(r) for r in rows],
        total       = total,
        page        = page,
        page_size   = page_size,
        total_pages = math.ceil(total / page_size) if total else 0,
    )


async def get_report(
    db: AsyncSession, user: User, report_id: uuid.UUID
) -> ReportResponse:
    return ReportResponse.model_validate(await _get_or_404(db, user, report_id))


async def update_report(
    db: AsyncSession, user: User, report_id: uuid.UUID, data: UpdateReportRequest
) -> ReportResponse:
    report = await _get_or_404(db, user, report_id)
    if data.is_starred  is not None: report.is_starred  = data.is_starred
    if data.is_archived is not None: report.is_archived = data.is_archived
    if data.tags        is not None: report.tags        = data.tags
    if data.notes       is not None: report.notes       = data.notes
    db.add(report)
    await db.flush()
    return ReportResponse.model_validate(report)


async def delete_report(
    db: AsyncSession, user: User, report_id: uuid.UUID
) -> dict:
    report = await _get_or_404(db, user, report_id)
    report.is_deleted = True
    db.add(report)
    return {"message": "Report deleted"}


# ── Compare ────────────────────────────────────────────────────────────────────

async def compare_reports(
    db: AsyncSession, user: User,
    report_id_a: uuid.UUID,
    report_id_b: uuid.UUID,
) -> CompareReportResponse:
    a = await _get_or_404(db, user, report_id_a)
    b = await _get_or_404(db, user, report_id_b)

    same_module = a.module_type == b.module_type
    delta_conf  = None
    if a.confidence is not None and b.confidence is not None:
        delta_conf = round(b.confidence - a.confidence, 2)

    delta_days = round(abs((b.created_at - a.created_at).total_seconds() / 86400), 1)

    # Build plain-English comparison
    if same_module:
        summary = f"Both reports are {a.module_type} analyses, {delta_days} days apart."
        if delta_conf is not None:
            direction = "improved" if delta_conf > 0 else "declined"
            summary += f" Confidence {direction} by {abs(delta_conf):.0f}%."
    else:
        summary = (
            f"Report A is a {a.module_type} analysis; "
            f"Report B is a {b.module_type} analysis. "
            f"They are {delta_days} days apart."
        )

    return CompareReportResponse(
        report_a          = ReportResponse.model_validate(a),
        report_b          = ReportResponse.model_validate(b),
        same_module       = same_module,
        delta_confidence  = delta_conf,
        delta_days        = delta_days,
        summary           = summary,
    )
