"""Symptom checker router — /api/symptom/*"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser
from app.schemas.modules import SymptomCheckRequest, SymptomCheckResponse
from app.services.symptom_service import check_symptoms   # ← now Gemini-powered

router = APIRouter()


@router.post(
    "/check",
    response_model=SymptomCheckResponse,
    summary="AI-powered symptom triage (Gemini)",
)
async def check(
    body: SymptomCheckRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> SymptomCheckResponse:
    return await check_symptoms(db, current_user, body)
