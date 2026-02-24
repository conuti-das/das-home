import asyncio
import json
import logging

import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.ws.manager import ws_manager
from app.config import config_manager

logger = logging.getLogger(__name__)
router = APIRouter()

_ha_connection = None
_ha_listen_task = None
_subscribed = False


async def _get_ha_url() -> str:
    config = config_manager.load_app_config()
    url = config.connection.hass_url.rstrip("/")
    return url.replace("http://", "ws://").replace("https://", "wss://") + "/api/websocket"


async def _get_ha_token() -> str:
    from app.settings import settings
    if settings.is_addon:
        return settings.supervisor_token
    return settings.hass_token


async def _ensure_ha_connection():
    global _ha_connection, _ha_listen_task, _subscribed

    if _ha_connection is not None:
        try:
            await _ha_connection.ping()
            return
        except Exception:
            _ha_connection = None
            _subscribed = False

    ha_url = await _get_ha_url()
    token = await _get_ha_token()

    _ha_connection = await websockets.connect(ha_url)

    # Wait for auth_required
    auth_msg = json.loads(await _ha_connection.recv())
    if auth_msg.get("type") == "auth_required":
        await _ha_connection.send(json.dumps({"type": "auth", "access_token": token}))
        result = json.loads(await _ha_connection.recv())
        if result.get("type") != "auth_ok":
            raise ConnectionError(f"HA auth failed: {result}")

    logger.info("Connected to Home Assistant WebSocket")

    # Subscribe to state changes
    if not _subscribed:
        msg_id = ws_manager.next_id()
        await _ha_connection.send(json.dumps({
            "id": msg_id,
            "type": "subscribe_events",
            "event_type": "state_changed",
        }))
        _subscribed = True

    # Start listener if not running
    if _ha_listen_task is None or _ha_listen_task.done():
        _ha_listen_task = asyncio.create_task(_listen_ha())


async def _listen_ha():
    global _ha_connection, _subscribed
    try:
        async for raw in _ha_connection:
            msg = json.loads(raw)
            if msg.get("type") == "event":
                event_data = msg.get("event", {})
                if event_data.get("event_type") == "state_changed":
                    data = event_data.get("data", {})
                    await ws_manager.broadcast({
                        "type": "state_changed",
                        "entity_id": data.get("entity_id"),
                        "new_state": data.get("new_state"),
                        "old_state": data.get("old_state"),
                    })
    except Exception as e:
        logger.error(f"HA WebSocket listener error: {e}")
        _ha_connection = None
        _subscribed = False


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws_manager.connect_client(ws)
    try:
        await _ensure_ha_connection()
        # Send initial connection status
        await ws.send_json({"type": "connected", "ha_connected": _ha_connection is not None})

        while True:
            data = await ws.receive_json()
            msg_type = data.get("type")

            if msg_type == "call_service":
                if _ha_connection:
                    msg_id = ws_manager.next_id()
                    await _ha_connection.send(json.dumps({
                        "id": msg_id,
                        "type": "call_service",
                        "domain": data.get("domain"),
                        "service": data.get("service"),
                        "service_data": data.get("data", {}),
                        "target": data.get("target", {}),
                    }))

            elif msg_type == "get_states":
                if _ha_connection:
                    msg_id = ws_manager.next_id()
                    await _ha_connection.send(json.dumps({
                        "id": msg_id,
                        "type": "get_states",
                    }))
                    # Wait for response and forward
                    resp = json.loads(await _ha_connection.recv())
                    await ws.send_json({"type": "states_result", "result": resp.get("result", [])})

            elif msg_type == "ping":
                await ws.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Client WS error: {e}")
    finally:
        ws_manager.disconnect_client(ws)
