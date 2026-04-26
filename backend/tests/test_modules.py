"""Reports and AI module endpoint tests."""
import pytest
from httpx import AsyncClient
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_list_reports_empty(client: AsyncClient, test_user):
    res = await client.get("/api/reports", headers=auth_headers(test_user))
    assert res.status_code == 200
    data = res.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_diabetes_predict(client: AsyncClient, test_user):
    payload = {
        "pregnancies": 2,
        "glucose": 120,
        "blood_pressure": 70,
        "skin_thickness": 20,
        "insulin": 80,
        "bmi": 25.5,
        "diabetes_pedigree": 0.35,
        "age": 30,
    }
    res = await client.post("/api/diabetes/predict", json=payload, headers=auth_headers(test_user))
    assert res.status_code == 200
    data = res.json()
    assert "risk_pct" in data
    assert "risk_tier" in data
    assert isinstance(data["suggestions"], list)


@pytest.mark.asyncio
async def test_diabetes_invalid_input(client: AsyncClient, test_user):
    res = await client.post(
        "/api/diabetes/predict",
        json={"glucose": -5},  # missing required fields + invalid glucose
        headers=auth_headers(test_user),
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_symptom_check(client: AsyncClient, test_user):
    res = await client.post(
        "/api/symptom/check",
        json={"text": "I have a severe headache and fever for 3 days"},
        headers=auth_headers(test_user),
    )
    assert res.status_code == 200
    data = res.json()
    assert "urgency_score" in data
    assert "conditions" in data


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    res = await client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
