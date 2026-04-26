"""
MediVerse AI — OCR + Gemini Prescription Enhancement Provider
=============================================================
Pipeline:
  1. Existing EasyOCR/Tesseract engine extracts raw text (unchanged)
  2. Gemini cleans noisy OCR text and extracts structured prescription data
     (medicine names, dosages, frequencies, doctor info, dates)
  3. Fallback to existing prescription_parser.py if Gemini fails

Swap path:
  Replace _call_gemini_ocr() with a fine-tuned prescription-NER model.
  The OCR image extraction layer stays the same.
"""
from __future__ import annotations

import logging
from typing import Optional

from app.ai.gemini_client import get_client
from app.ai.provider_types import MEDICAL_DISCLAIMER

logger = logging.getLogger("mediverse.ai.ocr")

_SCHEMA = """{
  "medicines": [
    {
      "name": "<canonical medicine name>",
      "raw_name": "<as written on prescription>",
      "dosage": "<e.g. 500mg>",
      "frequency": "<e.g. Twice daily>",
      "timing": "<e.g. After meals>",
      "duration": "<e.g. 5 days>",
      "instructions": "<any special instructions>",
      "category": "<pharmacological class>",
      "confidence": <0.0-1.0>
    }
  ],
  "doctor_name": "<name or null>",
  "patient_name": "<name or null>",
  "date": "<date string or null>",
  "notes": ["<additional notes>"],
  "warnings": ["<potential drug interactions or safety notes>"],
  "overall_confidence": <0.0-1.0>,
  "low_confidence": <true|false>
}"""


async def enhance_prescription_ocr(
    raw_text: str,
    ocr_confidence: float = 0.0,
) -> dict | None:
    """
    Send OCR-extracted text to Gemini for structured prescription parsing.

    Returns dict matching OcrPrescriptionResponse schema,
    or None if Gemini fails (caller falls back to local parser).
    """
    if not raw_text.strip():
        return None

    prompt = f"""You are a clinical pharmacist AI assistant specialising in prescription digitisation.

The following text was extracted from a medical prescription image using OCR.
OCR confidence: {ocr_confidence:.0%} (may contain errors — infer correct names where obvious).

RAW OCR TEXT:
---
{raw_text}
---

Task: Parse this prescription and extract structured data.
- Identify all medicines mentioned (correct OCR spelling errors using pharmacological knowledge)
- Extract dosage, frequency (once/twice/thrice daily, etc.), timing (before/after meals), duration
- Identify the prescribing doctor's name and registration number if visible
- Identify the patient name and date if visible
- Note any special instructions or drug interaction warnings
- Assign a confidence score (0.0–1.0) per medicine
- Set low_confidence=true if OCR quality is too poor to reliably parse

Canonical medicine names should match WHO INN (International Nonproprietary Names).
Do NOT add medicines that are not in the text. Do NOT hallucinate.
Respond ONLY in JSON format."""

    try:
        client = get_client()
        resp = await client.generate_json(prompt, schema_hint=_SCHEMA)

        if resp.data:
            d = resp.data
            logger.info(
                "Gemini OCR enhancement: %d medicines extracted (latency=%.0fms)",
                len(d.get("medicines", [])), resp.latency_ms,
            )
            return d

    except Exception as exc:
        logger.warning("Gemini OCR enhancement failed, using local parser: %s", exc)

    return None
