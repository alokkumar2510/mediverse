"""
MediVerse AI — X-Ray Analysis Service (Gemini Vision)
======================================================
Replaces ONNX EfficientNet ensemble with Gemini Vision temporarily.
Service interface (analyze_xray) is UNCHANGED.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.providers.xray import analyze_xray as ai_analyze_xray
from app.models.report import Report
from app.schemas.modules import (
    XrayAnalysisResponse,
    XrayConditionProb,
    XrayTop3Item,
)

logger = logging.getLogger("mediverse.xray_service")

_MAX_BYTES = 10 * 1024 * 1024  # 10 MB


async def analyze_xray(
    db: AsyncSession,
    current_user,
    file: UploadFile,
    generate_heatmap: bool = True,
) -> XrayAnalysisResponse:
    # 1. Read bytes
    raw_bytes = await file.read(_MAX_BYTES)
    if len(raw_bytes) == _MAX_BYTES:
        raise ValueError("File too large — maximum 10 MB")

    # 2. AI inference
    try:
        result = await ai_analyze_xray(raw_bytes, file.filename or "")
    except Exception as exc:
        logger.exception("X-ray inference failed: %s", exc)
        raise

    # 3. Extract structured fields from ProviderResult
    top_condition = result.primary_label
    confidence = result.confidence
    is_high_risk = result.risk_tier in ("high",)
    severity_label = _tier_to_severity(result.risk_tier)

    # All probabilities → sorted list
    all_probs_list = []
    for c in result.conditions:
        name = c.get("name", "Unknown")
        prob = float(c.get("probability", 0.0))
        all_probs_list.append(XrayConditionProb(
            code=name.lower().replace(" ", "_"),
            label=name,
            probability=prob,
        ))

    top3_items = [
        XrayTop3Item(
            code=p.code,
            label=p.label,
            confidence=p.probability,
        )
        for p in all_probs_list[:3]
    ]

    # Extract quality from factors
    quality = "unknown"
    quality_warnings: list[str] = []
    for f in result.factors:
        if f.get("factor") == "Image Quality":
            quality = f.get("value", "unknown")

    # 4. Persist report
    report_id = None
    try:
        report_data = {
            "top_condition":    top_condition,
            "confidence":       confidence,
            "severity":         severity_label,
            "is_high_risk":     is_high_risk,
            "model_name":       "Gemini Vision (Temporary)",
            "model_version":    result.model_version,
            "ai_provider":      result.provider,
            "is_temporary":     result.is_temporary,
            "n_classes":        17,
            "filename":         file.filename,
            "analyzed_at":      datetime.now(timezone.utc).isoformat(),
        }
        report = Report(
            user_id     = current_user.id,
            module_type = "xray",
            title       = f"Chest X-Ray — {top_condition}",
            result_json = report_data,
            confidence  = confidence / 100,
        )
        db.add(report)
        await db.commit()
        await db.refresh(report)
        report_id = str(report.id)
    except Exception as exc:
        logger.warning("Failed to save x-ray report: %s", exc)

    return XrayAnalysisResponse(
        top_condition     = top_condition,
        top_label         = top_condition,
        confidence        = confidence,
        top3              = top3_items,
        all_probabilities = all_probs_list,
        severity          = severity_label,
        care_suggestions  = result.suggestions,
        is_high_risk      = is_high_risk,
        low_confidence    = confidence < 65,
        tta_uncertainty   = 0.0,
        image_quality     = quality,
        quality_warnings  = quality_warnings,
        heatmap_b64       = None,   # Gemini doesn't generate Grad-CAM
        image_hash        = "",
        model_name        = "Gemini Vision (Temporary)",
        model_version     = result.model_version,
        n_classes         = 17,
        report_id         = report_id,
        disclaimer        = result.disclaimer,
    )


def _tier_to_severity(tier: str) -> str:
    return {"low": "mild", "moderate": "moderate", "high": "severe", "unknown": "unknown"}.get(tier, "unknown")
