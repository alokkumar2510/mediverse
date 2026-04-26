"""
MediVerse AI — Diabetes ML Inference Engine
=============================================
Loads the trained XGBoost/RandomForest bundle exported by train_diabetes.py
and provides fast, calibrated predictions with SHAP-based explanations.

Features:
- Singleton loader (model loaded once at startup)
- Calibrated probability output (0–100%)
- Feature importance / top risk factor extraction
- Risk tier classification (low / moderate / high)
- Prevention advice based on patient's specific factors
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────────────────
ML_DIR    = Path(__file__).resolve().parents[3] / "ml"
MODEL_PATH = ML_DIR / "exports" / "diabetes_xgb.pkl"
META_PATH  = ML_DIR / "exports" / "diabetes_meta.json"

# Fallback path (relative to backend, when running from backend/)
if not MODEL_PATH.exists():
    ML_DIR    = Path(__file__).resolve().parents[2] / ".." / "ml"
    MODEL_PATH = ML_DIR / "exports" / "diabetes_xgb.pkl"
    META_PATH  = ML_DIR / "exports" / "diabetes_meta.json"


# ── Risk config ───────────────────────────────────────────────────────────────
RISK_THRESHOLDS = {"low": 0.30, "moderate": 0.60}

FEATURE_LABELS = {
    "Pregnancies":              "Number of Pregnancies",
    "Glucose":                  "Blood Glucose Level",
    "BloodPressure":            "Blood Pressure",
    "SkinThickness":            "Skin Thickness",
    "Insulin":                  "Serum Insulin",
    "BMI":                      "Body Mass Index",
    "DiabetesPedigreeFunction": "Diabetes Family History Score",
    "Age":                      "Age",
    "Glucose_BMI":              "Glucose × BMI (Metabolic Risk)",
    "Age_risk":                 "Age Over 45 (Elevated Risk)",
    "Insulin_resistance":       "Insulin Resistance Index",
    "High_glucose":             "High Glucose Flag",
    "Obese":                    "Obesity Flag",
}

ADVICE_MAP = {
    "Glucose": {
        "threshold": 100,
        "advice": "Your blood glucose is elevated. Reduce refined carbohydrates, sugars, and processed foods. Monitor fasting glucose regularly.",
    },
    "BMI": {
        "threshold": 25,
        "advice": "Maintaining a healthy BMI (18.5–24.9) significantly reduces diabetes risk. Aim for 30–60 minutes of moderate exercise daily.",
    },
    "BloodPressure": {
        "threshold": 80,
        "advice": "Elevated blood pressure compounds diabetes risk. Limit sodium intake, increase potassium-rich foods, and manage stress.",
    },
    "Insulin": {
        "threshold": 100,
        "advice": "Abnormal insulin levels may indicate insulin resistance. A low-glycemic diet and resistance training can improve sensitivity.",
    },
    "DiabetesPedigreeFunction": {
        "threshold": 0.5,
        "advice": "Family history increases your risk. Proactive lifestyle changes and annual HbA1c screening are strongly recommended.",
    },
    "Age_risk": {
        "threshold": 0.5,
        "advice": "Risk of Type 2 diabetes increases after age 45. Annual fasting glucose and HbA1c tests are advised.",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# Singleton model loader
# ═══════════════════════════════════════════════════════════════════════════════
@dataclass
class DiabetesBundle:
    model: Any
    scaler: Any
    feature_names: list[str]
    feature_importances: dict[str, float]
    version: str
    algorithm: str
    meta: dict


_bundle: DiabetesBundle | None = None
_model_available: bool | None = None


def load_bundle() -> DiabetesBundle | None:
    """Load model once. Returns None if not trained yet."""
    global _bundle, _model_available

    if _model_available is False:
        return None
    if _bundle is not None:
        return _bundle

    if not MODEL_PATH.exists():
        logger.warning(
            "Diabetes model not found at %s. "
            "Run: python ml/training/train_diabetes.py",
            MODEL_PATH,
        )
        _model_available = False
        return None

    try:
        import joblib

        raw = joblib.load(MODEL_PATH)
        meta_dict = {}
        if META_PATH.exists():
            with open(META_PATH) as f:
                meta_dict = json.load(f)

        _bundle = DiabetesBundle(
            model=raw["model"],
            scaler=raw["scaler"],
            feature_names=raw["feature_names"],
            feature_importances=raw.get("feature_importances", {}),
            version=raw.get("version", "unknown"),
            algorithm=raw.get("algorithm", "unknown"),
            meta=meta_dict,
        )
        _model_available = True
        logger.info("✅ Diabetes model loaded (v%s, %s)", _bundle.version, _bundle.algorithm)
        return _bundle

    except Exception as e:
        logger.error("Failed to load diabetes model: %s", e)
        _model_available = False
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# Feature builder
# ═══════════════════════════════════════════════════════════════════════════════
def build_feature_vector(inputs: dict[str, float]) -> dict[str, float]:
    """
    Build the full feature vector (PIMA + engineered features) from API inputs.
    Handles missing/zero imputation with population medians from PIMA dataset.
    """
    # PIMA population medians for imputation
    medians = {
        "Pregnancies":              3.0,
        "Glucose":                122.0,
        "BloodPressure":           72.0,
        "SkinThickness":           29.0,
        "Insulin":                125.0,
        "BMI":                     32.0,
        "DiabetesPedigreeFunction": 0.37,
        "Age":                     33.0,
    }

    def safe(key: str) -> float:
        val = inputs.get(key, medians[key])
        if val is None or val == 0 and key in ["Glucose", "BloodPressure", "BMI"]:
            return medians[key]
        return float(val)

    pregnancies  = safe("Pregnancies")
    glucose      = safe("Glucose")
    blood_pressure = safe("BloodPressure")
    skin_thickness = safe("SkinThickness")
    insulin      = safe("Insulin")
    bmi          = safe("BMI")
    dpf          = safe("DiabetesPedigreeFunction")
    age          = safe("Age")

    # Engineered features (must match training)
    glucose_bmi       = glucose * bmi / 1000
    age_risk          = float(age >= 45)
    insulin_resistance = glucose / insulin if insulin > 0 else glucose / 25
    high_glucose      = float(glucose >= 100)
    obese             = float(bmi >= 30)

    return {
        "Pregnancies":              pregnancies,
        "Glucose":                  glucose,
        "BloodPressure":            blood_pressure,
        "SkinThickness":            skin_thickness,
        "Insulin":                  insulin,
        "BMI":                      bmi,
        "DiabetesPedigreeFunction": dpf,
        "Age":                      age,
        "Glucose_BMI":              glucose_bmi,
        "Age_risk":                 age_risk,
        "Insulin_resistance":       insulin_resistance,
        "High_glucose":             high_glucose,
        "Obese":                    obese,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Risk classifier & advice
# ═══════════════════════════════════════════════════════════════════════════════
def classify_risk(probability: float) -> str:
    if probability < RISK_THRESHOLDS["low"]:
        return "low"
    elif probability < RISK_THRESHOLDS["moderate"]:
        return "moderate"
    return "high"


def get_top_risk_factors(
    feature_vector: dict[str, float],
    feature_importances: dict[str, float],
    top_n: int = 3,
) -> list[dict]:
    """
    Returns top N contributing risk factors with human-readable labels.
    Combines model importance × abnormal value magnitude.
    """
    scored = []
    for feat, importance in feature_importances.items():
        val = feature_vector.get(feat, 0.0)
        label = FEATURE_LABELS.get(feat, feat)

        # Normalize importance (0–1) — multiply by whether the value is elevated
        # This surfaces the features that are BOTH important and abnormal
        elevation = 1.0  # default
        if feat == "Glucose" and val >= 100:
            elevation = min(val / 100, 2.0)
        elif feat == "BMI" and val >= 25:
            elevation = min(val / 25, 2.0)
        elif feat == "DiabetesPedigreeFunction" and val >= 0.5:
            elevation = min(val / 0.5, 2.0)
        elif feat == "Age" and val >= 45:
            elevation = 1.5
        elif feat == "Insulin" and (val > 200 or val < 20):
            elevation = 1.3

        scored.append({
            "feature": feat,
            "label": label,
            "importance": round(importance * elevation, 4),
            "value": round(val, 2),
        })

    scored.sort(key=lambda x: x["importance"], reverse=True)
    top = scored[:top_n]

    result = []
    for item in top:
        advice_entry = ADVICE_MAP.get(item["feature"])
        result.append({
            "factor": item["label"],
            "value": item["value"],
            "impact": "high" if item["importance"] > 0.15 else "moderate",
            "advice": advice_entry["advice"] if advice_entry else None,
        })

    return result


def get_prevention_advice(risk_tier: str, top_factors: list[dict]) -> list[str]:
    """Generate personalised prevention advice based on risk tier and factors."""
    base_advice = {
        "low": [
            "Maintain your current healthy lifestyle — you're in good shape!",
            "Continue regular physical activity (150+ min/week of moderate exercise).",
            "Eat a balanced diet rich in vegetables, whole grains, and lean proteins.",
            "Schedule an annual health check with blood glucose screening.",
        ],
        "moderate": [
            "Your risk is elevated — lifestyle changes can significantly reduce it.",
            "Reduce refined carbohydrates (white bread, rice, sugary drinks).",
            "Aim for at least 150 minutes of moderate exercise per week.",
            "Lose 5–7% of body weight if overweight — this can reduce risk by 58%.",
            "Ask your doctor for an HbA1c test and fasting glucose screening.",
        ],
        "high": [
            "⚠️ HIGH RISK — Please consult a physician as soon as possible.",
            "Request an HbA1c, fasting glucose, and 2-hour OGTT from your doctor.",
            "Diabetes prevention programs (e.g., CDC-recognized DPP) can reduce risk by 58%.",
            "Significant dietary changes are needed: eliminate sugary beverages and processed foods.",
            "Structured exercise program: start with 10-minute walks, build to 30+ min/day.",
            "Consider speaking to a registered dietitian for a personalised meal plan.",
        ],
    }

    advice = list(base_advice.get(risk_tier, []))

    # Add factor-specific advice (deduplicated)
    for factor in top_factors:
        if factor.get("advice") and factor["advice"] not in advice:
            advice.append(factor["advice"])

    return advice


# ═══════════════════════════════════════════════════════════════════════════════
# Main inference function
# ═══════════════════════════════════════════════════════════════════════════════
def predict(inputs: dict[str, float]) -> dict:
    """
    Run diabetes prediction on input biomarkers.
    Returns full result dict (risk_pct, tier, factors, advice, confidence).
    """
    bundle = load_bundle()

    # ── Stub mode if model not trained yet ────────────────────────────────────
    if bundle is None:
        return _stub_prediction(inputs)

    # ── Real model inference ──────────────────────────────────────────────────
    feature_vector = build_feature_vector(inputs)

    # Build numpy array in correct feature order
    x = np.array([[feature_vector[f] for f in bundle.feature_names]])

    # Scale
    x_scaled = bundle.scaler.transform(x)

    # Predict probability
    proba = bundle.model.predict_proba(x_scaled)[0][1]  # P(diabetic)
    risk_pct = round(float(proba) * 100, 1)
    risk_tier = classify_risk(proba)

    # Top risk factors
    top_factors = get_top_risk_factors(feature_vector, bundle.feature_importances)

    # Prevention advice
    advice = get_prevention_advice(risk_tier, top_factors)

    # Confidence score — calibrated models are reliable; we report it directly
    confidence = round(max(proba, 1 - proba) * 100, 1)

    return {
        "risk_pct": risk_pct,
        "risk_tier": risk_tier,
        "confidence": confidence,
        "top_risk_factors": top_factors,
        "suggestions": advice,
        "model_version": bundle.version,
        "algorithm": bundle.algorithm,
        "screening_recommended": risk_tier in ("moderate", "high"),
        "disclaimer": (
            "This is a screening tool trained on the PIMA Indians Diabetes Dataset. "
            "It is not a medical diagnosis. Consult a licensed physician for evaluation."
        ),
    }


def _stub_prediction(inputs: dict[str, float]) -> dict:
    """
    Returns a clearly labeled stub when model not trained.
    Used during development before training is run.
    """
    glucose = inputs.get("Glucose", 0)
    bmi = inputs.get("BMI", 0)

    # Simple heuristic stub (not ML)
    score = 0
    if glucose >= 140: score += 40
    elif glucose >= 100: score += 20
    if bmi >= 30: score += 20
    elif bmi >= 25: score += 10
    if inputs.get("Age", 0) >= 45: score += 10
    if inputs.get("DiabetesPedigreeFunction", 0) >= 0.5: score += 10

    risk_pct = float(min(score, 95))
    risk_tier = classify_risk(risk_pct / 100)

    return {
        "risk_pct": risk_pct,
        "risk_tier": risk_tier,
        "confidence": 60.0,
        "top_risk_factors": [
            {"factor": "Blood Glucose Level", "value": glucose, "impact": "high", "advice": None},
            {"factor": "Body Mass Index", "value": bmi, "impact": "moderate", "advice": None},
        ],
        "suggestions": get_prevention_advice(risk_tier, []),
        "model_version": "heuristic-stub-0.0.1",
        "algorithm": "Heuristic (model not trained)",
        "screening_recommended": risk_tier in ("moderate", "high"),
        "disclaimer": (
            "⚠️ STUB MODE: Train the model by running "
            "`python ml/training/train_diabetes.py`. "
            "This response uses simple heuristics only."
        ),
    }
