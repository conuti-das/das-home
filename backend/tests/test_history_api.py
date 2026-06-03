"""Tests for /api/history (sparkline data endpoint).

Monkeypatches the HA WebSocket layer so tests run without a real HA instance.
"""
import time

import pytest
from fastapi.testclient import TestClient

from app.api import history_routes
from app.main import app
from app.ws import proxy as ws_proxy


@pytest.fixture(autouse=True)
def _reset_cache():
    history_routes.clear_cache()
    yield
    history_routes.clear_cache()


@pytest.fixture
def client():
    return TestClient(app)


def _install_fake_ha(monkeypatch, *, rows, connected=True, call_log=None):
    """Monkeypatch ws_proxy so _ha_send returns canned history rows."""
    call_log = call_log if call_log is not None else []

    async def fake_ensure():
        if not connected:
            raise ConnectionError("HA unavailable")

    async def fake_send(msg_type: str, **kwargs):
        call_log.append(msg_type)
        if msg_type == "history/history_during_period":
            eids = kwargs.get("entity_ids", [])
            return {"success": True, "result": {eid: rows for eid in eids}}
        return {"success": True, "result": {}}

    monkeypatch.setattr(ws_proxy, "_ensure_ha_connection", fake_ensure)
    monkeypatch.setattr(ws_proxy, "_ha_send", fake_send)
    monkeypatch.setattr(
        ws_proxy, "_ha_connection", object() if connected else None, raising=False
    )
    return call_log


def test_history_parses_numeric_points(client, monkeypatch):
    """Numeric rows become points; non-numeric states are dropped."""
    rows = [
        {"s": "21.5", "lu": 1717325000.0},
        {"s": "22.0", "lu": 1717328600.0},
        {"s": "unavailable", "lu": 1717332200.0},  # dropped (non-numeric)
        {"s": "22.3", "lu": 1717335800.0},
    ]
    _install_fake_ha(monkeypatch, rows=rows)
    resp = client.get("/api/history", params={"entity_id": "sensor.temp", "hours": 24})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["entity_id"] == "sensor.temp"
    assert data["points"][0] == {"t": 1717325000, "v": 21.5}
    assert [p["v"] for p in data["points"]] == [21.5, 22.0, 22.3]


def test_history_cache_hit_skips_ha_send(client, monkeypatch):
    """A second call within TTL is served from cache without hitting HA."""
    rows = [{"s": "1", "lu": 1.0}, {"s": "2", "lu": 2.0}]
    calls = _install_fake_ha(monkeypatch, rows=rows)
    r1 = client.get("/api/history", params={"entity_id": "sensor.x", "hours": 24})
    assert r1.status_code == 200
    n = len(calls)
    assert n > 0
    r2 = client.get("/api/history", params={"entity_id": "sensor.x", "hours": 24})
    assert r2.status_code == 200
    assert len(calls) == n  # no extra _ha_send call


def test_history_503_when_ha_down(client, monkeypatch):
    _install_fake_ha(monkeypatch, rows=[], connected=False)
    resp = client.get("/api/history", params={"entity_id": "sensor.x"})
    assert resp.status_code == 503


def test_history_lc_fallback_and_dropping(client, monkeypatch):
    """'lc' is used when 'lu' is missing; rows without state/timestamp drop."""
    rows = [
        {"s": "10", "lc": 100.0},   # lc fallback
        {"s": "11"},                # no timestamp -> dropped
        {"v": "bad"},               # no state -> dropped
        {"s": "12", "lu": 200.0},
    ]
    _install_fake_ha(monkeypatch, rows=rows)
    resp = client.get("/api/history", params={"entity_id": "sensor.x"})
    assert resp.status_code == 200
    pts = resp.json()["points"]
    assert [p["t"] for p in pts] == [100, 200]
    assert [p["v"] for p in pts] == [10.0, 12.0]


def test_history_rejects_invalid_hours(client, monkeypatch):
    """hours outside 1..168 is a 422 validation error (no HA call)."""
    _install_fake_ha(monkeypatch, rows=[])
    resp = client.get("/api/history", params={"entity_id": "sensor.x", "hours": 999})
    assert resp.status_code == 422
