"""Skin analysis router — /api/skin/*"""
from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser
from app.schemas.modules import SkinAnalysisResponse
from app.services.skin_service import analyze_skin
from app.utils.file_validator import validate_image_upload

router = APIRouter()


@router.post(
    "/analyze",
    response_model=SkinAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Skin lesion AI analysis",
    description=(
        "Upload a skin photo (JPEG/PNG/WEBP) and receive AI-powered preliminary "
        "screening results. Model: EfficientNet-B3 trained on HAM10000 (ISIC 2018). "
        "**This is NOT a medical diagnosis.** Always consult a dermatologist."
    ),
    responses={
        415: {"description": "Unsupported file type — use JPEG, PNG, or WEBP"},
        413: {"description": "File too large — maximum 10 MB"},
    },
)
async def analyze_skin_image(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(..., description="Skin photo (JPEG/PNG/WEBP, max 10 MB)"),
    heatmap: bool = Query(
        default=False,
        description="Generate Grad-CAM heatmap overlay (requires training checkpoint)",
    ),
) -> SkinAnalysisResponse:
    await validate_image_upload(file)
    return await analyze_skin(db, current_user, file, generate_heatmap=heatmap)


@router.get(
    "/conditions",
    summary="List detectable skin conditions",
    description="Returns all skin conditions the AI model can screen for, with clinical context.",
)
async def list_conditions() -> dict:
    return {
        "conditions": [
            {
                "code":        "nv",
                "label":       "Melanocytic Nevi",
                "description": "Common benign moles. ABCDE rule applies.",
                "risk":        "low",
            },
            {
                "code":        "mel",
                "label":       "Melanoma",
                "description": "Potentially malignant skin cancer. Urgent evaluation needed.",
                "risk":        "high",
            },
            {
                "code":        "bkl",
                "label":       "Benign Keratosis",
                "description": "Seborrheic keratoses, lichen planus-like keratoses.",
                "risk":        "low",
            },
            {
                "code":        "bcc",
                "label":       "Basal Cell Carcinoma",
                "description": "Most common skin cancer. Highly treatable if caught early.",
                "risk":        "high",
            },
            {
                "code":        "akiec",
                "label":       "Actinic Keratoses",
                "description": "Precancerous lesion from UV damage. Consult dermatologist.",
                "risk":        "moderate",
            },
            {
                "code":        "vasc",
                "label":       "Vascular Lesion",
                "description": "Cherry angiomas, angiokeratomas, pyogenic granulomas.",
                "risk":        "low",
            },
            {
                "code":        "df",
                "label":       "Dermatofibroma",
                "description": "Benign fibrous nodule. Usually harmless.",
                "risk":        "low",
            },
        ],
        "model":          "EfficientNet-B3",
        "dataset":        "HAM10000 (ISIC 2018 Task 3)",
        "dataset_source": "https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000",
        "disclaimer":     "For screening purposes only. Not a substitute for professional diagnosis.",
    }
