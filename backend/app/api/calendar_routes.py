import logging
import socket
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.config import config_manager
from app.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/calendar")


def _get_ha_auth() -> tuple[str, str]:
    """Return (base_url, token) for HA API access."""
    if settings.is_addon:
        base_url = settings.hass_url.rstrip("/")
        token = settings.supervisor_token
    else:
        config = config_manager.load_app_config()
        base_url = config.connection.hass_url.rstrip("/")
        token = settings.hass_token
    return base_url, token


def _resolve_base_url(base_url: str) -> str:
    """Resolve hostname to a reachable IP, preferring global IPv6 over link-local."""
    parsed = urlparse(base_url)
    host = parsed.hostname
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    if not host:
        return base_url
    try:
        results = socket.getaddrinfo(host, port, socket.AF_UNSPEC, socket.SOCK_STREAM)
        # Prefer global IPv6 (not link-local fe80::), then IPv4
        for family, _, _, _, addr in results:
            if family == socket.AF_INET6 and not addr[0].startswith("fe80"):
                return f"{parsed.scheme}://[{addr[0]}]:{addr[1]}"
        # Fallback to first result
        for family, _, _, _, addr in results:
            if family == socket.AF_INET:
                return f"{parsed.scheme}://{addr[0]}:{addr[1]}"
    except socket.gaierror:
        pass
    return base_url


@router.get("/events/{entity_id}")
async def get_calendar_events(
    entity_id: str,
    start: str = Query(..., description="ISO 8601 start datetime"),
    end: str = Query(..., description="ISO 8601 end datetime"),
):
    """Fetch calendar events from HA REST API."""
    base_url, token = _get_ha_auth()
    if not token:
        raise HTTPException(status_code=400, detail="No HA token configured")

    resolved_url = _resolve_base_url(base_url)
    logger.debug("Calendar API: resolved %s -> %s", base_url, resolved_url)

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{resolved_url}/api/calendars/{entity_id}",
                params={"start": start, "end": end},
                headers={
                    "Authorization": f"Bearer {token}",
                    "Host": urlparse(base_url).hostname or "",
                },
                timeout=10.0,
            )
            if resp.status_code != 200:
                logger.warning("HA calendar API returned %s for %s", resp.status_code, entity_id)
                raise HTTPException(status_code=resp.status_code, detail="HA calendar API failed")
            return resp.json()
        except httpx.HTTPError as e:
            logger.error("Failed to fetch calendar events: %s", e)
            raise HTTPException(status_code=502, detail=str(e))
