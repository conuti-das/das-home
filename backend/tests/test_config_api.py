import pytest
from fastapi.testclient import TestClient
from pathlib import Path
from app.main import app
from app.config.manager import ConfigManager


@pytest.fixture(autouse=True)
def use_tmp_config(tmp_path, monkeypatch):
    tmp_manager = ConfigManager(data_dir=tmp_path)
    monkeypatch.setattr("app.api.config_routes.config_manager", tmp_manager)
    yield tmp_manager


@pytest.fixture
def client():
    return TestClient(app)


def test_get_config(client):
    resp = client.get("/api/config")
    assert resp.status_code == 200
    data = resp.json()
    assert data["locale"] == "de"
    assert data["version"] == 1


def test_put_config(client):
    resp = client.get("/api/config")
    config = resp.json()
    config["locale"] = "en"
    resp = client.put("/api/config", json=config)
    assert resp.status_code == 200
    resp = client.get("/api/config")
    assert resp.json()["locale"] == "en"


def test_get_dashboard(client):
    resp = client.get("/api/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert data["theme"] == "sap_horizon_dark"
    assert data["views"] == []


def test_put_dashboard(client):
    resp = client.get("/api/dashboard")
    dashboard = resp.json()
    dashboard["views"] = [{"id": "test", "name": "Test", "type": "grid", "sections": []}]
    resp = client.put("/api/dashboard", json=dashboard)
    assert resp.status_code == 200
    resp = client.get("/api/dashboard")
    assert len(resp.json()["views"]) == 1


def test_get_auth_status(client):
    resp = client.get("/api/auth/status")
    assert resp.status_code == 200
    assert "configured" in resp.json()
