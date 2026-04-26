"""X-Ray analysis router — POST /api/xray/analyze"""
from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser
from app.schemas.modules import XrayAnalysisResponse
from app.services.xray_service import analyze_xray
from app.utils.file_validator import validate_image_upload

router = APIRouter()


@router.post(
    "/analyze",
    response_model=XrayAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Chest X-ray AI analysis",
    description=(
        "Upload a chest X-ray image (JPEG/PNG) and receive AI-powered screening results "
        "across 17 disease classes. Model trained on the Kaggle Chest X-Ray 17 Diseases dataset. "
        "**This is NOT a medical diagnosis.** Always consult a qualified radiologist."
    ),
    responses={
        415: {"description": "Unsupported file type — use JPEG or PNG"},
        413: {"description": "File too large — maximum 10 MB"},
    },
)
async def analyze_xray_endpoint(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(..., description="Chest X-ray image (JPEG/PNG, max 10 MB)"),
    heatmap: bool = Query(
        default=True,
        description="Generate Grad-CAM heatmap overlay (requires trained checkpoint)",
    ),
) -> XrayAnalysisResponse:
    await validate_image_upload(file)
    return await analyze_xray(db, current_user, file, generate_heatmap=heatmap)


@router.get(
    "/conditions",
    summary="List detectable X-ray conditions",
    description="Returns all conditions the X-ray AI model can screen for, with clinical context.",
)
async def list_conditions() -> dict:
    return {
        "conditions": [
            {"code": "Atelectasis",        "label": "Atelectasis",          "risk": "moderate"},
            {"code": "Cardiomegaly",        "label": "Cardiomegaly",          "risk": "high"},
            {"code": "Consolidation",       "label": "Consolidation",         "risk": "moderate"},
            {"code": "Edema",               "label": "Pulmonary Edema",       "risk": "high"},
            {"code": "Effusion",            "label": "Pleural Effusion",      "risk": "moderate"},
            {"code": "Emphysema",           "label": "Emphysema",             "risk": "moderate"},
            {"code": "Fibrosis",            "label": "Pulmonary Fibrosis",    "risk": "moderate"},
            {"code": "Hernia",              "label": "Hiatal/Diaphragmatic Hernia", "risk": "low"},
            {"code": "Infiltration",        "label": "Infiltration",          "risk": "moderate"},
            {"code": "Mass",                "label": "Lung Mass",             "risk": "high"},
            {"code": "No Finding",          "label": "No Finding",            "risk": "low"},
            {"code": "Nodule",              "label": "Pulmonary Nodule",      "risk": "moderate"},
            {"code": "Pleural_Thickening",  "label": "Pleural Thickening",   "risk": "moderate"},
            {"code": "Pneumonia",           "label": "Pneumonia",             "risk": "high"},
            {"code": "Pneumothorax",        "label": "Pneumothorax",          "risk": "high"},
            {"code": "Scoliosis",           "label": "Scoliosis",             "risk": "low"},
            {"code": "Tuberculosis",        "label": "Tuberculosis",          "risk": "high"},
        ],
        "model":          "Best of EfficientNet-B4 / DenseNet121 / ResNet50",
        "dataset":        "Chest X-Ray 17 Diseases (Kaggle)",
        "dataset_source": "https://www.kaggle.com/datasets/trainingdatapro/chest-xray-17-diseases",
        "disclaimer":     "For screening purposes only. Not a substitute for radiologist interpretation.",
    }
