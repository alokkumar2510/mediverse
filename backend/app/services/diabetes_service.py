"""
MediVerse AI — Diabetes Service (AI + Rule Engine Hybrid)
=============================================================
Replaces local XGBoost model with temporary AI provider.
Service interface is UNCHANGED — only the AI backend is swapped.

To restore local model:
  Replace the `from app.ai.providers.diabetes import predict_diabetes` import
  with the original `from app.ml.diabetes_model import predict as ml_predict`.
"""
from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.providers.diabetes import predict_diabetes as ai_predict
from app.models.user import User
from app.schemas.modules import DiabetesPredictRequest, DiabetesPredictResponse, RiskFactor
from app.schemas.report import CreateReportRequest
from app.services.report_service import create_report

logger = logging.getLogger(__name__)


async def predict_diabetes(
    db: AsyncSession, user: User, body: DiabetesPredictRequest
) -> DiabetesPredictResponse:
    """
    Full diabetes prediction pipeline:
    1. Build feature dict from request
    2. Run AI inference (AI + Rule Engine)
    3. Persist report to DB
    4. Return rich response
    """
    inputs = {
        "Pregnancies":              body.pregnancies,
        "Glucose":                  body.glucose,
        "BloodPressure":            body.blood_pressure,
        "SkinThickness":            body.skin_thickness,
        "Insulin":                  body.insulin,
        "BMI":                      body.bmi,
        "DiabetesPedigreeFunction": body.diabetes_pedigree,
        "Age":                      float(body.age),
    }

    # AI inference
    try:
        result = await ai_predict(inputs)
    except Exception as e:
        logger.exception("Diabetes AI inference error: %s", e)
        raise

    # Map ProviderResult → schema
    risk_pct = float(result.conditions[0]["probability"]) if result.conditions else 0.0

    risk_factors = []
    for f in result.factors[:3]:
        risk_factors.append(RiskFactor(
            factor=f.get("factor", "Unknown"),
            value=_parse_float(f.get("value", "0")),
            impact=f.get("impact", "moderate"),
            advice=f.get("advice"),
        ))

    response = DiabetesPredictResponse(
        risk_pct=risk_pct,
        risk_tier=result.risk_tier,
        confidence=result.confidence,
        top_risk_factors=risk_factors,
        suggestions=result.suggestions,
        screening_recommended=result.risk_tier in ("moderate", "high"),
        model_version=result.model_version,
        algorithm=result.ai_provider_label,
        disclaimer=result.disclaimer,
    )

    # Persist report
    await create_report(
        db, user,
        CreateReportRequest(
            module_type="diabetes",
            title="Diabetes Risk Assessment",
            result_json={
                "risk_pct":              response.risk_pct,
                "risk_tier":             response.risk_tier,
                "confidence":            response.confidence,
                "algorithm":             response.algorithm,
                "model_version":         response.model_version,
                "screening_recommended": response.screening_recommended,
                "top_risk_factors":      [rf.model_dump() for rf in response.top_risk_factors],
                "suggestions":           response.suggestions,
                "ai_provider":           result.provider,
                "is_temporary":          result.is_temporary,
                "latency_ms":            result.latency_ms,
            },
            confidence=response.risk_pct / 100,
        ),
    )

    return response


def _parse_float(val: str | float) -> float:
    try:
        # Strip units like " mg/dL"
        return float(str(val).split()[0])
    except (ValueError, IndexError):
        return 0.0
