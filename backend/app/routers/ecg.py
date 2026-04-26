"""ECG analysis router — POST /api/ecg/analyze"""
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser
from app.schemas.modules import EcgAnalysisResponse
from app.services.ecg_service import analyze_ecg

logger = logging.getLogger("mediverse.ecg_router")
router = APIRouter()

_ALLOWED_EXTENSIONS = {".csv", ".npy", ".txt"}
_MAX_SIZE_MB = 10


@router.post(
    "/analyze",
    response_model=EcgAnalysisResponse,
    summary="ECG rhythm analysis",
    description=(
        "Upload a 1D ECG signal file (.csv, .npy, .txt) containing Lead I waveform data. "
        "Returns AI-predicted rhythm type, confidence score, risk flags, "
        "and clinical recommendation. "
        "⚠️ For AI screening support only — not a medical diagnosis."
    ),
)
async def analyze(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(..., description="ECG signal file (.csv, .npy, .txt)"),
) -> EcgAnalysisResponse:
    # Extension check
    filename = (file.filename or "").lower()
    ext = "." + filename.rsplit(".", 1)[-1] if "." in filename else ""
    if ext not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            400,
            f"Unsupported file type '{ext}'. Accepted: {', '.join(_ALLOWED_EXTENSIONS)}",
        )

    # Size check (read is deferred to service)
    if file.size and file.size > _MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(413, f"File too large. Max size is {_MAX_SIZE_MB} MB.")

    logger.info(
        "ECG analyze request — user=%s, file=%s, size=%s",
        current_user.id, file.filename, file.size,
    )

    return await analyze_ecg(db, current_user, file)


@router.get(
    "/health",
    summary="ECG engine health check",
    tags=["Health"],
)
async def ecg_health() -> dict:
    """Check Gemini ECG provider availability."""
    import os
    key_present = bool(os.environ.get("GEMINI_API_KEY"))
    return {
        "provider":     "gemini+signal",
        "mode":         "temporary_ai_bridge",
        "gemini_key":   "configured" if key_present else "MISSING — set GEMINI_API_KEY",
        "signal_proc":  "scipy (always available)",
        "onnx_model":   "not loaded (custom model pending training)",
        "status":       "ready" if key_present else "degraded",
    }
