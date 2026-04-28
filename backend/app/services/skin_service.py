"""
MediVerse AI — Skin Analysis Service (AI Vision)
====================================================
Replaces ONNX EfficientNet-B3 with AI Vision provider temporarily.
Service interface (analyze_skin) is UNCHANGED.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.providers.skin import analyze_skin as ai_analyze_skin, HAM_CLASSES
from app.models.report import Report
from app.schemas.modules import SkinAnalysisResponse, SkinConditionProb

logger = logging.getLogger("mediverse.skin_service")

_MAX_BYTES = 10 * 1024 * 1024  # 10 MB


async def analyze_skin(
    db: AsyncSession,
    current_user,
    file: UploadFile,
    generate_heatmap: bool = True,
) -> SkinAnalysisResponse:
    """
    Full pipeline:
      1. Read & validate bytes
      2. Run AI Vision inference
      3. Persist report to DB
      4. Return structured response
    """
    # 1. Read bytes
    raw_bytes = await file.read(_MAX_BYTES)
    if len(raw_bytes) == _MAX_BYTES:
        raise ValueError("File too large — maximum 10 MB")

    # 2. AI Inference
    try:
        result = await ai_analyze_skin(raw_bytes, file.filename or "")
    except Exception as exc:
        logger.exception("Skin inference failed: %s", exc)
        raise

    # 3. Persist to DB
    report_id = None
    try:
        # Extract condition code from factors
        cond_code = "nv"
        for f in result.factors:
            if f.get("factor") == "Condition Code":
                cond_code = f.get("value", "nv")
                break

        # Extract quality from factors
        quality = "unknown"
        quality_warnings = []
        needs_derm = True
        for f in result.factors:
            if f.get("factor") == "Needs Dermatologist":
                needs_derm = f.get("value", "True").lower() in ("true", "1")
            if f.get("factor") == "Image Quality":
                quality = f.get("value", "unknown")

        report_data = {
            "condition_code":      cond_code,
            "condition_label":     result.primary_label,
            "confidence":          result.confidence,
            "all_probabilities":   {c["name"]: c["probability"] for c in result.conditions},
            "severity":            result.risk_tier,
            "needs_dermatologist": needs_derm,
            "image_quality":       quality,
            "model_version":       result.model_version,
            "ai_provider":         result.provider,
            "is_temporary":        result.is_temporary,
            "filename":            file.filename,
            "analyzed_at":         datetime.now(timezone.utc).isoformat(),
        }
        report = Report(
            user_id     = current_user.id,
            module      = "skin",
            result_json = report_data,
        )
        db.add(report)
        await db.commit()
        await db.refresh(report)
        report_id = report.id
    except Exception as exc:
        logger.warning("Failed to save skin report to DB: %s", exc)

    # 4. Build response
    all_probs = []
    for c in result.conditions:
        # Conditions list from AI has {"name": ..., "probability": ...}
        code = _label_to_code(c.get("name", "nv"))
        all_probs.append(SkinConditionProb(
            code=code,
            label=c.get("name", "Unknown"),
            probability=float(c.get("probability", 0.0)),
        ))

    # Extract quality warnings from suggestions
    quality_warnings = [s for s in result.suggestions if "⚠️" in s or "quality" in s.lower()]

    return SkinAnalysisResponse(
        condition_code      = _label_to_code(result.primary_label),
        condition_label     = result.primary_label,
        confidence          = result.confidence,
        all_probabilities   = all_probs,
        severity            = _tier_to_severity(result.risk_tier),
        care_suggestions    = result.suggestions,
        needs_dermatologist = result.confidence < 80 or result.risk_tier in ("moderate", "high"),
        low_confidence      = result.confidence < 65,
        image_quality       = "unknown",
        quality_warnings    = quality_warnings,
        heatmap_b64         = None,   # AI doesn't generate heatmaps
        image_hash          = "",
        tta_uncertainty     = 0.0,
        model_version       = result.model_version,
        report_id           = report_id,
        disclaimer          = result.disclaimer,
    )


def _label_to_code(label: str) -> str:
    """Map label back to HAM10000 code."""
    label_lower = label.lower()
    for code, name in HAM_CLASSES.items():
        if code in label_lower or name.lower() in label_lower:
            return code
    return "nv"   # default


def _tier_to_severity(tier: str) -> str:
    return {
        "low":      "benign",
        "moderate": "moderate",
        "high":     "high",
        "unknown":  "unknown",
    }.get(tier, "unknown")
