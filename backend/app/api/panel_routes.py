"""Register DAS Home as default panel in Home Assistant."""
import json
import logging
import os

import websockets
from fastapi import APIRouter, HTTPException

from app.config import config_manager
from app.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/panel")


async def _ha_ws_command(msg_type: str, **kwargs) -> dict:
    """Send a single WebSocket command to HA and return the response."""
    if settings.is_addon:
        ws_url = "ws://supervisor/core/websocket"
        token = settings.supervisor_token
    else:
        config = config_manager.load_app_config()
        url = config.connection.hass_url.rstrip("/")
        token = settings.hass_token
        ws_url = url.replace("http://", "ws://").replace("https://", "wss://") + "/api/websocket"

    if not token:
        raise HTTPException(status_code=400, detail="No HA token configured")

    ws = await websockets.connect(ws_url)
    try:
        auth_msg = json.loads(await ws.recv())
        if auth_msg.get("type") == "auth_required":
            await ws.send(json.dumps({"type": "auth", "access_token": token}))
            result = json.loads(await ws.recv())
            if result.get("type") != "auth_ok":
                raise HTTPException(status_code=401, detail="HA auth failed")

        msg_id = 1
        payload = {"id": msg_id, "type": msg_type, **kwargs}
        await ws.send(json.dumps(payload))

        while True:
            raw = await ws.recv()
            resp = json.loads(raw)
            if resp.get("id") == msg_id:
                return resp
    finally:
        await ws.close()


@router.get("/info")
async def get_panel_info():
    """Get the current ingress panel slug and URL."""
    if not settings.is_addon:
        return {"is_addon": False, "message": "Panel registration only available in add-on mode"}

    # Get the addon slug from the Supervisor
    addon_slug = os.environ.get("SUPERVISOR_ADDON", "local_das-home")
    ingress_panel = f"hassio_ingress"

    # Try to get panels list from HA
    try:
        resp = await _ha_ws_command("get_panels")
        panels = resp.get("result", {})
        # Find our ingress panel
        for panel_name, panel_data in panels.items():
            if "das-home" in str(panel_data.get("config", {}).get("addon", "")).lower() or \
               "das_home" in panel_name or "das-home" in panel_name:
                return {
                    "is_addon": True,
                    "panel_name": panel_name,
                    "panel_url": f"/{panel_name}",
                    "title": panel_data.get("title", "DAS Home"),
                }
        # Fallback: search by ingress pattern
        for panel_name, panel_data in panels.items():
            if panel_data.get("component_name") == "custom" and \
               "ingress" in str(panel_data.get("config", {})):
                if addon_slug in str(panel_data.get("config", {})):
                    return {
                        "is_addon": True,
                        "panel_name": panel_name,
                        "panel_url": f"/{panel_name}",
                    }
    except Exception as e:
        logger.warning("Failed to get panels: %s", e)

    return {"is_addon": True, "panel_name": None, "message": "Panel not found"}


@router.post("/set-default")
async def set_default_panel():
    """Set DAS Home as the default panel (start page) in HA."""
    if not settings.is_addon:
        raise HTTPException(status_code=400, detail="Only available in add-on mode")

    # Find our panel name first
    info = await get_panel_info()
    panel_name = info.get("panel_name")
    if not panel_name:
        raise HTTPException(status_code=404, detail="DAS Home panel not found in HA")

    try:
        # Set default panel via frontend/set_user_data
        resp = await _ha_ws_command(
            "frontend/set_user_data",
            key="core",
            value={"defaultPanel": panel_name},
        )
        if resp.get("success"):
            return {"status": "ok", "default_panel": panel_name}
        else:
            logger.warning("set_user_data response: %s", resp)
            return {"status": "partial", "message": "Command sent but may only apply to supervisor user", "panel_name": panel_name}
    except Exception as e:
        logger.error("Failed to set default panel: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
