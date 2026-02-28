import logging

import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from app.config import config_manager
from app.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/media")

# Separate router for geo endpoints (included by main.py via same module)
geo_router = APIRouter(prefix="/api/geo")


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


@router.get("/artwork")
async def get_artwork(entity_id: str = Query(..., description="Media player entity ID")):
    """Proxy artwork image from HA for a media_player entity."""
    base_url, token = _get_ha_auth()
    if not token:
        raise HTTPException(status_code=400, detail="No HA token configured")

    # First get the entity state to find entity_picture URL
    async with httpx.AsyncClient() as client:
        try:
            state_resp = await client.get(
                f"{base_url}/api/states/{entity_id}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0,
            )
            if state_resp.status_code != 200:
                raise HTTPException(status_code=state_resp.status_code, detail="Entity not found")

            state_data = state_resp.json()
            entity_picture = state_data.get("attributes", {}).get("entity_picture")
            if not entity_picture:
                raise HTTPException(status_code=404, detail="No artwork available")

            # Fetch the actual image from HA
            image_url = f"{base_url}{entity_picture}" if entity_picture.startswith("/") else entity_picture
            img_resp = await client.get(
                image_url,
                headers={"Authorization": f"Bearer {token}"},
                timeout=15.0,
                follow_redirects=True,
            )
            if img_resp.status_code != 200:
                raise HTTPException(status_code=img_resp.status_code, detail="Failed to fetch artwork")

            content_type = img_resp.headers.get("content-type", "image/jpeg")
            return Response(
                content=img_resp.content,
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=300",
                },
            )
        except httpx.HTTPError as e:
            logger.error(f"Artwork proxy error: {e}")
            raise HTTPException(status_code=502, detail=str(e))


@router.get("/browse")
async def browse_media(
    entity_id: str = Query(..., description="Media player entity ID"),
    media_content_id: str = Query("", description="Media content ID to browse into"),
    media_content_type: str = Query("", description="Media content type"),
):
    """Browse media for a media_player entity via HA WebSocket API."""
    base_url, token = _get_ha_auth()
    if not token:
        raise HTTPException(status_code=400, detail="No HA token configured")

    import asyncio
    import websockets
    import json

    ws_url = base_url.replace("http://", "ws://").replace("https://", "wss://") + "/api/websocket"

    try:
        async with websockets.connect(ws_url) as ws:
            # Wait for auth_required
            msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=5))

            # Authenticate
            await ws.send(json.dumps({"type": "auth", "access_token": token}))
            msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=5))
            if msg.get("type") != "auth_ok":
                raise HTTPException(status_code=401, detail="HA auth failed")

            # Browse media
            browse_msg = {
                "id": 1,
                "type": "media_player/browse_media",
                "entity_id": entity_id,
            }
            if media_content_type:
                browse_msg["media_content_id"] = media_content_id
                browse_msg["media_content_type"] = media_content_type
            elif media_content_id:
                browse_msg["media_content_id"] = media_content_id

            await ws.send(json.dumps(browse_msg))
            result = json.loads(await asyncio.wait_for(ws.recv(), timeout=10))

            if not result.get("success"):
                error = result.get("error", {})
                raise HTTPException(status_code=400, detail=error.get("message", "Browse failed"))

            return result.get("result", {})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Media browse error: {e}")
        raise HTTPException(status_code=502, detail=str(e))


@geo_router.get("/reverse")
async def reverse_geocode(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    """Reverse geocode coordinates via Nominatim with caching."""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "lat": lat,
                    "lon": lon,
                    "format": "json",
                    "addressdetails": 1,
                    "zoom": 18,
                },
                headers={"User-Agent": "das-home/1.0"},
                timeout=10.0,
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Geocoding failed")

            data = resp.json()
            address = data.get("address", {})
            return {
                "display_name": data.get("display_name", ""),
                "road": address.get("road", ""),
                "house_number": address.get("house_number", ""),
                "city": address.get("city", ""),
                "town": address.get("town", ""),
                "village": address.get("village", ""),
                "postcode": address.get("postcode", ""),
                "country": address.get("country", ""),
            }
        except httpx.HTTPError as e:
            logger.error(f"Geocoding error: {e}")
            raise HTTPException(status_code=502, detail=str(e))
