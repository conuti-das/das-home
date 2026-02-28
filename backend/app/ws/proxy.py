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
_connect_lock: asyncio.Lock | None = None
_pending: dict[int, asyncio.Future] = {}
_msg_counter = 0


def _get_lock() -> asyncio.Lock:
    global _connect_lock
    if _connect_lock is None:
        _connect_lock = asyncio.Lock()
    return _connect_lock


def _next_id() -> int:
    global _msg_counter
    _msg_counter += 1
    return _msg_counter


async def _get_ha_url() -> str:
    from app.settings import settings
    if settings.is_addon:
        url = settings.hass_url.rstrip("/")
    else:
        config = config_manager.load_app_config()
        url = config.connection.hass_url.rstrip("/")
    return url.replace("http://", "ws://").replace("https://", "wss://") + "/api/websocket"


async def _get_ha_token() -> str:
    from app.settings import settings
    if settings.is_addon:
        return settings.supervisor_token
    return settings.hass_token


async def _ha_send(msg_type: str, **kwargs) -> dict:
    """Send a command to HA and wait for its response via the listener."""
    if _ha_connection is None:
        raise ConnectionError("Not connected to HA")

    msg_id = _next_id()
    fut = asyncio.get_event_loop().create_future()
    _pending[msg_id] = fut

    payload = {"id": msg_id, "type": msg_type, **kwargs}
    await _ha_connection.send(json.dumps(payload))

    try:
        return await asyncio.wait_for(fut, timeout=30.0)
    finally:
        _pending.pop(msg_id, None)


async def _ensure_ha_connection():
    global _ha_connection, _ha_listen_task, _subscribed

    async with _get_lock():
        if _ha_connection is not None:
            try:
                await _ha_connection.ping()
                return
            except Exception:
                _ha_connection = None
                _subscribed = False

        ha_url = await _get_ha_url()
        token = await _get_ha_token()

        ws = await websockets.connect(ha_url)

        auth_msg = json.loads(await ws.recv())
        if auth_msg.get("type") == "auth_required":
            await ws.send(json.dumps({"type": "auth", "access_token": token}))
            result = json.loads(await ws.recv())
            if result.get("type") != "auth_ok":
                await ws.close()
                raise ConnectionError(f"HA auth failed: {result}")

        _ha_connection = ws
        logger.info("Connected to Home Assistant WebSocket")

        # Start single listener BEFORE subscribing so responses are captured
        if _ha_listen_task is None or _ha_listen_task.done():
            _ha_listen_task = asyncio.create_task(_listen_ha())

        # Subscribe to state changes
        if not _subscribed:
            await _ha_send("subscribe_events", event_type="state_changed")
            _subscribed = True


async def _listen_ha():
    """Single reader for the HA websocket. Routes responses to pending futures
    and broadcasts state_changed events to all clients."""
    global _ha_connection, _subscribed
    try:
        async for raw in _ha_connection:
            msg = json.loads(raw)
            msg_id = msg.get("id")

            # Resolve pending request-response futures
            if msg_id and msg_id in _pending:
                _pending[msg_id].set_result(msg)
                continue

            # Broadcast state change events
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
    finally:
        _ha_connection = None
        _subscribed = False
        for fut in _pending.values():
            if not fut.done():
                fut.cancel()
        _pending.clear()


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws_manager.connect_client(ws)
    try:
        await _ensure_ha_connection()
        await ws.send_json({"type": "connected", "ha_connected": _ha_connection is not None})

        while True:
            data = await ws.receive_json()
            msg_type = data.get("type")

            if msg_type == "call_service":
                if _ha_connection:
                    try:
                        await _ha_send(
                            "call_service",
                            domain=data.get("domain"),
                            service=data.get("service"),
                            service_data=data.get("data", {}),
                            target=data.get("target", {}),
                        )
                    except Exception as e:
                        logger.warning(f"call_service failed: {e}")

            elif msg_type == "get_states":
                if _ha_connection:
                    try:
                        resp = await _ha_send("get_states")
                        await ws.send_json({
                            "type": "states_result",
                            "result": resp.get("result", []),
                        })
                    except Exception as e:
                        logger.warning(f"get_states failed: {e}")
                        await ws.send_json({"type": "states_result", "result": []})

            elif msg_type == "ping":
                await ws.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Client WS error: {e}")
    finally:
        ws_manager.disconnect_client(ws)
