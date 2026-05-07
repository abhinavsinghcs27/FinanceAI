import os
from pathlib import Path

os.environ["FINANCEAI_DB_PATH"] = str(Path(__file__).with_name("test_financeai.db"))
os.environ["SEED_DEMO_DATA"] = "true"
os.environ["OPENAI_API_KEY"] = ""

from fastapi.testclient import TestClient

from main import app, DB_PATH, init_db


client = TestClient(app)


def setup_module() -> None:
    Path(DB_PATH).unlink(missing_ok=True)
    init_db()


def login_token() -> str:
    response = client.post(
        "/api/auth/login",
        json={"email": "profile@financeai.app", "password": "demo1234"},
    )
    assert response.status_code == 200
    return response.json()["token"]


def auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {login_token()}"}


def test_health_reports_local_ai_provider() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["ai_provider"] == "local_rules"


def test_dashboard_requires_auth() -> None:
    response = client.get("/api/dashboard")
    assert response.status_code == 401


def test_dashboard_and_ai_summary_for_demo_user() -> None:
    headers = auth_headers()
    dashboard = client.get("/api/dashboard", headers=headers)
    assert dashboard.status_code == 200
    assert dashboard.json()["summary_cards"]

    insight = client.post("/api/ai/portfolio-summary", headers=headers)
    assert insight.status_code == 200
    body = insight.json()
    assert body["source"] == "local_rules"
    assert body["summary"]
    assert body["disclaimer"]


def test_ai_chat_uses_portfolio_context() -> None:
    response = client.post(
        "/api/ai/chat",
        headers=auth_headers(),
        json={"question": "Why is my portfolio risky?"},
    )
    assert response.status_code == 200
    assert "risk" in response.json()["summary"].lower()


def test_manual_transaction_lifecycle() -> None:
    headers = auth_headers()
    created = client.post(
        "/api/transactions",
        headers=headers,
        json={
            "date": "2026-04-02",
            "type": "Buy",
            "symbol": "KO",
            "quantity": 1,
            "price": 10,
        },
    )
    assert created.status_code == 200
    transaction_id = created.json()["transaction"]["id"]

    listed = client.get("/api/transactions", headers=headers)
    assert listed.status_code == 200
    assert any(item["id"] == transaction_id for item in listed.json()["transactions"])

    deleted = client.delete(f"/api/transactions/{transaction_id}", headers=headers)
    assert deleted.status_code == 200


def test_report_generation_and_download() -> None:
    headers = auth_headers()
    generated = client.post(
        "/api/reports/generate",
        headers=headers,
        json={
            "format": "PDF Document",
            "date_range": "Last Month",
            "sections": ["Portfolio Summary", "Risk Analysis"],
        },
    )
    assert generated.status_code == 200
    report_id = generated.json()["report"]["id"]

    downloaded = client.get(f"/api/reports/{report_id}/download", headers=headers)
    assert downloaded.status_code == 200
    assert downloaded.content
