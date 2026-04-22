"""End-to-end tests for /api/insights and the version endpoint.

These tests monkeypatch the HA WebSocket layer so they can run without a real
HA instance. Each test is responsible for calling ``clear_cache()`` through
the fixture to avoid cross-test pollution.
"""
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.api import insights_routes
from app.main import app
from app.ws import proxy as ws_proxy


@pytest.fixture(autouse=True)
def _reset_cache():
    insights_routes.clear_cache()
    yield
    insights_routes.clear_cache()


@pytest.fixture
def client():
    return TestClient(app)


# ---------- Fake HA fixtures ----------


def _make_states():
    """Build a minimal HA state dump for the tests."""
    return [
        {
            "entity_id": "sensor.energy_meter",
            "attributes": {
                "device_class": "energy",
                "unit_of_measurement": "kWh",
                "friendly_name": "Energy Meter",
            },
        },
        {
            "entity_id": "binary_sensor.living_room_motion",
            "attributes": {
                "device_class": "motion",
                "friendly_name": "Living Room Motion",
            },
        },
        {
            "entity_id": "switch.lamp_a",
            "attributes": {"friendly_name": "Lamp A"},
        },
        {
            "entity_id": "climate.thermostat",
            "attributes": {"friendly_name": "Thermostat"},
        },
    ]


def _stats_rows(count: int, value: float, start: datetime):
    return [
        {
            "start": (start + timedelta(days=i)).isoformat(),
            "state": value,
        }
        for i in range(count)
    ]


def _install_fake_ha(monkeypatch, *, connected: bool = True, call_log=None):
    """Monkeypatch ws_proxy so _ha_send returns canned data.

    ``call_log`` — if given, a list — appended to with each ``msg_type`` seen.
    ``connected=False`` makes ``_ensure_ha_connection`` raise.
    """
    call_log = call_log if call_log is not None else []

    async def fake_ensure():
        if not connected:
            raise ConnectionError("HA unavailable")

    async def fake_send(msg_type: str, **kwargs):
        call_log.append(msg_type)
        if msg_type == "get_states":
            return {"success": True, "result": _make_states()}
        if msg_type == "recorder/statistics_during_period":
            ids = kwargs.get("statistic_ids", [])
            result = {}
            now = datetime.now(timezone.utc)
            for eid in ids:
                result[eid] = _stats_rows(1, 5.0, now)
            return {"success": True, "result": result}
        return {"success": True, "result": {}}

    monkeypatch.setattr(ws_proxy, "_ensure_ha_connection", fake_ensure)
    monkeypatch.setattr(ws_proxy, "_ha_send", fake_send)
    # Simulate a connected ws object when connected=True.
    monkeypatch.setattr(
        ws_proxy,
        "_ha_connection",
        object() if connected else None,
        raising=False,
    )
    return call_log


# ---------- Tests ----------


def test_happy_path_returns_insights(client, monkeypatch):
    _install_fake_ha(monkeypatch)
    resp = client.get("/api/insights")
    assert resp.status_code == 200, resp.text
    data = resp.json()

    # Schema shape.
    assert "generated_at" in data
    assert "kpis" in data
    assert "anomalies" in data
    assert "trends" in data
    assert "missing_kpis" in data
    assert data["cache_age_seconds"] == 0

    # All four expected KPIs present.
    assert set(data["kpis"]) == {
        "energy_cost_today",
        "occupancy_hours_today",
        "device_uptime_pct",
        "anomaly_count",
    }
    # Energy entity was auto-discovered.
    assert data["kpis"]["energy_cost_today"]["entity_id"] == "sensor.energy_meter"


def test_cache_hit_skips_ha_send(client, monkeypatch):
    calls: list[str] = []
    _install_fake_ha(monkeypatch, call_log=calls)

    r1 = client.get("/api/insights")
    assert r1.status_code == 200
    first_call_count = len(calls)
    assert first_call_count > 0

    # Second call within TTL must hit the cache and NOT call _ha_send again.
    r2 = client.get("/api/insights")
    assert r2.status_code == 200
    assert len(calls) == first_call_count
    # Cache-age should be >= 0 on the second call.
    assert r2.json()["cache_age_seconds"] >= 0


def test_503_when_ha_down_and_no_cache(client, monkeypatch):
    _install_fake_ha(monkeypatch, connected=False)
    resp = client.get("/api/insights")
    assert resp.status_code == 503
    assert "HA unavailable" in resp.json()["detail"]


def test_200_stale_when_ha_down_and_cache_present(client, monkeypatch):
    # First: populate cache with a healthy HA.
    _install_fake_ha(monkeypatch)
    r1 = client.get("/api/insights")
    assert r1.status_code == 200

    # Flip HA to offline AND expire the cache entry so we fall through.
    _install_fake_ha(monkeypatch, connected=False)
    # Force cache entry to appear old enough that _cache_get returns None but
    # _cache_get_any_age still has it.
    import time
    for key, (_stored_at, payload) in list(insights_routes._cache.items()):
        insights_routes._cache[key] = (
            time.monotonic() - (insights_routes._CACHE_TTL_SECONDS + 10),
            payload,
        )

    r2 = client.get("/api/insights")
    assert r2.status_code == 200
    body = r2.json()
    assert body["cache_age_seconds"] > 0
    # Payload must be the previously-cached one (same generated_at stamp).
    assert body["generated_at"] == r1.json()["generated_at"]


def test_empty_statistics_yields_no_data(client, monkeypatch):
    """Force HA to return states but empty stats rows — KPI should be unavailable."""
    async def fake_ensure():
        return None

    async def fake_send(msg_type: str, **kwargs):
        if msg_type == "get_states":
            return {"success": True, "result": _make_states()}
        if msg_type == "recorder/statistics_during_period":
            # Empty rows for every entity.
            ids = kwargs.get("statistic_ids", [])
            return {"success": True, "result": {eid: [] for eid in ids}}
        return {"success": True, "result": {}}

    monkeypatch.setattr(ws_proxy, "_ensure_ha_connection", fake_ensure)
    monkeypatch.setattr(ws_proxy, "_ha_send", fake_send)
    monkeypatch.setattr(ws_proxy, "_ha_connection", object(), raising=False)

    resp = client.get("/api/insights")
    assert resp.status_code == 200
    energy = resp.json()["kpis"]["energy_cost_today"]
    assert energy["available"] is False
    assert energy["reason"] == "no_data"


def test_single_entity_failure_isolated(client, monkeypatch):
    """If statistics fetch raises for energy id, that KPI goes error/no_data
    but others still succeed."""
    states = _make_states()

    async def fake_ensure():
        return None

    async def fake_send(msg_type: str, **kwargs):
        if msg_type == "get_states":
            return {"success": True, "result": states}
        if msg_type == "recorder/statistics_during_period":
            ids = kwargs.get("statistic_ids", [])
            # If the energy entity is in the batch, simulate a partial failure
            # by returning empty rows for it while populating the rest.
            now = datetime.now(timezone.utc)
            result = {}
            for eid in ids:
                if eid == "sensor.energy_meter":
                    result[eid] = []  # simulates missing stats
                else:
                    result[eid] = _stats_rows(1, 3.0, now)
            return {"success": True, "result": result}
        return {"success": True, "result": {}}

    monkeypatch.setattr(ws_proxy, "_ensure_ha_connection", fake_ensure)
    monkeypatch.setattr(ws_proxy, "_ha_send", fake_send)
    monkeypatch.setattr(ws_proxy, "_ha_connection", object(), raising=False)

    resp = client.get("/api/insights")
    assert resp.status_code == 200
    kpis = resp.json()["kpis"]
    assert kpis["energy_cost_today"]["available"] is False
    # Uptime still usable because its entities reported stats.
    assert kpis["device_uptime_pct"]["available"] is True


def test_statistics_call_failure_marks_reason_error(client, monkeypatch):
    """When the HA statistics call raises globally, KPIs whose entity was
    attempted should get reason='error' rather than 'no_data'."""
    async def fake_ensure():
        return None

    async def fake_send(msg_type: str, **kwargs):
        if msg_type == "get_states":
            return {"success": True, "result": _make_states()}
        if msg_type == "recorder/statistics_during_period":
            raise ConnectionError("HA hung up")
        return {"success": True, "result": {}}

    monkeypatch.setattr(ws_proxy, "_ensure_ha_connection", fake_ensure)
    monkeypatch.setattr(ws_proxy, "_ha_send", fake_send)
    monkeypatch.setattr(ws_proxy, "_ha_connection", object(), raising=False)

    resp = client.get("/api/insights")
    assert resp.status_code == 200
    kpis = resp.json()["kpis"]
    # Entities were discovered, but stats call raised -> error, not no_data.
    energy = kpis["energy_cost_today"]
    assert energy["available"] is False
    assert energy["reason"] == "error"


def test_overrides_are_applied(client, monkeypatch):
    _install_fake_ha(monkeypatch)
    resp = client.get(
        "/api/insights",
        params={
            "energy_entity": "sensor.override_energy",
            "occupancy_entity": "binary_sensor.override",
            "uptime_entities": "switch.x,switch.y",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["kpis"]["energy_cost_today"]["entity_id"] == "sensor.override_energy"


def test_health_endpoint_returns_version_from_config_yaml(client):
    """Regression test for the version-DRY change: /api/health must return
    the version string read from das-home/config.yaml, not a stale hardcoded
    literal. Read expected value from the same source so the test survives
    version bumps."""
    from pathlib import Path

    import yaml

    repo_root = Path(__file__).resolve().parents[2]
    with open(repo_root / "das-home" / "config.yaml") as f:
        expected_version = yaml.safe_load(f)["version"]

    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["version"] == expected_version
    # Sanity: the version string should be non-empty and not "unknown"
    assert expected_version and expected_version != "unknown"
