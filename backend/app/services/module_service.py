"""
Module services — interface stubs for all AI modules.
These integrate with app/ml/ in Wave 2+.
Each follows the same: validate → save upload → infer → save report → return.
"""
import uuid
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.modules import (
    DiabetesPredictRequest,
    DiabetesPredictResponse,
    ImageAnalysisResponse,
    OcrPrescriptionResponse,
    SymptomCheckRequest,
    SymptomCheckResponse,
)
from app.schemas.report import CreateReportRequest
from app.services.report_service import create_report


# ── Diabetes ──────────────────────────────────────────────────────────────────
async def predict_diabetes(
    db: AsyncSession, user: User, body: DiabetesPredictRequest
) -> DiabetesPredictResponse:
    """Delegates to diabetes_service which runs real XGBoost inference."""
    from app.services.diabetes_service import predict_diabetes as _real_predict
    return await _real_predict(db, user, body)


# ── Symptom Checker ───────────────────────────────────────────────────────────
async def check_symptoms(
    db: AsyncSession, user: User, body: SymptomCheckRequest
) -> SymptomCheckResponse:
    """Wave 3: replace with NLP model."""
    result = SymptomCheckResponse(
        conditions=[{"name": "Unspecified — model pending", "probability": 0.0}],
        urgency_score=2,
        urgency_label="routine",
        specialist="General Practitioner",
        disclaimer="This is not a medical diagnosis. Consult a qualified physician.",
    )
    await create_report(
        db, user,
        CreateReportRequest(
            module_type="symptom",
            title=f"Symptom Check: {body.text[:60]}…",
            result_json=result.model_dump(),
        ),
    )
    return result


# ── Image analysis helpers ────────────────────────────────────────────────────
async def _image_stub(
    db: AsyncSession, user: User, file: UploadFile, module: str, title: str
) -> ImageAnalysisResponse:
    result = ImageAnalysisResponse(
        module=module,
        condition="Pending — model loading in Wave 2/3",
        confidence=None,
        recommendations=["Upload accepted. Full analysis coming soon."],
        model_version="stub-0.0.1",
    )
    await create_report(
        db, user,
        CreateReportRequest(
            module_type=module,
            title=f"{title}: {file.filename}",
            result_json=result.model_dump(),
        ),
    )
    return result


async def analyze_xray(db: AsyncSession, user: User, file: UploadFile) -> ImageAnalysisResponse:
    return await _image_stub(db, user, file, "xray", "X-Ray Analysis")


async def analyze_ecg(db: AsyncSession, user: User, file: UploadFile) -> ImageAnalysisResponse:
    return await _image_stub(db, user, file, "ecg", "ECG Analysis")


async def analyze_skin(db: AsyncSession, user: User, file: UploadFile):
    """Delegates to skin_service which runs EfficientNet-B3 / ONNX inference."""
    from app.services.skin_service import analyze_skin as _real_skin
    return await _real_skin(db, user, file)


# ── OCR ───────────────────────────────────────────────────────────────────────
async def run_ocr(db: AsyncSession, user: User, file: UploadFile) -> OcrPrescriptionResponse:
    """Delegates to ocr_service which runs the full EasyOCR/Tesseract pipeline."""
    from app.services.ocr_service import run_ocr as _real_ocr
    return await _real_ocr(db, user, file)

