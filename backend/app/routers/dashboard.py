"""
Dashboard router — /api/dashboard/*
Summary stats, recent activity, and metrics endpoints.
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser
from app.services import dashboard_service

router = APIRouter(tags=["Dashboard"])
DB = Annotated[AsyncSession, Depends(get_db)]


@router.get(
    "/summary",
    summary="Get dashboard KPI summary for current user",
)
async def get_summary(current_user: CurrentUser, db: DB):
    return await dashboard_service.get_summary(db, current_user)


@router.get(
    "/activity",
    summary="Get recent report activity (last 10)",
)
async def get_activity(current_user: CurrentUser, db: DB):
    return await dashboard_service.get_recent_activity(db, current_user)


@router.get(
    "/metrics",
    summary="Get time-series metrics for the last 30 days",
)
async def get_metrics(current_user: CurrentUser, db: DB):
    return await dashboard_service.get_metrics(db, current_user)
