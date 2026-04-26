"""Prescription OCR router — /api/ocr/*"""
from typing import Any
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser
from app.schemas.modules import OcrPrescriptionResponse
from app.services.module_service import run_ocr
from app.utils.file_validator import validate_document_upload

router = APIRouter()


@router.post(
    "/prescription",
    response_model=OcrPrescriptionResponse,
    summary="Extract medicines and dosages from a prescription image or PDF",
    description=(
        "Upload a handwritten or printed prescription (JPEG/PNG/PDF, max 10 MB). "
        "The pipeline runs EasyOCR (with Tesseract fallback), applies medical "
        "NLP parsing, and returns structured medicine data including name, dosage, "
        "frequency, timing, and warnings."
    ),
    status_code=status.HTTP_200_OK,
)
async def prescription_ocr(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(..., description="JPEG/PNG/PDF prescription, max 10 MB"),
) -> OcrPrescriptionResponse:
    await validate_document_upload(file)
    return await run_ocr(db, current_user, file)


@router.get(
    "/supported-formats",
    summary="List supported upload formats for Prescription OCR",
)
async def get_supported_formats() -> dict[str, Any]:
    return {
        "formats": ["image/jpeg", "image/png", "image/webp", "image/tiff", "application/pdf"],
        "max_size_mb": 10,
        "notes": [
            "For best results, use a high-resolution scan or photo (300 DPI or higher).",
            "Ensure the prescription is well-lit and in focus.",
            "Handwritten prescriptions are supported — accuracy may vary.",
        ],
    }
