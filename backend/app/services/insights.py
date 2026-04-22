"""Insights service: KPI discovery, aggregation, and anomaly detection.

This module provides pure-Python helpers that compute the "Home Operations
Briefing" payload consumed by ``/api/insights``. Helpers take already-fetched
HA data (state dumps, statistics dicts) and return structured results — they
do not open WebSocket connections themselves. The route layer
(``app.api.insights_routes``) is responsible for I/O and wires these helpers
together.

Three concerns live here:

1. ``discover_kpi_entities`` — pick entity_ids by device_class from a state
   dump, honouring user overrides.
2. ``compute_kpi_aggregates`` — turn raw statistics into today / 7-day-trend /
   year-over-year numbers per KPI.
3. ``detect_anomalies`` — compare current accumulated value against last 4
   same-weekday samples; flag deviations > 50 % when there's enough history.

All three are deterministic, side-effect-free, and mock-friendly.
"""
from __future__ import annotations

import logging
import statistics
from datetime import datetime, timedelta, timezone
from typing import Iterable

logger = logging.getLogger(__name__)


# ---------- Entity discovery ----------

# device_class values that indicate energy consumption / cost
ENERGY_DEVICE_CLASSES = {"energy", "monetary"}
# device_class values that indicate occupancy / presence
OCCUPANCY_DEVICE_CLASSES = {"occupancy", "motion", "presence"}

# anomaly monitoring — which domains / classes to scan
ANOMALY_ENERGY_CLASSES = {"energy", "power"}
ANOMALY_BINARY_CLASSES = {"occupancy", "motion", "door", "window"}


def _attr(state: dict, key: str, default=None):
    return (state.get("attributes") or {}).get(key, default)


def discover_kpi_entities(
    states: list[dict],
    overrides: dict | None = None,
) -> dict:
    """Pick entity_ids for each KPI from a HA state dump.

    Selection rule (deterministic): walk states in the order HA returned them
    and take the first match per KPI. Overrides win unconditionally — a user
    can point a KPI at any entity, even one that doesn't match device_class.

    Parameters
    ----------
    states:
        List of state dicts as returned by the HA ``get_states`` command.
    overrides:
        Optional ``{"energy": str, "occupancy": str, "uptime_entities":
        list[str]}``. Any key present wins over auto-discovery; missing keys
        fall through.

    Returns
    -------
    dict with keys ``energy`` (str | None), ``occupancy`` (str | None),
    ``uptime_entities`` (list[str], may be empty).
    """
    overrides = overrides or {}
    result: dict = {"energy": None, "occupancy": None, "uptime_entities": []}

    # Apply overrides first (they short-circuit discovery for that KPI).
    if overrides.get("energy"):
        result["energy"] = overrides["energy"]
    if overrides.get("occupancy"):
        result["occupancy"] = overrides["occupancy"]
    if overrides.get("uptime_entities"):
        result["uptime_entities"] = list(overrides["uptime_entities"])

    # Auto-discover for any KPI that wasn't overridden.
    need_energy = result["energy"] is None
    need_occupancy = result["occupancy"] is None
    need_uptime = not result["uptime_entities"]

    uptime_candidates: list[str] = []

    for state in states:
        entity_id = state.get("entity_id", "")
        if not entity_id:
            continue

        device_class = _attr(state, "device_class")

        # Energy KPI — prefer an entity with unit containing "kWh" or a
        # device_class in the energy set.
        if need_energy and (
            device_class in ENERGY_DEVICE_CLASSES
            or "kwh" in (_attr(state, "unit_of_measurement") or "").lower()
        ):
            result["energy"] = entity_id
            need_energy = False

        # Occupancy KPI — first binary_sensor with an occupancy-ish class.
        if (
            need_occupancy
            and entity_id.startswith("binary_sensor.")
            and device_class in OCCUPANCY_DEVICE_CLASSES
        ):
            result["occupancy"] = entity_id
            need_occupancy = False

        # Uptime — collect switch/input_boolean/light entities. We grab all
        # matching and later cap the list.
        if need_uptime and entity_id.split(".")[0] in {
            "switch",
            "input_boolean",
            "light",
        }:
            uptime_candidates.append(entity_id)

    if need_uptime and uptime_candidates:
        # Deterministic: sort so repeated calls return the same list.
        result["uptime_entities"] = sorted(uptime_candidates)[:10]

    return result


# ---------- KPI aggregation ----------


def _daily_values(stats_rows: list[dict]) -> list[tuple[str, float]]:
    """Collapse HA ``statistics_during_period`` rows to (date, sum) pairs.

    HA can return multiple rows per day when period != "day"; we sum them up
    per UTC date. For rows that already carry a ``sum`` (cumulative totals),
    we take the diff between consecutive rows — otherwise the ``state`` /
    ``mean`` value, whichever is populated.
    """
    per_day: dict[str, float] = {}
    prev_sum: float | None = None
    for row in stats_rows:
        start = row.get("start")
        if not start:
            continue
        # start is ISO 8601 or epoch ms — handle both.
        if isinstance(start, (int, float)):
            dt = datetime.fromtimestamp(start / 1000, tz=timezone.utc)
        else:
            try:
                dt = datetime.fromisoformat(str(start).replace("Z", "+00:00"))
            except ValueError:
                continue
        date_key = dt.date().isoformat()

        if "sum" in row and row["sum"] is not None:
            current = float(row["sum"])
            delta = (current - prev_sum) if prev_sum is not None else current
            per_day[date_key] = per_day.get(date_key, 0.0) + max(delta, 0.0)
            prev_sum = current
        elif "state" in row and row["state"] is not None:
            per_day[date_key] = per_day.get(date_key, 0.0) + float(row["state"])
        elif "mean" in row and row["mean"] is not None:
            per_day[date_key] = per_day.get(date_key, 0.0) + float(row["mean"])

    return sorted(per_day.items())


def _fill_seven_days(
    pairs: list[tuple[str, float]],
    reference: datetime,
) -> tuple[list[str], list[float]]:
    """Return the last 7 calendar dates ending at ``reference`` with values.

    Missing dates get 0.0 as per the response schema contract.
    """
    lookup = dict(pairs)
    dates: list[str] = []
    values: list[float] = []
    # reference date inclusive, 6 days backward -> 7 total
    for i in range(6, -1, -1):
        d = (reference - timedelta(days=i)).date().isoformat()
        dates.append(d)
        values.append(lookup.get(d, 0.0))
    return dates, values


def compute_kpi_aggregates(
    entity_map: dict,
    stats_today: dict[str, list[dict]],
    stats_trend: dict[str, list[dict]],
    stats_yoy: dict[str, list[dict]] | None = None,
    *,
    now: datetime | None = None,
) -> dict:
    """Aggregate raw HA statistics rows into KPI payloads.

    Parameters
    ----------
    entity_map:
        Output of :func:`discover_kpi_entities`.
    stats_today:
        Mapping of ``entity_id -> rows`` for today's window.
    stats_trend:
        Mapping of ``entity_id -> rows`` for the last 7 days (per-day).
    stats_yoy:
        Mapping of ``entity_id -> rows`` for the same 7 days one year ago.
        May be ``None`` (new install / no history).
    now:
        Injected "now" for deterministic tests; defaults to UTC now.

    Returns
    -------
    Dict keyed by KPI name containing ``value``, ``unit``, ``available``,
    ``entity_id``, ``trend_7d``, ``yoy_7d``, ``anomaly_flag``, ``reason``.
    """
    now = now or datetime.now(timezone.utc)
    stats_yoy = stats_yoy or {}

    kpis: dict[str, dict] = {}

    # ----- Energy cost today -----
    energy_id = entity_map.get("energy")
    kpis["energy_cost_today"] = _build_kpi(
        entity_id=energy_id,
        unit="EUR",
        today_rows=stats_today.get(energy_id or "", []),
        trend_rows=stats_trend.get(energy_id or "", []),
        yoy_rows=stats_yoy.get(energy_id or "", []) if stats_yoy else [],
        now=now,
    )

    # ----- Occupancy hours today -----
    occ_id = entity_map.get("occupancy")
    kpis["occupancy_hours_today"] = _build_kpi(
        entity_id=occ_id,
        unit="h",
        today_rows=stats_today.get(occ_id or "", []),
        trend_rows=stats_trend.get(occ_id or "", []),
        yoy_rows=stats_yoy.get(occ_id or "", []) if stats_yoy else [],
        now=now,
    )

    # ----- Device uptime percentage -----
    uptime_entities = entity_map.get("uptime_entities") or []
    if not uptime_entities:
        kpis["device_uptime_pct"] = _empty_kpi(
            unit="%", reason="no_entity_found"
        )
    else:
        # Simple uptime: percentage of monitored entities currently present in
        # today's stats (i.e. reporting data). More fidelity requires
        # availability tracking we don't have today.
        reporting = sum(1 for e in uptime_entities if stats_today.get(e))
        pct = (reporting / len(uptime_entities)) * 100.0
        kpis["device_uptime_pct"] = {
            "value": round(pct, 1),
            "unit": "%",
            "available": True,
            "entity_id": None,
            "trend_7d": [pct] * 7,
            "yoy_7d": None,
            "anomaly_flag": False,
            "reason": None,
        }

    # ----- Anomaly count (populated after detect_anomalies is run) -----
    kpis["anomaly_count"] = {
        "value": 0.0,
        "unit": "count",
        "available": True,
        "entity_id": None,
        "trend_7d": [0.0] * 7,
        "yoy_7d": None,
        "anomaly_flag": False,
        "reason": None,
    }

    return kpis


def _empty_kpi(unit: str, reason: str) -> dict:
    return {
        "value": None,
        "unit": unit,
        "available": False,
        "entity_id": None,
        "trend_7d": [0.0] * 7,
        "yoy_7d": None,
        "anomaly_flag": False,
        "reason": reason,
    }


def _build_kpi(
    *,
    entity_id: str | None,
    unit: str,
    today_rows: list[dict],
    trend_rows: list[dict],
    yoy_rows: list[dict],
    now: datetime,
) -> dict:
    """Shared construction of a single KPI entry.

    Handles the four states: no entity found, no data, error-ish (empty
    today), happy path with optional YoY.
    """
    if not entity_id:
        return _empty_kpi(unit=unit, reason="no_entity_found")

    trend_pairs = _daily_values(trend_rows)
    _dates, trend_values = _fill_seven_days(trend_pairs, now)

    today_pairs = _daily_values(today_rows)
    today_value = today_pairs[-1][1] if today_pairs else None

    if today_value is None and not trend_pairs:
        return {
            "value": None,
            "unit": unit,
            "available": False,
            "entity_id": entity_id,
            "trend_7d": trend_values,
            "yoy_7d": None,
            "anomaly_flag": False,
            "reason": "no_data",
        }

    yoy_values: list[float] | None = None
    if yoy_rows:
        yoy_pairs = _daily_values(yoy_rows)
        ref_yoy = now.replace(year=now.year - 1) if now.year > 1 else now
        _dy, yoy_values = _fill_seven_days(yoy_pairs, ref_yoy)

    return {
        "value": round(float(today_value), 3) if today_value is not None else 0.0,
        "unit": unit,
        "available": True,
        "entity_id": entity_id,
        "trend_7d": [round(v, 3) for v in trend_values],
        "yoy_7d": [round(v, 3) for v in yoy_values] if yoy_values else None,
        "anomaly_flag": False,
        "reason": None,
    }


# ---------- Anomaly detection ----------


def detect_anomalies(
    monitored_entities: Iterable[dict],
    historical_stats: dict[str, list[dict]],
    *,
    now: datetime | None = None,
    deviation_threshold: float = 0.5,
    min_samples: int = 4,
) -> list[dict]:
    """Flag entities whose current accumulated value deviates > 50 % from
    the recent same-weekday baseline.

    Algorithm
    ---------
    For each monitored entity:

    1. Compute today's accumulated value (sum of today's stat rows).
    2. Look at the last 4 same-weekday samples (e.g. if today is Tuesday,
       the previous 4 Tuesdays). Skip if < ``min_samples`` samples.
    3. Compute the historical mean. If the mean is zero, skip (division
       guard).
    4. If ``|today - mean| / mean > deviation_threshold``, emit an anomaly.

    Parameters
    ----------
    monitored_entities:
        Iterable of state dicts for entities that should be checked (already
        filtered to relevant device_classes / domains).
    historical_stats:
        Mapping ``entity_id -> rows`` covering the last ~5 weeks.
    now:
        Injected "now" for deterministic tests.
    deviation_threshold:
        Fractional deviation that triggers an anomaly. 0.5 = 50 %.
    min_samples:
        Minimum number of same-weekday samples required before we'll flag.

    Returns
    -------
    List of ``{entity_id, friendly_name, description, severity, detected_at}``.
    Empty if nothing qualifies.
    """
    now = now or datetime.now(timezone.utc)
    anomalies: list[dict] = []
    today_date = now.date()
    today_weekday = today_date.weekday()

    for ent in monitored_entities:
        entity_id = ent.get("entity_id")
        if not entity_id:
            continue
        rows = historical_stats.get(entity_id) or []
        if not rows:
            continue

        per_day = dict(_daily_values(rows))

        # Separate today's accumulated value from historical same-weekday samples.
        today_value = per_day.get(today_date.isoformat(), 0.0)

        same_weekday_values: list[float] = []
        for date_str, val in per_day.items():
            try:
                d = datetime.fromisoformat(date_str).date()
            except ValueError:
                continue
            if d == today_date:
                continue
            if d.weekday() != today_weekday:
                continue
            same_weekday_values.append(val)

        # Take the most recent N samples.
        same_weekday_values = same_weekday_values[-min_samples * 2 :]

        if len(same_weekday_values) < min_samples:
            logger.debug(
                "Skipping anomaly check for %s: %d samples < %d required",
                entity_id,
                len(same_weekday_values),
                min_samples,
            )
            continue

        mean = statistics.fmean(same_weekday_values)
        if mean == 0:
            # Guard against divide-by-zero when the entity is always zero.
            continue

        deviation = abs(today_value - mean) / mean
        if deviation <= deviation_threshold:
            continue

        severity = _severity_for_deviation(deviation)
        weekday_name = today_date.strftime("%A")
        friendly_name = _attr(ent, "friendly_name") or entity_id
        if today_value > mean:
            description = (
                f"{friendly_name} ran {today_value:.1f} vs typical "
                f"{mean:.1f} on {weekday_name} ({deviation * 100:.0f}% higher)"
            )
        else:
            description = (
                f"{friendly_name} at {today_value:.1f} vs typical "
                f"{mean:.1f} on {weekday_name} ({deviation * 100:.0f}% lower)"
            )
        anomalies.append(
            {
                "entity_id": entity_id,
                "friendly_name": friendly_name,
                "description": description,
                "severity": severity,
                "detected_at": now.isoformat(),
            }
        )

    return anomalies


def _severity_for_deviation(deviation: float) -> str:
    if deviation >= 1.5:
        return "high"
    if deviation >= 1.0:
        return "medium"
    return "low"


def filter_monitored_entities(states: list[dict]) -> list[dict]:
    """Return the subset of states we check for anomalies.

    See the brief: climate domain, binary_sensor with occupancy / motion /
    door / window device_class, or any sensor with energy / power class.
    """
    monitored: list[dict] = []
    for s in states:
        entity_id = s.get("entity_id", "")
        if not entity_id:
            continue
        domain = entity_id.split(".")[0]
        if domain == "climate":
            monitored.append(s)
            continue
        device_class = _attr(s, "device_class")
        if domain == "binary_sensor" and device_class in ANOMALY_BINARY_CLASSES:
            monitored.append(s)
            continue
        if device_class in ANOMALY_ENERGY_CLASSES:
            monitored.append(s)
    return monitored
