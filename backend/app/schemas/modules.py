"""AI module input/output schemas — UPDATED with full diabetes response."""
from pydantic import BaseModel, Field
from typing import Any


# ── Diabetes ──────────────────────────────────────────────────────────────────
class DiabetesPredictRequest(BaseModel):
    """
    Input biomarkers for diabetes prediction.
    All fields match the PIMA Indians Diabetes Dataset.
    Missing/zero values are imputed with population medians at inference time.
    """
    pregnancies: float = Field(default=0, ge=0, le=20,
        description="Number of times pregnant (0 for males; use 0 if not applicable)")
    glucose: float = Field(..., ge=44, le=300,
        description="Plasma glucose concentration (mg/dL) from 2-hour OGTT. Normal: 70–99.")
    blood_pressure: float = Field(default=72, ge=0, le=200,
        description="Diastolic blood pressure (mmHg). Normal: 60–80.")
    skin_thickness: float = Field(default=29, ge=0, le=100,
        description="Triceps skin fold thickness (mm). Optional.")
    insulin: float = Field(default=80, ge=0, le=1000,
        description="2-Hour serum insulin (mu U/ml). Normal fasting: 2.6–24.9.")
    bmi: float = Field(..., ge=10, le=80,
        description="Body mass index (kg/m²). Normal: 18.5–24.9.")
    diabetes_pedigree: float = Field(default=0.37, ge=0, le=3.0,
        description="Diabetes Pedigree Function — family history score (0.08–2.42 in dataset).")
    age: int = Field(..., ge=1, le=120,
        description="Age in years.")


class RiskFactor(BaseModel):
    factor: str
    value: float
    impact: str         # high | moderate | low
    advice: str | None


class DiabetesPredictResponse(BaseModel):
    risk_pct: float                     # 0–100
    risk_tier: str                      # low | moderate | high
    confidence: float                   # 0–100
    top_risk_factors: list[RiskFactor]
    suggestions: list[str]
    screening_recommended: bool
    model_version: str
    algorithm: str
    disclaimer: str


# ── Symptom ───────────────────────────────────────────────────────────────────
class SymptomCheckRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=2000)


class SymptomCheckResponse(BaseModel):
    conditions: list[dict[str, Any]]
    urgency_score: int      # 1-5
    urgency_label: str      # routine | urgent | emergency
    specialist: str
    disclaimer: str


# ── Image analysis base (xray, ecg, skin) ────────────────────────────────────
class ImageAnalysisResponse(BaseModel):
    module: str
    condition: str | None = None
    confidence: float | None = None
    recommendations: list[str] = []
    raw_result: dict[str, Any] = {}
    model_version: str = "stub"


# ── OCR ───────────────────────────────────────────────────────────────────────

class OcrMedicine(BaseModel):
    """Single extracted medicine with all clinical metadata."""
    name: str                         # canonical name (WHO/FDA)
    raw_name: str                     # as seen in prescription
    category: str | None = None       # pharmacological class
    brand_names: list[str] = []       # known brand names
    dosage: str | None = None         # e.g. "500 mg"
    frequency: str | None = None      # e.g. "Twice daily"
    timing: str | None = None         # e.g. "After meals"
    duration: str | None = None       # e.g. "5 days"
    instructions: str | None = None   # other instructions
    confidence: float = 1.0           # match confidence 0–1


class OcrPrescriptionResponse(BaseModel):
    medicines: list[OcrMedicine] = []
    doctor_name: str | None = None
    date: str | None = None
    patient_name: str | None = None
    notes: list[str] = []
    warnings: list[str] = []
    raw_text: str = ""
    overall_confidence: float = 0.0   # 0–100
    low_confidence: bool = False
    ocr_engine: str = ""
    medicine_count: int = 0


# ── Skin Analysis ─────────────────────────────────────────────────────────────

class SkinConditionProb(BaseModel):
    """Per-class probability breakdown."""
    code:        str    # e.g. "mel"
    label:       str    # e.g. "Melanoma"
    probability: float  # 0–100


class SkinAnalysisResponse(BaseModel):
    """Full skin lesion analysis response — EfficientNet-B3 / HAM10000."""
    # Primary prediction
    condition_code:      str
    condition_label:     str
    confidence:          float           # 0–100

    # All class probabilities (sorted desc)
    all_probabilities:   list[SkinConditionProb] = []

    # Clinical context
    severity:            str
    care_suggestions:    list[str] = []
    needs_dermatologist: bool

    # Uncertainty
    low_confidence:      bool
    tta_uncertainty:     float = 0.0    # TTA std dev

    # Image quality
    image_quality:       str = "unknown"     # good | blurry | dark | small
    quality_warnings:    list[str] = []

    # Advanced outputs
    heatmap_b64:         str | None = None  # base64 PNG Grad-CAM

# Metadata
    image_hash:          str = ""
    model_version:       str = ""
    report_id:           int | None = None
    disclaimer:          str = ""


# ── ECG Analysis ──────────────────────────────────────────────────────────────

class EcgConditionProb(BaseModel):
    """Per-class probability breakdown for ECG analysis."""
    label:       str    # e.g. "Normal Sinus Rhythm"
    probability: float  # 0–100


class EcgAnalysisResponse(BaseModel):
    """Full ECG analysis response — ResNet1D / PTB-XL."""
    # Primary prediction
    rhythm_type:         str
    confidence:          float           # 0–100

    # All class probabilities (sorted desc)
    all_probabilities:   list[EcgConditionProb] = []

    # Clinical context
    severity:            str
    recommendation:      str
    risk_flags:          list[str] = []
    needs_review:        bool

    # Uncertainty
    low_confidence:      bool

    # Signal metadata
    signal_quality:      str = "unknown"     # good | noisy | flat | short
    quality_warnings:    list[str] = []

    # Beat annotations (for waveform overlay UI)
    r_peaks:             list[int] = []     # sample indices of detected R-peaks
    heart_rate_bpm:      float | None = None

    # Engine metadata
    model_version:       str = ""
    is_demo:             bool = True
    report_id:           str | None = None
    disclaimer:          str = ""


# ── X-Ray Analysis ────────────────────────────────────────────────────────────

class XrayConditionProb(BaseModel):
    """Per-class probability for a single X-ray condition."""
    code:        str
    label:       str
    probability: float  # 0–100


class XrayTop3Item(BaseModel):
    """Top-3 predicted conditions."""
    code:       str
    label:      str
    confidence: float   # 0–100


class XrayAnalysisResponse(BaseModel):
    """Full chest X-ray analysis response — multi-model ensemble on 17 classes."""
    # Primary prediction
    top_condition:      str
    top_label:          str
    confidence:         float           # 0–100

    # Top-3 predictions
    top3:               list[XrayTop3Item] = []

    # All class probabilities (sorted desc)
    all_probabilities:  list[XrayConditionProb] = []

    # Clinical context
    severity:           str
    care_suggestions:   list[str] = []
    is_high_risk:       bool

    # Uncertainty
    low_confidence:     bool
    tta_uncertainty:    float = 0.0

    # Image quality
    image_quality:      str = "unknown"
    quality_warnings:   list[str] = []

    # Advanced outputs
    heatmap_b64:        str | None = None   # base64 Grad-CAM PNG

    # Metadata
    image_hash:         str = ""
    model_name:         str = ""
    model_version:      str = ""
    n_classes:          int = 17
    report_id:          str | None = None
    disclaimer:         str = ""
