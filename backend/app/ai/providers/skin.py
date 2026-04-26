"""
MediVerse AI — Skin Analysis Provider (Gemini Vision)
=====================================================
Uses Gemini multimodal vision to analyse dermoscopy/skin images.

Strategy:
  • Send image bytes + clinical prompt to Gemini Vision
  • Return structured HAM10000-compatible classification
  • Fall back to "needs clinical review" if API fails

Swap path: Replace _call_gemini_vision() with your ONNX EfficientNet-B3 engine.
"""
from __future__ import annotations

import logging

from app.ai.gemini_client import get_client
from app.ai.provider_types import ProviderResult, MEDICAL_DISCLAIMER

logger = logging.getLogger("mediverse.ai.skin")

# HAM10000 class codes — keep compatible with existing schema
HAM_CLASSES = {
    "akiec": "Actinic Keratoses",
    "bcc":   "Basal Cell Carcinoma",
    "bkl":   "Benign Keratosis",
    "df":    "Dermatofibroma",
    "mel":   "Melanoma",
    "nv":    "Melanocytic Nevi",
    "vasc":  "Vascular Lesion",
}

_SCHEMA = """{
  "condition_code": "<akiec|bcc|bkl|df|mel|nv|vasc>",
  "condition_label": "<full name>",
  "confidence": <0-100>,
  "severity": "<benign|low|moderate|high|critical>",
  "needs_dermatologist": <true|false>,
  "all_probabilities": {
    "akiec": <0-100>, "bcc": <0-100>, "bkl": <0-100>,
    "df": <0-100>, "mel": <0-100>, "nv": <0-100>, "vasc": <0-100>
  },
  "care_suggestions": ["<suggestion>"],
  "quality_assessment": "<good|blurry|dark|too_small>",
  "quality_warnings": ["<warning if any>"],
  "clinical_notes": "<brief professional assessment note>"
}"""

_PROMPT = """You are an AI dermatology screening assistant supporting a clinical decision-support tool.
Analyse this skin lesion image and provide a structured assessment.

Important context:
- This tool is calibrated on HAM10000 dataset categories
- Classify into exactly ONE of: akiec, bcc, bkl, df, mel, nv, vasc
- Provide probability estimates for ALL 7 classes (must sum to ~100)
- Assess image quality (good/blurry/dark/too_small)
- Suggest when dermatologist consultation is needed

Classify the skin lesion shown:
- akiec = Actinic Keratoses / Bowen's disease (pre-cancerous)
- bcc = Basal Cell Carcinoma (malignant)
- bkl = Benign Keratosis (seborrheic keratosis)
- df = Dermatofibroma (benign)
- mel = Melanoma (malignant — highest urgency)
- nv = Melanocytic Nevi (common mole)
- vasc = Vascular Lesion (angiomas, etc.)

Assess severity: benign < low < moderate < high < critical
Flag needs_dermatologist=true if ANY malignancy probability >15%.

Respond ONLY with valid JSON. Be clinically conservative (err on caution)."""


async def analyze_skin(image_bytes: bytes, filename: str = "") -> ProviderResult:
    """
    Analyse skin lesion image using Gemini Vision.
    Returns ProviderResult compatible with SkinAnalysisResponse schema.
    """
    # Detect MIME type from magic bytes (imghdr removed in Python 3.13)
    mime_type = _detect_mime(image_bytes)

    try:
        client = get_client()
        resp = await client.analyze_image_json(
            image_bytes,
            _PROMPT,
            mime_type=mime_type,
            schema_hint=_SCHEMA,
        )

        if resp.data:
            d = resp.data
            code = d.get("condition_code", "nv")
            if code not in HAM_CLASSES:
                code = "nv"

            all_probs = d.get("all_probabilities", {})
            # Normalise to ensure all keys present
            for k in HAM_CLASSES:
                all_probs.setdefault(k, 0.0)

            conditions = [
                {"name": HAM_CLASSES[k], "probability": float(v)}
                for k, v in sorted(all_probs.items(), key=lambda x: x[1], reverse=True)
            ]

            care = d.get("care_suggestions", [])
            clinical_note = d.get("clinical_notes", "")
            if clinical_note:
                care.insert(0, f"ℹ️ {clinical_note}")

            return ProviderResult(
                primary_label=d.get("condition_label", HAM_CLASSES.get(code, code)),
                confidence=float(d.get("confidence", 70.0)),
                risk_tier=_severity_to_tier(d.get("severity", "low")),
                conditions=conditions,
                factors=[
                    {"factor": "Condition Code",      "value": code,                          "impact": d.get("severity", "unknown")},
                    {"factor": "Needs Dermatologist", "value": str(d.get("needs_dermatologist", True)), "impact": "high"},
                    {"factor": "Image Quality",        "value": d.get("quality_assessment", "unknown"), "impact": "low"},
                ],
                suggestions=care,
                provider="gemini_vision",
                model_version="gemini-vision-temp-v1",
                is_temporary=True,
                latency_ms=resp.latency_ms,
                prompt_tokens=resp.prompt_tokens,
                output_tokens=resp.output_tokens,
                raw_response=resp.text,
                disclaimer=MEDICAL_DISCLAIMER,
                ai_provider_label="Gemini Vision AI (Temporary)",
            )

    except Exception as exc:
        logger.warning("Gemini skin analysis failed: %s", exc)

    # Fallback: cannot analyse
    return ProviderResult(
        primary_label="Unable to analyse — please consult a dermatologist",
        confidence=0.0,
        risk_tier="unknown",
        conditions=[],
        suggestions=[
            "AI vision service is temporarily unavailable.",
            "Please consult a board-certified dermatologist for evaluation.",
            "If you notice rapid changes in a mole (ABCDE: Asymmetry, Border, Color, Diameter, Evolution), seek urgent care.",
        ],
        provider="fallback",
        model_version="fallback-v1",
        is_temporary=True,
        disclaimer=MEDICAL_DISCLAIMER,
    )


def _severity_to_tier(severity: str) -> str:
    return {
        "benign": "low",
        "low":    "low",
        "moderate": "moderate",
        "high":     "high",
        "critical": "high",
    }.get(severity, "moderate")


def _detect_mime(data: bytes) -> str:
    """Detect image MIME type from magic bytes (no imghdr dependency)."""
    if data[:3] == b'\xff\xd8\xff':
        return "image/jpeg"
    if data[:8] == b'\x89PNG\r\n\x1a\n':
        return "image/png"
    if data[:6] in (b'GIF87a', b'GIF89a'):
        return "image/gif"
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        return "image/webp"
    if data[:2] in (b'BM',):
        return "image/bmp"
    return "image/jpeg"  # safe default
