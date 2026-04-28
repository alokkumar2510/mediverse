"""
MediVerse AI — Diabetes Provider (AI + Rule Engine Hybrid)
==============================================================
Strategy:
  1. Run deterministic rule engine on biomarkers → risk score (fast, free, reliable)
  2. Call Advanced AI with the biomarkers + rule score → AI-enhanced explanation,
     personalised recommendations, and confidence calibration.

Swap path:
  Replace this file (or the AI call) with your XGBoost inference.
  The service layer is unchanged.
"""
from __future__ import annotations

import logging

from app.ai.fallback_provider import get_ai_provider
from app.ai.provider_types import ProviderResult, MEDICAL_DISCLAIMER

logger = logging.getLogger("mediverse.ai.diabetes")

# ── Rule engine weights (replicate the trained-model heuristics) ───────────────
_RISK_WEIGHTS = {
    "glucose":         (140, 100, 40, 20),   # (high_threshold, mid_threshold, high_pts, mid_pts)
    "bmi":             (30, 25,  20, 10),
    "age":             (45, 35,  10,  5),
    "insulin":         (200, 100, 10,  5),
    "dpf":             (1.0, 0.5, 10,  5),
    "blood_pressure":  (90, 80,   5,  2),
    "pregnancies":     (5, 3,     5,  2),
}


def _rule_engine(inputs: dict) -> tuple[float, list[dict]]:
    """
    Deterministic risk scorer. Returns (score_0_to_100, risk_factors_list).
    """
    score = 0.0
    factors = []

    def _pts(val, high_thr, mid_thr, high_pts, mid_pts, label, unit=""):
        nonlocal score
        if val >= high_thr:
            score += high_pts
            factors.append({"factor": label, "value": f"{val}{unit}", "impact": "high"})
        elif val >= mid_thr:
            score += mid_pts
            factors.append({"factor": label, "value": f"{val}{unit}", "impact": "moderate"})

    g   = inputs.get("Glucose", 0)
    bmi = inputs.get("BMI", 0)
    age = inputs.get("Age", 0)
    ins = inputs.get("Insulin", 0)
    dpf = inputs.get("DiabetesPedigreeFunction", 0)
    bp  = inputs.get("BloodPressure", 0)
    prg = inputs.get("Pregnancies", 0)

    _pts(g,   140, 100, 40, 20, "Blood Glucose",           " mg/dL")
    _pts(bmi,  30,  25, 20, 10, "BMI (Body Mass Index)",   " kg/m²")
    _pts(age,  45,  35, 10,  5, "Age Risk",                " yrs")
    _pts(ins, 200, 100, 10,  5, "Serum Insulin",           " μU/mL")
    _pts(dpf,   1,  .5, 10,  5, "Family History Score",    "")
    _pts(bp,   90,  80,  5,  2, "Diastolic Blood Pressure"," mmHg")
    _pts(prg,   5,   3,  5,  2, "Pregnancies",             "")

    return min(score, 95.0), factors


def _tier(score: float) -> str:
    if score < 30:
        return "low"
    elif score < 60:
        return "moderate"
    return "high"


# ── AI prompt ──────────────────────────────────────────────────────────────
_SCHEMA = """{
  "risk_pct": <number 0-100>,
  "risk_tier": "<low|moderate|high>",
  "confidence": <number 0-100>,
  "top_risk_factors": [
    {"factor": "<name>", "value": "<value with unit>", "impact": "<high|moderate|low>", "advice": "<1-sentence clinical advice>"}
  ],
  "suggestions": ["<actionable recommendation>"],
  "screening_recommended": <true|false>,
  "algorithm": "AI + Rule Engine Hybrid",
  "model_version": "hybrid-temp-v1"
}"""


async def predict_diabetes(inputs: dict) -> ProviderResult:
    """
    Hybrid diabetes prediction:
    Rule engine → AI enhancement → ProviderResult
    """
    # Step 1: deterministic rule engine
    rule_score, rule_factors = _rule_engine(inputs)
    rule_tier = _tier(rule_score)

    # Step 2: AI enhancement
    prompt = f"""You are a clinical AI assistant supporting a diabetes risk screening tool.

Patient biomarkers:
- Glucose: {inputs.get('Glucose', 'unknown')} mg/dL
- BMI: {inputs.get('BMI', 'unknown')} kg/m²
- Age: {inputs.get('Age', 'unknown')} years
- Blood Pressure: {inputs.get('BloodPressure', 'unknown')} mmHg
- Serum Insulin: {inputs.get('Insulin', 'unknown')} μU/mL
- Skin Thickness: {inputs.get('SkinThickness', 'unknown')} mm
- Diabetes Pedigree Function: {inputs.get('DiabetesPedigreeFunction', 'unknown')}
- Pregnancies: {inputs.get('Pregnancies', 'unknown')}

Our rule engine estimated a preliminary risk score of {rule_score:.0f}/100 ({rule_tier} risk).

Task: Provide a comprehensive diabetes risk assessment in JSON format.
- Analyse each biomarker clinically
- Refine the risk percentage (you may adjust ±15 from the rule score based on clinical reasoning)
- List the 3 most impactful risk factors with brief, actionable advice
- Provide 4-6 personalised prevention recommendations
- Determine if clinical screening (HbA1c, OGTT) is recommended

Be precise, clinically grounded, and use plain language understandable to patients.
Do NOT diagnose diabetes — this is a screening tool."""

    try:
        provider = get_ai_provider()
        resp = await provider.generate_json(prompt, schema_hint=_SCHEMA)

        if resp.data:
            d = resp.data
            # Merge rule factors if AI didn't provide enough
            ai_factors = d.get("top_risk_factors", [])
            if len(ai_factors) < 2:
                ai_factors = [
                    {"factor": f["factor"], "value": f["value"], "impact": f["impact"], "advice": None}
                    for f in rule_factors[:3]
                ]
                
            provider_tag = resp.ai_provider.upper() if hasattr(resp, "ai_provider") else "AI"
            ai_label = f"{provider_tag} + Rule Engine"

            return ProviderResult(
                primary_label=f"Diabetes Risk: {d.get('risk_tier', rule_tier).capitalize()}",
                confidence=float(d.get("confidence", 70.0)),
                risk_tier=d.get("risk_tier", rule_tier),
                conditions=[{"name": f"Diabetes Risk", "probability": float(d.get("risk_pct", rule_score))}],
                factors=ai_factors,
                suggestions=d.get("suggestions", []),
                provider="hybrid",
                model_version=d.get("model_version", f"{resp.model}"),
                is_temporary=True,
                latency_ms=resp.latency_ms,
                prompt_tokens=resp.prompt_tokens,
                output_tokens=resp.output_tokens,
                raw_response=resp.text,
                disclaimer=MEDICAL_DISCLAIMER,
                ai_provider_label=ai_label,
            )

    except Exception as exc:
        logger.warning("AI diabetes call failed, falling back to rule engine: %s", exc)

    # Fallback: pure rule engine
    suggestions = {
        "low": [
            "Maintain your current healthy lifestyle.",
            "Schedule annual blood glucose checks.",
            "Eat a balanced diet rich in whole grains and vegetables.",
        ],
        "moderate": [
            "Consult your doctor for an HbA1c test.",
            "Reduce refined carbohydrates and sugary beverages.",
            "Aim for 150+ minutes of moderate exercise per week.",
            "Losing 5–7% body weight can reduce diabetes risk by 58%.",
        ],
        "high": [
            "⚠️ Please consult a physician promptly.",
            "Request HbA1c, fasting glucose, and OGTT testing.",
            "Significant dietary changes are urgently needed.",
            "Consider a CDC-recognized Diabetes Prevention Program.",
            "Consult a registered dietitian for a personalised meal plan.",
        ],
    }.get(rule_tier, [])

    return ProviderResult(
        primary_label=f"Diabetes Risk: {rule_tier.capitalize()}",
        confidence=65.0,
        risk_tier=rule_tier,
        conditions=[{"name": "Diabetes Risk", "probability": rule_score}],
        factors=[{"factor": f["factor"], "value": f["value"], "impact": f["impact"], "advice": None} for f in rule_factors],
        suggestions=suggestions,
        provider="rule_engine",
        model_version="rule-engine-v1",
        is_temporary=True,
        disclaimer=MEDICAL_DISCLAIMER,
        ai_provider_label="Rule Engine (AI unavailable — Temporary)",
    )
