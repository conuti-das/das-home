import json
import logging

import websockets
from fastapi import APIRouter, HTTPException

from app.config import config_manager
from app.config.models import (
    DashboardConfig, ViewConfig, Section, CardItem, HeaderConfig
)
from app.settings import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/discovery")


async def _connect_ha():
    """Connect to HA WebSocket and authenticate."""
    config = config_manager.load_app_config()
    url = config.connection.hass_url.rstrip("/")
    ws_url = url.replace("http://", "ws://").replace("https://", "wss://") + "/api/websocket"

    token = settings.supervisor_token if settings.is_addon else settings.hass_token
    if not token:
        raise HTTPException(status_code=400, detail="No HA token configured")

    ws = await websockets.connect(ws_url)
    auth_msg = json.loads(await ws.recv())
    if auth_msg.get("type") == "auth_required":
        await ws.send(json.dumps({"type": "auth", "access_token": token}))
        result = json.loads(await ws.recv())
        if result.get("type") != "auth_ok":
            await ws.close()
            raise HTTPException(status_code=401, detail="HA authentication failed")
    return ws


async def _ha_command(ws, msg_type: str, **kwargs) -> dict:
    """Send a command and wait for the response."""
    import asyncio
    msg_id = id(asyncio.current_task()) % 100000
    payload = {"id": msg_id, "type": msg_type, **kwargs}
    await ws.send(json.dumps(payload))

    while True:
        raw = await ws.recv()
        resp = json.loads(raw)
        if resp.get("id") == msg_id:
            return resp


@router.get("")
async def discover():
    """Discover all HA entities, areas, devices, floors."""
    ws = await _connect_ha()
    try:
        # Fetch states
        states_resp = await _ha_command(ws, "get_states")
        states = states_resp.get("result", [])

        # Fetch area registry
        areas_resp = await _ha_command(ws, "config/area_registry/list")
        areas = areas_resp.get("result", [])

        # Fetch device registry
        devices_resp = await _ha_command(ws, "config/device_registry/list")
        devices = devices_resp.get("result", [])

        # Fetch entity registry
        entities_resp = await _ha_command(ws, "config/entity_registry/list")
        entity_registry = entities_resp.get("result", [])

        # Fetch floor registry
        try:
            floors_resp = await _ha_command(ws, "config/floor_registry/list")
            floors = floors_resp.get("result", [])
        except Exception:
            floors = []

        return {
            "states": states,
            "areas": areas,
            "devices": devices,
            "entity_registry": entity_registry,
            "floors": floors,
            "summary": {
                "entity_count": len(states),
                "area_count": len(areas),
                "device_count": len(devices),
                "floor_count": len(floors),
            },
        }
    finally:
        await ws.close()


# Card type mapping by domain
DOMAIN_CARD_MAP = {
    "light": "light",
    "switch": "switch",
    "input_boolean": "switch",
    "sensor": "sensor",
    "binary_sensor": "binary_sensor",
    "climate": "climate",
    "media_player": "media_player",
    "scene": "scene",
    "script": "script",
    "automation": "automation",
    "cover": "cover",
    "fan": "fan",
    "lock": "lock",
    "vacuum": "vacuum",
    "camera": "camera",
    "weather": "weather",
    "person": "person",
    "alarm_control_panel": "alarm",
    "humidifier": "humidifier",
    "number": "number",
    "select": "select",
    "button": "button",
    "update": "update",
    "timer": "timer",
}


@router.post("/suggest")
async def suggest_dashboard():
    """Generate a dashboard config based on discovered entities."""
    ws = await _connect_ha()
    try:
        states_resp = await _ha_command(ws, "get_states")
        states = states_resp.get("result", [])

        areas_resp = await _ha_command(ws, "config/area_registry/list")
        areas = areas_resp.get("result", [])

        devices_resp = await _ha_command(ws, "config/device_registry/list")
        devices = devices_resp.get("result", [])

        entities_resp = await _ha_command(ws, "config/entity_registry/list")
        entity_registry = entities_resp.get("result", [])
    finally:
        await ws.close()

    # Build entity -> area mapping via device registry
    device_area_map = {}
    for dev in devices:
        if dev.get("area_id"):
            device_area_map[dev.get("id")] = dev["area_id"]

    entity_area_map = {}
    for ent in entity_registry:
        area = ent.get("area_id")
        if not area and ent.get("device_id"):
            area = device_area_map.get(ent["device_id"])
        if area:
            entity_area_map[ent.get("entity_id", "")] = area

    # Build area name map
    area_name_map = {a["area_id"]: a["name"] for a in areas}

    # Group entities by area and domain
    area_entities: dict[str, dict[str, list]] = {}
    unassigned: dict[str, list] = {}

    for state in states:
        entity_id = state["entity_id"]
        domain = entity_id.split(".")[0]

        if domain not in DOMAIN_CARD_MAP:
            continue

        area_id = entity_area_map.get(entity_id)
        if area_id:
            area_entities.setdefault(area_id, {}).setdefault(domain, []).append(state)
        else:
            unassigned.setdefault(domain, []).append(state)

    views: list[ViewConfig] = []
    card_counter = 0

    # Overview view
    overview_sections = []
    for domain in ["light", "climate", "media_player", "sensor"]:
        items = []
        for state in states:
            if state["entity_id"].startswith(f"{domain}.") and domain in DOMAIN_CARD_MAP:
                card_counter += 1
                items.append(CardItem(
                    id=f"c{card_counter}",
                    type=DOMAIN_CARD_MAP[domain],
                    entity=state["entity_id"],
                    size="1x1",
                ))
        if items:
            overview_sections.append(Section(
                id=f"overview_{domain}",
                title=domain.replace("_", " ").title(),
                icon=f"mdi:{domain}",
                items=items[:8],  # limit to 8 per section in overview
            ))

    if overview_sections:
        views.append(ViewConfig(
            id="overview",
            name="Overview",
            icon="mdi:home",
            type="grid",
            header=HeaderConfig(show_badges=True, badges=["lights", "temperature"]),
            sections=overview_sections,
        ))

    # Per-area views
    for area_id, domains in area_entities.items():
        area_name = area_name_map.get(area_id, area_id)
        sections = []
        for domain, entities in domains.items():
            items = []
            for state in entities:
                card_counter += 1
                items.append(CardItem(
                    id=f"c{card_counter}",
                    type=DOMAIN_CARD_MAP.get(domain, "sensor"),
                    entity=state["entity_id"],
                    size="1x1",
                ))
            if items:
                sections.append(Section(
                    id=f"{area_id}_{domain}",
                    title=domain.replace("_", " ").title(),
                    items=items,
                ))

        if sections:
            views.append(ViewConfig(
                id=area_id,
                name=area_name,
                icon="mdi:home-floor-1",
                type="object_page",
                area=area_id,
                sections=sections,
            ))

    dashboard = DashboardConfig(
        views=views,
        default_view="overview" if any(v.id == "overview" for v in views) else (views[0].id if views else ""),
    )

    return dashboard.model_dump()
