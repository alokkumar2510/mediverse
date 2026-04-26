"""
MediVerse AI — ECG Analysis Service (Signal Analysis + Gemini)
==============================================================
Replaces ONNX ResNet1D with signal features + Gemini interpretation.
Service interface (analyze_ecg) is UNCHANGED.
"""
from __future__ import annotations

import io
import logging

import numpy as np
import pandas as pd
from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.providers.ecg import analyze_ecg_signal
from app.models.user import User
from app.schemas.modules import EcgAnalysisResponse, EcgConditionProb
from app.schemas.report import CreateReportRequest
from app.services.report_service import create_report

logger = logging.getLogger("mediverse.ecg_service")

SUPPORTED_FORMATS = {".csv", ".npy", ".txt"}


async def parse_ecg_file(file: UploadFile) -> tuple[np.ndarray, float]:
    """Parse uploaded ECG file → (signal_array, sample_rate_hz)."""
    name    = (file.filename or "").lower()
    content = await file.read()

    if name.endswith(".npy"):
        try:
            arr = np.load(io.BytesIO(content), allow_pickle=False)
            return arr.flatten().astype(np.float32), 500.0
        except Exception as exc:
            raise HTTPException(400, f"Invalid NPY file: {exc}")

    if name.endswith((".csv", ".txt")):
        try:
            df  = pd.read_csv(io.BytesIO(content), header=None)
            arr = df.iloc[:, 0].values
            arr = pd.to_numeric(arr, errors="coerce").astype(np.float32)
            arr = arr[np.isfinite(arr)]
            if len(arr) == 0:
                raise ValueError("No numeric values found in file.")
            return arr, 500.0
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(400, f"Invalid CSV/TXT file: {exc}")

    raise HTTPException(400, "Unsupported file format. Upload a .csv, .npy, or .txt ECG signal file.")


async def analyze_ecg(
    db: AsyncSession,
    user: User,
    file: UploadFile,
) -> EcgAnalysisResponse:
    """
    Full ECG analysis pipeline:
    1. Parse file → numpy signal
    2. Run signal analysis + Gemini interpretation
    3. Build response
    4. Save report
    """
    # 1. Parse
    raw_signal, orig_fs = await parse_ecg_file(file)
    logger.info("ECG file parsed — samples=%d, assumed_fs=%.0f", len(raw_signal), orig_fs)

    # 2. Sanity checks
    if len(raw_signal) < 100:
        raise HTTPException(400, "Signal too short (< 100 samples).")
    if np.all(raw_signal == 0):
        raise HTTPException(400, "Signal is all zeros. Please check your file.")

    # 3. AI inference
    result, feats = await analyze_ecg_signal(raw_signal, orig_fs)

    # 4. Build response
    all_probs = []
    for p in result.conditions:
        label = p.get("label", p.get("name", "Unknown"))
        prob  = float(p.get("probability", 0.0))
        all_probs.append(EcgConditionProb(label=label, probability=prob))

    hr_bpm = feats.get("heart_rate_bpm")
    r_peaks = feats.get("r_peaks", [])

    response = EcgAnalysisResponse(
        rhythm_type       = result.primary_label,
        confidence        = result.confidence,
        all_probabilities = all_probs,
        severity          = _tier_to_severity(result.risk_tier),
        recommendation    = result.suggestions[0] if result.suggestions else "Consult a cardiologist.",
        risk_flags        = [f.get("factor", "") for f in result.factors if f.get("impact") == "high"],
        needs_review      = result.risk_tier in ("moderate", "high") or result.confidence < 70,
        low_confidence    = result.confidence < 65,
        signal_quality    = feats.get("signal_quality", "unknown"),
        quality_warnings  = feats.get("quality_warnings", []),
        r_peaks           = r_peaks[:50],
        heart_rate_bpm    = hr_bpm,
        model_version     = result.model_version,
        is_demo           = result.is_temporary,
        disclaimer        = result.disclaimer,
    )

    # 5. Save report
    try:
        report = await create_report(
            db, user,
            CreateReportRequest(
                module_type="ecg",
                title=f"ECG Analysis: {result.primary_label}",
                result_json={
                    **response.model_dump(),
                    "ai_provider":    result.provider,
                    "is_temporary":   result.is_temporary,
                    "latency_ms":     result.latency_ms,
                    "signal_features": {
                        "duration_s":     feats.get("duration_s"),
                        "n_samples":      feats.get("n_samples"),
                        "heart_rate_bpm": hr_bpm,
                        "rr_cv":          feats.get("rr_cv"),
                    },
                },
            ),
        )
        response.report_id = str(report.id) if report else None
    except Exception as exc:
        logger.warning("Report save failed: %s", exc)

    return response


def _tier_to_severity(tier: str) -> str:
    return {"low": "normal", "moderate": "moderate", "high": "severe", "unknown": "unknown"}.get(tier, "unknown")
