"""Reports router — full production: list, get, update, delete, compare, PDF."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser
from app.schemas.common import MessageResponse
from app.schemas.report import (
    CompareReportRequest,
    CompareReportResponse,
    ReportListResponse,
    ReportResponse,
    UpdateReportRequest,
)
from app.services import report_service
from app.services.pdf_service import generate_pdf_bytes

router = APIRouter()


@router.get("", response_model=ReportListResponse, summary="List reports")
async def list_reports(
    current_user:     CurrentUser,
    db:               AsyncSession = Depends(get_db),
    page:             int  = Query(1, ge=1),
    page_size:        int  = Query(20, ge=1, le=100),
    module_type:      str | None = Query(None),
    search:           str | None = Query(None),
    sort_by:          str  = Query("date", pattern="^(date|confidence|module)$"),
    sort_dir:         str  = Query("desc", pattern="^(asc|desc)$"),
    starred_only:     bool = Query(False),
    include_archived: bool = Query(False),
) -> ReportListResponse:
    return await report_service.list_reports(
        db, current_user,
        page=page, page_size=page_size,
        module_type=module_type, search=search,
        sort_by=sort_by, sort_dir=sort_dir,
        starred_only=starred_only, include_archived=include_archived,
    )


@router.post("/compare", response_model=CompareReportResponse, summary="Compare two reports")
async def compare_reports(
    body:         CompareReportRequest,
    current_user: CurrentUser,
    db:           AsyncSession = Depends(get_db),
) -> CompareReportResponse:
    return await report_service.compare_reports(
        db, current_user, body.report_id_a, body.report_id_b
    )


@router.get("/{report_id}", response_model=ReportResponse, summary="Get single report")
async def get_report(
    report_id:    uuid.UUID,
    current_user: CurrentUser,
    db:           AsyncSession = Depends(get_db),
) -> ReportResponse:
    return await report_service.get_report(db, current_user, report_id)


@router.patch("/{report_id}", response_model=ReportResponse, summary="Update report (star/archive/tags/notes)")
async def update_report(
    report_id:    uuid.UUID,
    body:         UpdateReportRequest,
    current_user: CurrentUser,
    db:           AsyncSession = Depends(get_db),
) -> ReportResponse:
    return await report_service.update_report(db, current_user, report_id, body)


@router.delete("/{report_id}", response_model=MessageResponse, summary="Soft-delete report")
async def delete_report(
    report_id:    uuid.UUID,
    current_user: CurrentUser,
    db:           AsyncSession = Depends(get_db),
) -> MessageResponse:
    result = await report_service.delete_report(db, current_user, report_id)
    return MessageResponse(message=result["message"])


@router.get("/{report_id}/pdf", summary="Download branded PDF report")
async def download_pdf(
    report_id:    uuid.UUID,
    current_user: CurrentUser,
    db:           AsyncSession = Depends(get_db),
) -> Response:
    report = await report_service.get_report(db, current_user, report_id)
    try:
        report_dict       = report.model_dump()
        report_dict["id"] = str(report_id)
        user_name  = (
            getattr(current_user, "full_name", None)
            or getattr(current_user, "name", None)
            or current_user.email.split("@")[0].title()
        )
        pdf_bytes = generate_pdf_bytes(report_dict, user_name, current_user.email)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    return Response(
        content    = pdf_bytes,
        media_type = "application/pdf",
        headers    = {
            "Content-Disposition": f'attachment; filename="mediverse-{str(report_id)[:8]}.pdf"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )
