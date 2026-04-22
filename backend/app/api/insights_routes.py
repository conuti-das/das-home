"""/api/insights — Home Operations Briefing endpoint.

Data flow
---------

    client ──GET /api/insights?override=...──▶ FastAPI router
                                                    │
                                                    ▼
                                      ┌─── check TTL cache ───┐
                                      │   (5 min, keyed on    │
                                      │    query-param tuple) │
                                      └───────────┬───────────┘
                                                  │ miss
                                                  ▼
                                      ┌─ _ensure_ha_connection ─┐
                                      │  via ws/proxy (shared   │
                                      │  HA WebSocket)          │
                                      └───────────┬─────────────┘
                                                  │
                      ┌───────────────────────────┼───────────────────────┐
                      ▼                           ▼                       ▼
               get_states             recorder/statistics_during_period  (per-entity,
              (HA WS cmd)             for today / 7d trend / YoY 7d)    retry on fail)
                      │                           │
                      └────────── discover_kpi_entities + overrides ─────┘
                                                  │
                                                  ▼
                                    compute_kpi_aggregates
                                                  │
                                                  ▼
                                      detect_anomalies (day-of-week)
                                                  │
                                                  ▼
                                       store cached payload + return

Error handling
--------------
- HA disconnected, no cache         -> 503
- HA disconnected, cache hit (stale)-> 200 + cache_age_seconds populated
- Per-entity failure                -> KPI marked available=False, reason=error
- No auto-discoverable entity       -> KPI marked available=False, reason=no_entity_found
- Entity found but empty stats      -> KPI marked available=False, reason=no_data

The shape of ``InsightsResponse`` is a public contract with the frontend;
see the Pydantic models below.
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from app.services.insights import (
    compute_kpi_aggregates,
    detect_anomalies,
    discover_kpi_entities,
    filter_monitored_entities,
)
from app.ws import proxy as ws_proxy

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

# ---------- Response schema ----------


class KPI(BaseModel):
    model_config = ConfigDict(extra="forbid")

    value: float | None
    unit: str
    available: bool
    entity_id: str | None = None
    trend_7d: list[float] = Field(default_factory=lambda: [0.0] * 7)
    yoy_7d: list[float] | None = None
    anomaly_flag: bool = False
    reason: str | None = None


class Anomaly(BaseModel):
    model_config = ConfigDict(extra="forbid")

    entity_id: str
    friendly_name: str
    description: str
    severity: str
    detected_at: str


class TrendPoint(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: str
    value: float
    yoy_value: float | None = None


class InsightsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    generated_at: str
    cache_age_seconds: int = 0
    kpis: dict[str, KPI]
    anomalies: list[Anomaly] = Field(default_factory=list)
    trends: dict[str, list[TrendPoint]] = Field(default_factory=dict)
    missing_kpis: list[str] = Field(default_factory=list)


# ---------- TTL cache ----------

_CACHE_TTL_SECONDS = 300  # 5 minutes
_cache: dict[tuple, tuple[float, InsightsResponse]] = {}


def _cache_key(
    energy_entity: str | None,
    occupancy_entity: str | None,
    uptime_entities: tuple[str, ...],
) -> tuple:
    return (energy_entity or "", occupancy_entity or "", uptime_entities)


def _cache_get(key: tuple) -> tuple[float, InsightsResponse] | None:
    """Return ``(age_seconds, payload)`` if the entry is still fresh."""
    entry = _cache.get(key)
    if entry is None:
        return None
    stored_at, payload = entry
    age = time.monotonic() - stored_at
    if age > _CACHE_TTL_SECONDS:
        return None
    return age, payload


def _cache_get_any_age(key: tuple) -> tuple[float, InsightsResponse] | None:
    """Return ``(age_seconds, payload)`` regardless of freshness.

    Used when HA is down and we need *any* cached payload to serve staleness.
    """
    entry = _cache.get(key)
    if entry is None:
        return None
    stored_at, payload = entry
    return time.monotonic() - stored_at, payload


def _cache_put(key: tuple, payload: InsightsResponse) -> None:
    _cache[key] = (time.monotonic(), payload)


def clear_cache() -> None:
    """Used by tests to reset state between runs."""
    _cache.clear()


# ---------- Statistics fetch helpers ----------

# HA's recorder/statistics_during_period returns one row per period. We use
# "day" granularity since KPIs roll up daily.
_PERIOD = "day"


async def _fetch_statistics(
    entity_ids: list[str],
    start: datetime,
    end: datetime,
) -> tuple[dict[str, list[dict]], bool]:
    """Call ``recorder/statistics_during_period`` and return per-entity rows.

    Returns
    -------
    ``(rows_by_entity, errored)`` — ``errored=True`` iff the HA call itself
    raised or returned ``success=false``. Individual entities with empty
    rows are *not* errors (they're just ``no_data``); they come back as
    ``[]`` in the dict.
    """
    if not entity_ids:
        return {}, False
    try:
        resp = await ws_proxy._ha_send(
            "recorder/statistics_during_period",
            start_time=start.isoformat(),
            end_time=end.isoformat(),
            statistic_ids=entity_ids,
            period=_PERIOD,
        )
    except Exception as exc:
        logger.warning("statistics fetch failed: %s", exc)
        return {eid: [] for eid in entity_ids}, True

    if not resp.get("success", True):
        logger.warning("HA statistics error: %s", resp.get("error"))
        return {eid: [] for eid in entity_ids}, True

    result = resp.get("result") or {}
    # HA returns {"entity_id": [rows]}
    return {eid: result.get(eid, []) for eid in entity_ids}, False


async def _fetch_states() -> list[dict]:
    """Return all HA states, or empty list on failure."""
    try:
        resp = await ws_proxy._ha_send("get_states")
    except Exception as exc:
        logger.warning("get_states failed: %s", exc)
        return []
    return resp.get("result") or []


# ---------- Endpoint ----------


@router.get("/insights", response_model=InsightsResponse)
async def get_insights(
    energy_entity: str | None = Query(default=None),
    occupancy_entity: str | None = Query(default=None),
    uptime_entities: str | None = Query(
        default=None,
        description="Comma-separated entity_ids for uptime KPI",
    ),
) -> InsightsResponse:
    """Return the Home Operations Briefing payload.

    See the module-level docstring for the full data flow.
    """
    uptime_list: tuple[str, ...] = tuple(
        e.strip() for e in (uptime_entities or "").split(",") if e.strip()
    )
    key = _cache_key(energy_entity, occupancy_entity, uptime_list)

    # Fresh cache hit — short-circuit.
    fresh = _cache_get(key)
    if fresh is not None:
        age, payload = fresh
        # Return a copy with the age stamped in at serve time.
        return payload.model_copy(update={"cache_age_seconds": int(age)})

    # Try to ensure an HA connection. If that fails, fall back to stale cache.
    try:
        await ws_proxy._ensure_ha_connection()
    except Exception as exc:
        logger.warning("HA connection unavailable: %s", exc)
        stale = _cache_get_any_age(key)
        if stale is None:
            raise HTTPException(
                status_code=503,
                detail="HA unavailable and no cached data",
            )
        age, payload = stale
        return payload.model_copy(update={"cache_age_seconds": int(age)})

    overrides = {
        "energy": energy_entity,
        "occupancy": occupancy_entity,
        "uptime_entities": list(uptime_list) if uptime_list else None,
    }

    states = await _fetch_states()
    if not states and ws_proxy._ha_connection is None:
        stale = _cache_get_any_age(key)
        if stale is None:
            raise HTTPException(
                status_code=503,
                detail="HA unavailable and no cached data",
            )
        age, payload = stale
        return payload.model_copy(update={"cache_age_seconds": int(age)})

    entity_map = discover_kpi_entities(states, overrides)

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    trend_start = today_start - timedelta(days=6)
    try:
        yoy_start = trend_start.replace(year=trend_start.year - 1)
        yoy_end = today_start.replace(year=today_start.year - 1)
        yoy_window_valid = True
    except ValueError:
        yoy_start = trend_start
        yoy_end = today_start
        yoy_window_valid = False

    # Collect every entity we need stats for.
    stat_ids = [
        e
        for e in (
            entity_map.get("energy"),
            entity_map.get("occupancy"),
            *(entity_map.get("uptime_entities") or []),
        )
        if e
    ]

    if stat_ids:
        stats_trend, trend_errored = await _fetch_statistics(stat_ids, trend_start, now)
        stats_today, today_errored = await _fetch_statistics(stat_ids, today_start, now)
    else:
        stats_trend, trend_errored = {}, False
        stats_today, today_errored = {}, False
    if stat_ids and yoy_window_valid:
        stats_yoy, _yoy_errored = await _fetch_statistics(stat_ids, yoy_start, yoy_end)
    else:
        stats_yoy = {}

    kpi_payload = compute_kpi_aggregates(
        entity_map,
        stats_today=stats_today,
        stats_trend=stats_trend,
        stats_yoy=stats_yoy,
        now=now,
    )

    # If the HA call itself errored out, differentiate "error" from "no_data":
    # KPIs with an entity_id should be marked reason="error" instead of no_data.
    if today_errored or trend_errored:
        for kpi in kpi_payload.values():
            if kpi.get("entity_id") and not kpi.get("available"):
                kpi["reason"] = "error"

    # ----- Anomalies -----
    monitored = filter_monitored_entities(states)
    # Anomaly detection needs ~5 weeks of history so we have several
    # same-weekday samples.
    anomaly_start = today_start - timedelta(days=35)
    if monitored:
        anomaly_stats, _anomaly_errored = await _fetch_statistics(
            [s["entity_id"] for s in monitored],
            anomaly_start,
            now,
        )
    else:
        anomaly_stats = {}
    anomalies = detect_anomalies(monitored, anomaly_stats, now=now)

    # Update anomaly_count KPI and anomaly_flag on any KPI whose entity appears
    # in the anomaly list.
    kpi_payload["anomaly_count"]["value"] = float(len(anomalies))
    anomalous_entities = {a["entity_id"] for a in anomalies}
    for kpi_name, kpi in kpi_payload.items():
        if kpi.get("entity_id") and kpi["entity_id"] in anomalous_entities:
            kpi["anomaly_flag"] = True

    # ----- Trends (energy_daily_7d) -----
    trend_points: list[TrendPoint] = []
    energy_kpi = kpi_payload.get("energy_cost_today", {})
    trend_values = energy_kpi.get("trend_7d") or [0.0] * 7
    yoy_values = energy_kpi.get("yoy_7d")
    for i in range(7):
        date = (trend_start + timedelta(days=i)).date().isoformat()
        trend_points.append(
            TrendPoint(
                date=date,
                value=trend_values[i] if i < len(trend_values) else 0.0,
                yoy_value=(yoy_values[i] if yoy_values and i < len(yoy_values) else None),
            )
        )

    missing = [name for name, kpi in kpi_payload.items() if not kpi["available"]]

    response = InsightsResponse(
        generated_at=now.isoformat(),
        cache_age_seconds=0,
        kpis={k: KPI(**v) for k, v in kpi_payload.items()},
        anomalies=[Anomaly(**a) for a in anomalies],
        trends={"energy_daily_7d": trend_points},
        missing_kpis=missing,
    )

    _cache_put(key, response)
    return response
