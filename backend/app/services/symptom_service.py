"""
MediVerse AI — Symptom Checker Service (Gemini Primary)
========================================================
Replaces stub implementation with Gemini-powered triage.
"""
from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.providers.symptom_checker import check_symptoms as ai_check
from app.models.user import User
from app.schemas.modules import SymptomCheckRequest, SymptomCheckResponse
from app.schemas.report import CreateReportRequest
from app.services.report_service import create_report

logger = logging.getLogger(__name__)


async def check_symptoms(
    db: AsyncSession, user: User, body: SymptomCheckRequest
) -> SymptomCheckResponse:
    """
    Gemini-powered symptom triage.
    Returns SymptomCheckResponse with conditions, urgency, specialist.
    """
    try:
        result = await ai_check(body.text)
    except Exception as e:
        logger.exception("Symptom check AI error: %s", e)
        raise

    # Map ProviderResult → SymptomCheckResponse schema
    conditions_out = []
    for c in result.conditions[:5]:
        conditions_out.append({
            "name":        c.get("name", "Unknown"),
            "probability": float(c.get("probability", 0.0)),
            "icd_hint":    c.get("icd_hint", ""),
        })

    urgency_score = _tier_to_urgency(result.risk_tier)
    urgency_label = {1: "routine", 2: "routine", 3: "urgent", 4: "urgent", 5: "emergency"}.get(urgency_score, "routine")

    # Extract specialist from factors
    specialist = "General Practitioner"
    for f in result.factors:
        if f.get("factor") == "Urgency":
            pass  # handled above
        elif f.get("factor") == "Specialist":
            specialist = f.get("value", "General Practitioner")

    response = SymptomCheckResponse(
        conditions=conditions_out,
        urgency_score=urgency_score,
        urgency_label=urgency_label,
        specialist=specialist,
        disclaimer=result.disclaimer,
    )

    # Persist report
    try:
        await create_report(
            db, user,
            CreateReportRequest(
                module_type="symptom",
                title=f"Symptom Check: {body.text[:60]}…",
                result_json={
                    **response.model_dump(),
                    "ai_provider":  result.provider,
                    "is_temporary": result.is_temporary,
                    "suggestions":  result.suggestions,
                    "latency_ms":   result.latency_ms,
                },
            ),
        )
    except Exception as exc:
        logger.warning("Failed to save symptom report: %s", exc)

    return response


def _tier_to_urgency(tier: str) -> int:
    return {"low": 2, "moderate": 3, "high": 4, "unknown": 2}.get(tier, 2)
