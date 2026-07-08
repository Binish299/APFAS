"""Integration tests for the Nepali-English Speech Trainer API.

Run with:  python -m pytest backend/tests/ -v
"""
import io
import os
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


@pytest.fixture(scope="module")
def auth_token():
    """Obtain a valid JWT by registering or logging in."""
    payload = {
        "username": "testuser_e2e",
        "email": "test_e2e@example.com",
        "password": "TestPass123!",
    }
    r = client.post("/api/auth/register", json=payload)
    if r.status_code == 200:
        token = r.json()["token"]
    else:
        r = client.post("/api/auth/login", json={"username": "testuser_e2e", "password": "TestPass123!"})
        assert r.status_code == 200, f"Login also failed: {r.text}"
        token = r.json()["token"]
    yield token


def test_health_check():
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] in ("ok", "degraded")


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "online"


def test_register_duplicate(auth_token):
    payload = {
        "username": "testuser_e2e",
        "email": "test_e2e@example.com",
        "password": "TestPass123!",
    }
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 400
    assert "already" in r.json()["detail"].lower()


def test_login():
    r = client.post("/api/auth/login", json={
        "username": "testuser_e2e",
        "password": "TestPass123!",
    })
    assert r.status_code == 200
    data = r.json()
    assert "token" in data
    assert data["username"] == "testuser_e2e"


def test_login_wrong_password():
    r = client.post("/api/auth/login", json={
        "username": "testuser_e2e",
        "password": "wrongpassword",
    })
    assert r.status_code == 401


def test_analytics_no_auth():
    r = client.get("/api/analytics/history")
    assert r.status_code == 401


def test_analytics_with_auth(auth_token):
    r = client.get(
        "/api/analytics/history",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_analytics_summary(auth_token):
    r = client.get(
        "/api/analytics/summary",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert r.status_code == 200
    data = r.json()
    assert "average_score" in data


def test_analytics_count(auth_token):
    r = client.get(
        "/api/analytics/history/count",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert r.status_code == 200
    assert "total" in r.json()


def test_topics_list():
    r = client.get("/api/topics/list")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    if r.json():
        assert "topic" in r.json()[0]


def test_evaluate_pronunciation_no_audio(auth_token):
    r = client.post(
        "/api/speech/evaluate-pronunciation",
        headers={"Authorization": f"Bearer {auth_token}"},
        data={"target_text": "Hello world"},
    )
    assert r.status_code == 422  # missing audio_file


def test_evaluate_pronunciation_bad_extension(auth_token):
    fake_audio = io.BytesIO(b"this is not audio data")
    fake_audio.name = "test.txt"
    r = client.post(
        "/api/speech/evaluate-pronunciation",
        headers={"Authorization": f"Bearer {auth_token}"},
        data={"target_text": "Hello world"},
        files={"audio_file": ("test.txt", fake_audio, "text/plain")},
    )
    assert r.status_code == 400


def test_evaluate_topic_no_audio(auth_token):
    r = client.post(
        "/api/speech/evaluate-topic",
        headers={"Authorization": f"Bearer {auth_token}"},
        data={"topic_id": 1},
    )
    assert r.status_code == 422


def test_invalid_token():
    r = client.get(
        "/api/analytics/history",
        headers={"Authorization": "Bearer invalid_token_here"},
    )
    assert r.status_code == 401
