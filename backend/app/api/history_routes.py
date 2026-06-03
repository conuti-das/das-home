"""/api/history — short-term numeric entity history for card sparklines.

Calls HA's ``history/history_during_period`` over the shared WebSocket and
returns a compact ``{t, v}`` series. Cached per (entity_id, hours) for 5
minutes so a dashboard full of sensor cards does not hammer the recorder.
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from app.ws import proxy as ws_proxy

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

_CACHE_TTL_SECONDS = 300
_cache: dict[tuple, tuple[float, "HistoryResponse"]] = {}


class HistoryPoint(BaseModel):
    model_config = ConfigDict(extra="forbid")

    t: int  # unix seconds
    v: float


class HistoryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    entity_id: str
    points: list[HistoryPoint] = Field(default_factory=list)


def clear_cache() -> None:
    """Used by tests to reset state between runs."""
    _cache.clear()


def _parse_point(raw: dict) -> HistoryPoint | None:
    """Parse one minimal_response row into a point, or None if non-numeric.

    Rows look like ``{"s": "21.5", "lu": 1717325000.0}`` (state + last_updated).
    Non-numeric states (``unavailable``, ``unknown``, text) are dropped so the
    sparkline only ever plots real measurements.
    """
    state = raw.get("s")
    ts = raw.get("lu", raw.get("lc"))
    if state is None or ts is None:
        return None
    try:
        value = float(state)
        return HistoryPoint(t=int(float(ts)), v=value)
    except (TypeError, ValueError):
        return None


@router.get("/history", response_model=HistoryResponse)
async def get_history(
    entity_id: str = Query(..., min_length=1),
    hours: int = Query(default=24, ge=1, le=168),
) -> HistoryResponse:
    """Return up-to-``hours`` of numeric history for a single entity."""
    key = (entity_id, hours)
    entry = _cache.get(key)
    if entry is not None and time.monotonic() - entry[0] <= _CACHE_TTL_SECONDS:
        return entry[1]

    try:
        await ws_proxy._ensure_ha_connection()
    except Exception as exc:
        logger.warning("history: HA connection unavailable: %s", exc)
        raise HTTPException(status_code=503, detail="HA unavailable")

    now = datetime.now(timezone.utc)
    start = now - timedelta(hours=hours)
    try:
        resp = await ws_proxy._ha_send(
            "history/history_during_period",
            start_time=start.isoformat(),
            end_time=now.isoformat(),
            entity_ids=[entity_id],
            minimal_response=True,
            no_attributes=True,
        )
    except Exception as exc:
        logger.warning("history fetch failed for %s: %s", entity_id, exc)
        raise HTTPException(status_code=502, detail="history fetch failed")

    if not resp.get("success", True):
        logger.warning("HA history error for %s: %s", entity_id, resp.get("error"))
        raise HTTPException(status_code=502, detail="HA history error")

    result = resp.get("result") or {}
    rows = result.get(entity_id, []) if isinstance(result, dict) else []
    points = [
        p for p in (_parse_point(r) for r in rows if isinstance(r, dict)) if p is not None
    ]

    payload = HistoryResponse(entity_id=entity_id, points=points)
    _cache[key] = (time.monotonic(), payload)
    return payload
