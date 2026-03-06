import os
import tempfile
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session

# Configure env before app import
os.environ["DATABASE_URL"] = "sqlite://"

from app.main import app
from app.db.database import get_session
from app.models.models import Enterprise, Team, User, TokenUsage, SystemConfig, PolicyViolation


@pytest.fixture(name="engine")
def engine_fixture():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        ent = Enterprise(name="Acme Corp", contact_email="admin@acme.test")
        session.add(ent)
        session.commit()
        session.refresh(ent)
        team = Team(name="Core", ingestion_key="sk-team-1234", token_budget_usd=200.0, current_spend_usd=50.0, provider="openai", enterprise_id=ent.id)
        session.add(team)
        session.add(User(email="alice@example.com", full_name="Alice A", password_hash="$2b$12$abcdefghijklmnopqrstuv"))
        session.add(User(email="bob@example.com", full_name="Bob B", password_hash="$2b$12$abcdefghijklmnopqrstuv"))
        session.add(TokenUsage(team_id=team.id, enterprise_id=ent.id, model_id="gpt-4o", prompt_tokens=10, completion_tokens=5, total_tokens=15, cost_usd=0.0123, user_id=1))
        session.add(TokenUsage(team_id=team.id, enterprise_id=ent.id, model_id="gpt-4o", prompt_tokens=20, completion_tokens=10, total_tokens=30, cost_usd=0.0456, user_id=2))
        session.add(PolicyViolation(team_id=team.id, violation_type="EMAIL", original_snippet="john@doe.com"))
        session.commit()
    yield engine


@pytest.fixture(name="client")
def client_fixture(engine):
    def override_get_session():
        with Session(engine) as session:
            yield session
    app.dependency_overrides[get_session] = override_get_session
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_get_dashboard_stats(client):
    res = client.get("/admin/stats")
    assert res.status_code == 200
    body = res.json()
    assert set(body.keys()) == {"total_spend", "active_teams", "total_tokens"}
    assert isinstance(body["total_spend"], float)
    assert body["active_teams"] == 1
    assert body["total_tokens"] >= 45


def test_get_teams_returns_usage_and_status(client):
    res = client.get("/admin/teams")
    assert res.status_code == 200
    teams = res.json()
    assert len(teams) == 1
    t = teams[0]
    assert t["name"] == "Core"
    assert t["budget"] == 200.0
    assert t["spent"] == 50.0
    assert t["usage_percent"] == round((50.0/200.0)*100, 1)
    assert t["status"] in {"Active", "Idle", "Critical"}


def test_usage_history_limits_and_formats(client):
    res = client.get("/admin/usage-history", params={"limit": 1})
    assert res.status_code == 200
    history = res.json()
    assert len(history) == 1
    item = history[0]
    assert set(["id","team","model","tokens","cost","time"]).issubset(item.keys())
    assert isinstance(item["cost"], str) and item["cost"].startswith("$")


def test_configure_provider_creates_and_updates(client):
    # Create new
    res = client.post("/admin/system/configure", json={"provider": "OpenAI", "key": "sk-test-1"})
    assert res.status_code in (200, 201)
    # Update existing
    res2 = client.post("/admin/system/configure", json={"provider": "openai", "key": "sk-test-2"})
    assert res2.status_code in (200, 201)

    # Status returns configured providers
    res3 = client.get("/admin/system/status")
    assert res3.status_code == 200
    providers = res3.json()
    assert any(p["provider"] in ("openai_key", "openai") for p in providers)


def test_delete_provider_config_handles_missing_and_success(client):
    # Delete missing should 404
    res = client.delete("/admin/system/config/gemini")
    assert res.status_code == 404

    # Create then delete
    client.post("/admin/system/configure", json={"provider": "gemini", "key": "sk-g-1"})
    res2 = client.delete("/admin/system/config/gemini")
    assert res2.status_code == 200
    assert res2.json()["status"] == "Deleted"


def test_leaderboard_top_spenders(client):
    res = client.get("/admin/leaderboard")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if data:
        first = data[0]
        assert set(["name","spend"]).issubset(first.keys())


def test_top_spenders_analytics(client):
    res = client.get("/admin/analytics/top-spenders")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if data:
        row = data[0]
        assert set(["name","spend","tokens"]).issubset(row.keys())


def test_update_team_validations_and_coercions(client, engine):
    with Session(engine) as s:
        team = s.exec(s.query(Team)).first()
        team_id = team.id
    # valid name and provider
    res = client.patch(f"/admin/teams/{team_id}", json={"name": "CoreX", "provider": "Gemini", "budget": "250"})
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "CoreX"
    assert body["provider"] == "gemini"
    assert body["token_budget_usd"] == 250.0

    # invalid budget
    res2 = client.patch(f"/admin/teams/{team_id}", json={"budget": "abc"})
    assert res2.status_code == 400


def test_member_lifecycle_add_list_remove(client, engine):
    with Session(engine) as s:
        team = s.exec(s.query(Team)).first()
        team_id = team.id

    # Add new member (creates missing user automatically)
    res = client.post(f"/admin/teams/{team_id}/members", json={"email": "new@acme.test", "full_name": "New User", "role": "Lead"})
    assert res.status_code == 200

    # Add same again should 400
    res2 = client.post(f"/admin/teams/{team_id}/members", json={"email": "new@acme.test", "full_name": "New User", "role": "Lead"})
    assert res2.status_code == 400

    # List members contains new user
    res3 = client.get(f"/admin/teams/{team_id}/members")
    assert res3.status_code == 200
    members = res3.json()
    assert any(m["email"] == "new@acme.test" for m in members)

    # Remove user
    res4 = client.delete(f"/admin/teams/{team_id}/members/new@acme.test")
    assert res4.status_code == 200
    assert res4.json()["status"] == "success"
