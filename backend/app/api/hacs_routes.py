import json
import logging
from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.config import config_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/hacs")


async def _get_ha_base_url() -> str:
    config = config_manager.load_app_config()
    return config.connection.hass_url.rstrip("/")


async def _get_ha_token() -> str:
    from app.settings import settings
    if settings.is_addon:
        return settings.supervisor_token
    return settings.hass_token


@router.get("/scan")
async def scan_hacs_cards():
    """Scan HA for installed HACS frontend resources."""
    base_url = await _get_ha_base_url()
    token = await _get_ha_token()

    if not token:
        raise HTTPException(status_code=400, detail="No HA token configured")

    # Query HA for lovelace resources (which includes HACS cards)
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{base_url}/api/lovelace/resources",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0,
            )
            if resp.status_code == 200:
                resources = resp.json()
                cards = []
                for res in resources:
                    if res.get("type") == "module":
                        url = res.get("url", "")
                        cards.append({
                            "id": res.get("id"),
                            "url": url,
                            "type": "module",
                            "name": _extract_card_name(url),
                        })
                return {"cards": cards, "count": len(cards)}
            else:
                return {"cards": [], "count": 0, "error": f"HA returned {resp.status_code}"}
        except Exception as e:
            logger.error(f"HACS scan error: {e}")
            raise HTTPException(status_code=502, detail=str(e))


def _extract_card_name(url: str) -> str:
    """Extract a human-readable name from a HACS card URL."""
    # /hacsfiles/mushroom-cards/mushroom.js -> mushroom-cards
    parts = url.split("/")
    for i, part in enumerate(parts):
        if part in ("hacsfiles", "community", "www"):
            if i + 1 < len(parts):
                return parts[i + 1]
    return url.split("/")[-1].replace(".js", "")


@router.get("/proxy/{path:path}")
async def proxy_hacs_resource(path: str):
    """Proxy a HACS JS resource from HA."""
    base_url = await _get_ha_base_url()
    token = await _get_ha_token()

    if not token:
        raise HTTPException(status_code=400, detail="No HA token configured")

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{base_url}/{path}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=30.0,
            )
            content_type = resp.headers.get("content-type", "application/javascript")
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                media_type=content_type,
            )
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))
