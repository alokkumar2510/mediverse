"""Diabetes router — /api/diabetes/*"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser
from app.schemas.modules import DiabetesPredictRequest, DiabetesPredictResponse
from app.services.diabetes_service import predict_diabetes

router = APIRouter()


@router.post(
    "/predict",
    response_model=DiabetesPredictResponse,
    summary="Predict diabetes risk from clinical biomarkers",
    description=(
        "Accepts 8 PIMA-dataset biomarkers and returns a calibrated diabetes risk score, "
        "risk tier (low/moderate/high), top contributing factors, and evidence-based advice. "
        "Powered by XGBoost trained on the PIMA Indians Diabetes Dataset (UCI)."
    ),
    tags=["AI — Diabetes"],
)
async def predict(
    body: DiabetesPredictRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> DiabetesPredictResponse:
    return await predict_diabetes(db, current_user, body)
