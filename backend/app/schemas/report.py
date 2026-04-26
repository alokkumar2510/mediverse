"""Report schemas — full production version."""
import uuid
from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field


# ── Response schemas ──────────────────────────────────────────────────────────

class ReportResponse(BaseModel):
    id:          uuid.UUID
    module_type: str
    title:       str | None
    result_json: dict[str, Any]
    confidence:  float | None
    status:      str
    is_starred:  bool = False
    is_archived: bool = False
    tags:        list[str] = []
    notes:       str | None = None
    created_at:  datetime
    updated_at:  datetime

    model_config = {"from_attributes": True}


class ReportListResponse(BaseModel):
    items:       list[ReportResponse]
    total:       int
    page:        int
    page_size:   int
    total_pages: int


# ── Request schemas ───────────────────────────────────────────────────────────

class CreateReportRequest(BaseModel):
    """Internal — services call this, not clients directly."""
    module_type: str
    title:       str | None = None
    result_json: dict[str, Any]
    confidence:  float | None = None


class UpdateReportRequest(BaseModel):
    """PATCH /api/reports/{id}"""
    is_starred:  bool | None = None
    is_archived: bool | None = None
    tags:        list[str] | None = None
    notes:       str | None = None


class CompareReportRequest(BaseModel):
    """POST /api/reports/compare"""
    report_id_a: uuid.UUID
    report_id_b: uuid.UUID


class CompareReportResponse(BaseModel):
    """Side-by-side diff of two reports."""
    report_a:    ReportResponse
    report_b:    ReportResponse
    same_module: bool
    delta_confidence: float | None   # b.confidence - a.confidence
    delta_days:       float          # days between reports
    summary:          str            # human-readable comparison sentence


class ReportSortBy(str):
    date       = "date"
    confidence = "confidence"
    module     = "module"
