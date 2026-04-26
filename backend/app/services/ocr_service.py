"""
MediVerse AI — OCR Service (Production)
=========================================
Replaces the stub in module_service.py.

Pipeline:
  1. Read uploaded file bytes
  2. Convert to PIL Image (handles JPEG, PNG, PDF)
  3. Preprocess image (denoise, deskew, enhance, binarise)
  4. Run OCR (EasyOCR → Tesseract fallback)
  5. Parse prescription text (medicine names, dosages, frequencies, etc.)
  6. Return rich structured response
  7. Persist report to DB
"""
from __future__ import annotations

import io
import logging
import mimetypes
from pathlib import Path

from fastapi import UploadFile
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession

from app.ml.ocr_engine import preprocess_image, preprocess_pdf_page, run_ocr_on_image, normalize_text
from app.ml.prescription_parser import parse_prescription, prescription_to_dict
from app.models.user import User
from app.schemas.modules import OcrPrescriptionResponse, OcrMedicine
from app.schemas.report import CreateReportRequest
from app.services.report_service import create_report
from app.ai.providers.ocr_enhancer import enhance_prescription_ocr

logger = logging.getLogger(__name__)

# Supported MIME types
_SUPPORTED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp", "image/tiff", "image/bmp"}
_SUPPORTED_PDF_MIME = "application/pdf"


async def run_ocr(
    db: AsyncSession,
    user: User,
    file: UploadFile,
) -> OcrPrescriptionResponse:
    """
    Full OCR pipeline for prescriptions.
    Handles: JPEG, PNG, PDF uploads.
    """
    raw_bytes = await file.read()
    content_type = (file.content_type or "").lower()

    if not content_type:
        # Guess from filename
        guessed, _ = mimetypes.guess_type(file.filename or "")
        content_type = (guessed or "image/jpeg").lower()

    logger.info(
        "OCR request: file=%s size=%d bytes mime=%s user=%s",
        file.filename, len(raw_bytes), content_type, user.id,
    )

    try:
        # ── Step 1: Decode to PIL Image ────────────────────────────────────────
        if content_type == _SUPPORTED_PDF_MIME:
            img = preprocess_pdf_page(raw_bytes, page_num=0)
        elif content_type in _SUPPORTED_IMAGE_MIMES:
            pil = Image.open(io.BytesIO(raw_bytes))
            img = preprocess_image(pil)
        else:
            # Try opening anyway — PIL handles many formats
            try:
                pil = Image.open(io.BytesIO(raw_bytes))
                img = preprocess_image(pil)
            except Exception:
                return _error_response("Unsupported file format. Please upload JPEG, PNG, or PDF.")

        # ── Step 2: Run OCR ────────────────────────────────────────────────────
        ocr_result = run_ocr_on_image(img)
        raw_text = normalize_text(ocr_result.raw_text)
        engine = ocr_result.engine_used
        avg_conf = ocr_result.avg_confidence

        logger.info("OCR complete: engine=%s words=%d avg_conf=%.2f",
                    engine, len(ocr_result.words), avg_conf)

        if not raw_text.strip():
            return _error_response(
                "No text detected. The image may be too blurry or the prescription "
                "too faint. Try a clearer photo in good lighting.",
                engine=engine,
            )

        # ── Step 3a: Local prescription parser (fast, always runs) ──────────────
        parsed = parse_prescription(raw_text, ocr_words=ocr_result.words)
        result_dict = prescription_to_dict(parsed)
        result_dict["ocr_engine"] = engine
        result_dict["ocr_avg_confidence"] = round(avg_conf, 3)
        result_dict["raw_text"] = raw_text

        # ── Step 3b: Gemini enhancement (corrects OCR errors, enriches data) ────
        gemini_data: dict | None = None
        try:
            gemini_data = await enhance_prescription_ocr(raw_text, ocr_confidence=avg_conf)
        except Exception as gem_exc:
            logger.warning("Gemini OCR enhancement skipped: %s", gem_exc)

        # ── Step 4: Build response (prefer Gemini data if available) ──────────
        medicines_out: list[OcrMedicine] = []
        gemini_used = False

        if gemini_data and gemini_data.get("medicines"):
            gemini_used = True
            for m in gemini_data["medicines"]:
                medicines_out.append(OcrMedicine(
                    name=m.get("name", "Unknown"),
                    raw_name=m.get("raw_name", m.get("name", "")),
                    category=m.get("category"),
                    brand_names=[],
                    dosage=m.get("dosage"),
                    frequency=m.get("frequency"),
                    timing=m.get("timing"),
                    duration=m.get("duration"),
                    instructions=m.get("instructions"),
                    confidence=float(m.get("confidence", 0.85)),
                ))
            doctor_name  = gemini_data.get("doctor_name")  or parsed.doctor_name
            patient_name = gemini_data.get("patient_name") or parsed.patient_name
            date         = gemini_data.get("date")         or parsed.date
            notes        = gemini_data.get("notes", [])    or parsed.notes
            warnings     = gemini_data.get("warnings", []) + parsed.warnings
            overall_conf = float(gemini_data.get("overall_confidence", parsed.overall_confidence))
            low_conf     = gemini_data.get("low_confidence", parsed.low_confidence)
        else:
            for m in parsed.medicines:
                medicines_out.append(OcrMedicine(
                    name=m.name,
                    raw_name=m.raw_name,
                    category=m.canonical.category if m.canonical else None,
                    brand_names=list(m.canonical.brand_names) if m.canonical else [],
                    dosage=m.dosage,
                    frequency=m.frequency,
                    timing=m.timing,
                    duration=m.duration,
                    instructions=m.instructions,
                    confidence=round(m.confidence, 3),
                ))
            doctor_name  = parsed.doctor_name
            patient_name = parsed.patient_name
            date         = parsed.date
            notes        = parsed.notes
            warnings     = parsed.warnings
            overall_conf = parsed.overall_confidence
            low_conf     = parsed.low_confidence

        ocr_engine_label = f"{engine}+gemini" if gemini_used else engine

        response = OcrPrescriptionResponse(
            medicines=medicines_out,
            doctor_name=doctor_name,
            date=date,
            patient_name=patient_name,
            notes=notes,
            warnings=warnings,
            raw_text=raw_text,
            overall_confidence=round(overall_conf * 100, 1),
            low_confidence=low_conf,
            ocr_engine=ocr_engine_label,
            medicine_count=len(medicines_out),
        )

        # ── Step 5: Persist report ─────────────────────────────────────────────
        medicine_names = [m.name for m in medicines_out] or ["No medicines detected"]
        title = "Prescription OCR: " + ", ".join(medicine_names[:3])
        if len(medicine_names) > 3:
            title += f" +{len(medicine_names) - 3} more"

        await create_report(
            db, user,
            CreateReportRequest(
                module_type="ocr",
                title=title,
                result_json=result_dict,
                confidence=parsed.overall_confidence,
            ),
        )

        logger.info(
            "OCR report saved: medicines=%d warnings=%d user=%s",
            len(medicines_out), len(parsed.warnings), user.id,
        )
        return response

    except Exception as e:
        logger.exception("OCR pipeline error: %s", e)
        return _error_response(f"OCR processing failed: {str(e)}")


def _error_response(msg: str, engine: str = "none") -> OcrPrescriptionResponse:
    """Return a clean error response."""
    return OcrPrescriptionResponse(
        medicines=[],
        doctor_name=None,
        date=None,
        patient_name=None,
        notes=[],
        warnings=[f"⚠️ {msg}"],
        raw_text="",
        overall_confidence=0.0,
        low_confidence=True,
        ocr_engine=engine,
        medicine_count=0,
    )
