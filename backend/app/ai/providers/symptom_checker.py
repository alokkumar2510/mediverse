"""
MediVerse AI — Symptom Checker Provider (Gemini Primary)
=========================================================
Gemini is the primary engine for symptom triage.

Swap path: replace _call_gemini() with your NLP/transformer model.
"""
from __future__ import annotations

import logging

from app.ai.gemini_client import get_client
from app.ai.provider_types import ProviderResult, MEDICAL_DISCLAIMER

logger = logging.getLogger("mediverse.ai.symptom")

_SCHEMA = """{
  "conditions": [
    {"name": "<condition name>", "probability": <0.0-1.0>, "icd_hint": "<ICD-10 code hint>"}
  ],
  "urgency_score": <1-5>,
  "urgency_label": "<routine|urgent|emergency>",
  "specialist": "<recommended specialist type>",
  "red_flags": ["<warning symptom if any>"],
  "self_care_tips": ["<actionable tip>"],
  "when_to_seek_care": "<plain-language advice>",
  "confidence": <0-100>
}"""


async def check_symptoms(text: str, age: int | None = None, gender: str | None = None) -> ProviderResult:
    """
    Analyse free-text symptoms using Gemini.
    Returns ProviderResult with conditions, urgency, specialist recommendation.
    """
    demo_ctx = ""
    if age:
        demo_ctx += f"Patient age: {age}. "
    if gender:
        demo_ctx += f"Gender: {gender}. "

    prompt = f"""You are a clinical triage assistant supporting a preliminary symptom checker.
This is a SCREENING tool only — not a diagnostic system.

{demo_ctx}Patient-reported symptoms:
"{text}"

Task: Provide a structured clinical triage assessment.
- List up to 5 possible conditions (ranked by likelihood) with rough probability estimates
- Assign urgency: 1=routine follow-up, 2=schedule appointment soon, 3=urgent (within 24h), 4=very urgent (go to ER), 5=emergency (call 911/112)
- Recommend the appropriate medical specialist
- Flag any red-flag symptoms that require immediate attention
- Provide 3-4 practical self-care tips (where appropriate and safe)
- State clearly when the patient should seek in-person care

Be compassionate, clear, non-alarmist unless genuinely warranted.
Do NOT provide diagnoses — this is a triage tool.
Respond ONLY in JSON format."""

    try:
        client = get_client()
        resp = await client.generate_json(prompt, schema_hint=_SCHEMA)

        if resp.data:
            d = resp.data
            conditions = d.get("conditions", [])
            urgency = d.get("urgency_score", 2)
            urgency_label = d.get("urgency_label", "routine")
            specialist = d.get("specialist", "General Practitioner")
            red_flags = d.get("red_flags", [])
            tips = d.get("self_care_tips", [])
            when = d.get("when_to_seek_care", "Consult a doctor if symptoms worsen.")
            conf = float(d.get("confidence", 70.0))

            suggestions = tips.copy()
            if when:
                suggestions.append(f"📅 {when}")
            if red_flags:
                suggestions.insert(0, f"🚨 Red flags: {', '.join(red_flags)}")

            return ProviderResult(
                primary_label=conditions[0]["name"] if conditions else "Unspecified",
                confidence=conf,
                risk_tier=_urgency_to_tier(urgency),
                conditions=conditions,
                factors=[{"factor": "Urgency", "value": str(urgency), "impact": urgency_label}],
                suggestions=suggestions,
                provider="gemini",
                model_version="gemini-temp-v1",
                is_temporary=True,
                latency_ms=resp.latency_ms,
                prompt_tokens=resp.prompt_tokens,
                output_tokens=resp.output_tokens,
                raw_response=resp.text,
                disclaimer=MEDICAL_DISCLAIMER,
                ai_provider_label="Gemini AI (Temporary)",
            )

    except Exception as exc:
        logger.warning("Gemini symptom check failed: %s", exc)

    # Fallback stub
    return ProviderResult(
        primary_label="Analysis Unavailable",
        confidence=0.0,
        risk_tier="unknown",
        conditions=[{"name": "Service temporarily unavailable", "probability": 0.0}],
        suggestions=[
            "The AI service is temporarily unavailable.",
            "Please consult a healthcare provider directly.",
        ],
        provider="fallback",
        model_version="fallback-v1",
        is_temporary=True,
        disclaimer=MEDICAL_DISCLAIMER,
    )


def _urgency_to_tier(score: int) -> str:
    if score <= 2:
        return "low"
    elif score == 3:
        return "moderate"
    return "high"
