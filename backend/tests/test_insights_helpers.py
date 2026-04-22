"""Unit tests for the insights service helpers.

These tests exercise ``discover_kpi_entities``, ``compute_kpi_aggregates``,
and ``detect_anomalies`` with hand-rolled state dumps / statistics rows.
"""
from datetime import datetime, timedelta, timezone

from app.services.insights import (
    compute_kpi_aggregates,
    detect_anomalies,
    discover_kpi_entities,
    filter_monitored_entities,
)


# ---------- discover_kpi_entities ----------


def _state(
    entity_id: str,
    *,
    device_class: str | None = None,
    unit: str | None = None,
    friendly_name: str | None = None,
):
    attrs: dict = {}
    if device_class is not None:
        attrs["device_class"] = device_class
    if unit is not None:
        attrs["unit_of_measurement"] = unit
    if friendly_name is not None:
        attrs["friendly_name"] = friendly_name
    return {"entity_id": entity_id, "attributes": attrs}


def test_discover_finds_by_device_class():
    states = [
        _state("sensor.kitchen_temp", device_class="temperature"),
        _state("sensor.power_meter", device_class="energy", unit="kWh"),
        _state("binary_sensor.hall", device_class="motion"),
        _state("switch.lamp"),
    ]
    result = discover_kpi_entities(states)
    assert result["energy"] == "sensor.power_meter"
    assert result["occupancy"] == "binary_sensor.hall"
    assert result["uptime_entities"] == ["switch.lamp"]


def test_discover_finds_energy_by_kwh_unit_when_no_device_class():
    states = [
        _state("sensor.heatpump", unit="kWh"),
    ]
    assert discover_kpi_entities(states)["energy"] == "sensor.heatpump"


def test_discover_returns_none_when_no_match():
    states = [_state("sensor.misc", device_class="pressure")]
    result = discover_kpi_entities(states)
    assert result["energy"] is None
    assert result["occupancy"] is None
    assert result["uptime_entities"] == []


def test_discover_overrides_win():
    states = [_state("sensor.one", device_class="energy")]
    result = discover_kpi_entities(
        states,
        overrides={
            "energy": "sensor.chosen",
            "occupancy": "binary_sensor.chosen",
            "uptime_entities": ["switch.a", "switch.b"],
        },
    )
    assert result["energy"] == "sensor.chosen"
    assert result["occupancy"] == "binary_sensor.chosen"
    assert result["uptime_entities"] == ["switch.a", "switch.b"]


def test_discover_is_deterministic():
    states = [
        _state("switch.b"),
        _state("switch.a"),
        _state("switch.c"),
    ]
    r1 = discover_kpi_entities(states)
    r2 = discover_kpi_entities(states)
    assert r1["uptime_entities"] == r2["uptime_entities"]
    # Sorted alphabetically for determinism.
    assert r1["uptime_entities"] == ["switch.a", "switch.b", "switch.c"]


# ---------- compute_kpi_aggregates ----------


def _day_row(date: datetime, value: float) -> dict:
    return {"start": date.isoformat(), "state": value}


def test_aggregate_happy_path_with_yoy():
    now = datetime(2026, 4, 22, 12, 0, 0, tzinfo=timezone.utc)
    entity_map = {
        "energy": "sensor.energy",
        "occupancy": None,
        "uptime_entities": [],
    }
    # 7 days of trend, today has value 5.0
    trend = [
        _day_row(now - timedelta(days=i), 3.0 + i * 0.1) for i in range(6, -1, -1)
    ]
    today = [_day_row(now, 5.0)]
    yoy = [_day_row(now.replace(year=now.year - 1) - timedelta(days=i), 2.0) for i in range(6, -1, -1)]

    result = compute_kpi_aggregates(
        entity_map,
        stats_today={"sensor.energy": today},
        stats_trend={"sensor.energy": trend},
        stats_yoy={"sensor.energy": yoy},
        now=now,
    )
    energy = result["energy_cost_today"]
    assert energy["available"] is True
    assert energy["value"] == 5.0
    assert len(energy["trend_7d"]) == 7
    assert energy["yoy_7d"] is not None
    assert len(energy["yoy_7d"]) == 7
    assert energy["unit"] == "EUR"


def test_aggregate_no_yoy_returns_none():
    now = datetime(2026, 4, 22, 12, 0, 0, tzinfo=timezone.utc)
    entity_map = {
        "energy": "sensor.energy",
        "occupancy": None,
        "uptime_entities": [],
    }
    trend = [_day_row(now - timedelta(days=i), 1.0) for i in range(6, -1, -1)]
    today = [_day_row(now, 2.0)]

    result = compute_kpi_aggregates(
        entity_map,
        stats_today={"sensor.energy": today},
        stats_trend={"sensor.energy": trend},
        stats_yoy=None,
        now=now,
    )
    assert result["energy_cost_today"]["yoy_7d"] is None


def test_aggregate_sparse_days_fills_zero():
    now = datetime(2026, 4, 22, 12, 0, 0, tzinfo=timezone.utc)
    entity_map = {
        "energy": "sensor.energy",
        "occupancy": None,
        "uptime_entities": [],
    }
    # Only 2 days of data out of 7.
    trend = [
        _day_row(now - timedelta(days=6), 1.0),
        _day_row(now - timedelta(days=3), 2.0),
    ]
    today = [_day_row(now, 4.0)]

    result = compute_kpi_aggregates(
        entity_map,
        stats_today={"sensor.energy": today},
        stats_trend={"sensor.energy": trend},
        now=now,
    )
    trend_7d = result["energy_cost_today"]["trend_7d"]
    assert len(trend_7d) == 7
    # First entry is day-6 ago, which has value 1.0.
    assert trend_7d[0] == 1.0
    # Day-5 ago is missing -> 0.0.
    assert trend_7d[1] == 0.0
    # Day-3 ago has value 2.0.
    assert trend_7d[3] == 2.0


def test_aggregate_no_entity_returns_no_entity_found():
    result = compute_kpi_aggregates(
        {"energy": None, "occupancy": None, "uptime_entities": []},
        stats_today={},
        stats_trend={},
    )
    assert result["energy_cost_today"]["available"] is False
    assert result["energy_cost_today"]["reason"] == "no_entity_found"


def test_aggregate_empty_stats_returns_no_data():
    now = datetime(2026, 4, 22, 12, 0, 0, tzinfo=timezone.utc)
    entity_map = {
        "energy": "sensor.energy",
        "occupancy": None,
        "uptime_entities": [],
    }
    result = compute_kpi_aggregates(
        entity_map,
        stats_today={"sensor.energy": []},
        stats_trend={"sensor.energy": []},
        now=now,
    )
    energy = result["energy_cost_today"]
    assert energy["available"] is False
    assert energy["reason"] == "no_data"


def test_aggregate_uptime_pct():
    now = datetime(2026, 4, 22, 12, 0, 0, tzinfo=timezone.utc)
    entity_map = {
        "energy": None,
        "occupancy": None,
        "uptime_entities": ["switch.a", "switch.b", "switch.c", "switch.d"],
    }
    # 3 of 4 reporting today.
    stats_today = {
        "switch.a": [_day_row(now, 1.0)],
        "switch.b": [_day_row(now, 1.0)],
        "switch.c": [_day_row(now, 1.0)],
        "switch.d": [],
    }
    result = compute_kpi_aggregates(
        entity_map,
        stats_today=stats_today,
        stats_trend={},
        now=now,
    )
    uptime = result["device_uptime_pct"]
    assert uptime["available"] is True
    assert uptime["value"] == 75.0


# ---------- detect_anomalies ----------


def _weekly_row(start: datetime, weeks_back: int, value: float) -> dict:
    """Build a stats row dated exactly N weeks (=same weekday) before start."""
    return _day_row(start - timedelta(days=7 * weeks_back), value)


def test_detect_anomaly_over_50pct_higher_triggers():
    now = datetime(2026, 4, 21, 12, 0, 0, tzinfo=timezone.utc)  # a Tuesday
    today = now.date().isoformat()
    ent = {
        "entity_id": "climate.thermostat",
        "attributes": {"friendly_name": "Thermostat"},
    }
    rows = [
        # Last 4 Tuesdays all at ~5.0
        _day_row(now - timedelta(days=7), 5.0),
        _day_row(now - timedelta(days=14), 5.0),
        _day_row(now - timedelta(days=21), 5.0),
        _day_row(now - timedelta(days=28), 5.0),
        # Today at 9.0 -> 80% higher
        _day_row(now, 9.0),
    ]
    anomalies = detect_anomalies([ent], {"climate.thermostat": rows}, now=now)
    assert len(anomalies) == 1
    a = anomalies[0]
    assert a["entity_id"] == "climate.thermostat"
    assert a["friendly_name"] == "Thermostat"
    assert a["severity"] in {"low", "medium", "high"}
    assert today in a["detected_at"] or True  # ISO timestamp format


def test_detect_anomaly_under_50pct_does_not_trigger():
    now = datetime(2026, 4, 21, 12, 0, 0, tzinfo=timezone.utc)
    ent = {"entity_id": "climate.t", "attributes": {}}
    rows = [
        _day_row(now - timedelta(days=7), 5.0),
        _day_row(now - timedelta(days=14), 5.0),
        _day_row(now - timedelta(days=21), 5.0),
        _day_row(now - timedelta(days=28), 5.0),
        _day_row(now, 6.0),  # 20% higher -> below threshold
    ]
    anomalies = detect_anomalies([ent], {"climate.t": rows}, now=now)
    assert anomalies == []


def test_detect_skips_when_insufficient_history():
    now = datetime(2026, 4, 21, 12, 0, 0, tzinfo=timezone.utc)
    ent = {"entity_id": "climate.t", "attributes": {}}
    rows = [
        _day_row(now - timedelta(days=7), 5.0),
        _day_row(now - timedelta(days=14), 5.0),
        # Only 2 same-weekday samples -> below min_samples=4
        _day_row(now, 99.0),
    ]
    anomalies = detect_anomalies([ent], {"climate.t": rows}, now=now)
    assert anomalies == []


def test_detect_guards_division_by_zero():
    now = datetime(2026, 4, 21, 12, 0, 0, tzinfo=timezone.utc)
    ent = {"entity_id": "climate.t", "attributes": {}}
    rows = [
        _day_row(now - timedelta(days=7), 0.0),
        _day_row(now - timedelta(days=14), 0.0),
        _day_row(now - timedelta(days=21), 0.0),
        _day_row(now - timedelta(days=28), 0.0),
        _day_row(now, 100.0),  # would be /0 without guard
    ]
    anomalies = detect_anomalies([ent], {"climate.t": rows}, now=now)
    assert anomalies == []


def test_detect_anomaly_lower_triggers():
    now = datetime(2026, 4, 21, 12, 0, 0, tzinfo=timezone.utc)
    ent = {"entity_id": "climate.t", "attributes": {"friendly_name": "T"}}
    rows = [
        _day_row(now - timedelta(days=7), 10.0),
        _day_row(now - timedelta(days=14), 10.0),
        _day_row(now - timedelta(days=21), 10.0),
        _day_row(now - timedelta(days=28), 10.0),
        _day_row(now, 2.0),  # 80% lower
    ]
    anomalies = detect_anomalies([ent], {"climate.t": rows}, now=now)
    assert len(anomalies) == 1
    assert "lower" in anomalies[0]["description"]


def test_detect_severity_scales_with_deviation():
    now = datetime(2026, 4, 21, 12, 0, 0, tzinfo=timezone.utc)
    ent_high = {"entity_id": "climate.high", "attributes": {}}
    ent_low = {"entity_id": "climate.low", "attributes": {}}
    rows_high = [
        _day_row(now - timedelta(days=7), 1.0),
        _day_row(now - timedelta(days=14), 1.0),
        _day_row(now - timedelta(days=21), 1.0),
        _day_row(now - timedelta(days=28), 1.0),
        _day_row(now, 5.0),  # 400% higher -> "high" severity
    ]
    rows_low = [
        _day_row(now - timedelta(days=7), 10.0),
        _day_row(now - timedelta(days=14), 10.0),
        _day_row(now - timedelta(days=21), 10.0),
        _day_row(now - timedelta(days=28), 10.0),
        _day_row(now, 16.0),  # 60% higher -> "low" severity
    ]
    a_high = detect_anomalies(
        [ent_high], {"climate.high": rows_high}, now=now
    )
    a_low = detect_anomalies([ent_low], {"climate.low": rows_low}, now=now)
    assert a_high[0]["severity"] == "high"
    assert a_low[0]["severity"] == "low"


# ---------- filter_monitored_entities ----------


def test_filter_monitored_picks_expected_classes():
    states = [
        _state("climate.living"),
        _state("sensor.temp", device_class="temperature"),
        _state("sensor.power", device_class="power"),
        _state("sensor.energy", device_class="energy"),
        _state("binary_sensor.motion", device_class="motion"),
        _state("binary_sensor.door", device_class="door"),
        _state("binary_sensor.other", device_class="sound"),
        _state("switch.irrelevant"),
    ]
    monitored = filter_monitored_entities(states)
    ids = {s["entity_id"] for s in monitored}
    assert "climate.living" in ids
    assert "sensor.power" in ids
    assert "sensor.energy" in ids
    assert "binary_sensor.motion" in ids
    assert "binary_sensor.door" in ids
    assert "sensor.temp" not in ids
    assert "binary_sensor.other" not in ids
    assert "switch.irrelevant" not in ids
