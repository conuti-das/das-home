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


class _HaSession:
    """WebSocket session with per-connection message ID tracking."""

    def __init__(self, ws):
        self.ws = ws
        self._counter = 0

    async def command(self, msg_type: str, **kwargs) -> dict:
        self._counter += 1
        msg_id = self._counter
        payload = {"id": msg_id, "type": msg_type, **kwargs}
        await self.ws.send(json.dumps(payload))

        while True:
            raw = await self.ws.recv()
            resp = json.loads(raw)
            if resp.get("id") == msg_id:
                return resp

    async def close(self):
        await self.ws.close()


async def _connect_ha() -> _HaSession:
    """Connect to HA WebSocket, authenticate, and return a session."""
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
    return _HaSession(ws)


@router.get("")
async def discover():
    """Discover all HA entities, areas, devices, floors."""
    ha = await _connect_ha()
    try:
        states = (await ha.command("get_states")).get("result", [])
        areas = (await ha.command("config/area_registry/list")).get("result", [])
        devices = (await ha.command("config/device_registry/list")).get("result", [])
        entity_registry = (await ha.command("config/entity_registry/list")).get("result", [])

        try:
            floors = (await ha.command("config/floor_registry/list")).get("result", [])
        except Exception:
            floors = []

        # Build entity -> area mapping via device registry + entity registry
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

        return {
            "states": states,
            "areas": areas,
            "devices": devices,
            "entity_registry": entity_registry,
            "floors": floors,
            "entity_area_map": entity_area_map,
            "summary": {
                "entity_count": len(states),
                "area_count": len(areas),
                "device_count": len(devices),
                "floor_count": len(floors),
            },
        }
    finally:
        await ha.close()


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

# SAP UI5 icon names for domains (used in sidebar/sections)
DOMAIN_ICON_MAP = {
    "light": "lightbulb",
    "switch": "switch-classes",
    "input_boolean": "switch-classes",
    "sensor": "measurement-document",
    "binary_sensor": "status-positive",
    "climate": "temperature",
    "media_player": "media-play",
    "scene": "palette",
    "script": "process",
    "automation": "process",
    "cover": "screen",
    "fan": "weather-proofing",
    "lock": "locked",
    "vacuum": "inventory",
    "camera": "camera",
    "weather": "weather-proofing",
    "person": "person-placeholder",
    "alarm_control_panel": "alert",
    "humidifier": "blur",
    "number": "number-sign",
    "select": "dropdown",
    "button": "action",
    "update": "download",
    "timer": "fob-watch",
}


@router.post("/suggest")
async def suggest_dashboard():
    """Generate a dashboard config based on discovered entities."""
    ha = await _connect_ha()
    try:
        states = (await ha.command("get_states")).get("result", [])
        areas = (await ha.command("config/area_registry/list")).get("result", [])
        devices = (await ha.command("config/device_registry/list")).get("result", [])
        entity_registry = (await ha.command("config/entity_registry/list")).get("result", [])
    finally:
        await ha.close()

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

    # Auto-add weather card if weather entity found
    weather_items = []
    for state in states:
        if state["entity_id"].startswith("weather."):
            card_counter += 1
            weather_items.append(CardItem(
                id=f"c{card_counter}",
                type="weather",
                entity=state["entity_id"],
                size="2x1",
            ))
            break  # only first weather entity
    if weather_items:
        overview_sections.append(Section(
            id="overview_weather",
            title="Wetter",
            icon="weather-proofing",
            items=weather_items,
        ))

    # Auto-add radar card
    card_counter += 1
    overview_sections.append(Section(
        id="overview_radar",
        title="Radar",
        icon="map",
        items=[CardItem(
            id=f"c{card_counter}",
            type="radar",
            entity="",
            size="2x1",
        )],
    ))

    # Auto-add trash card if trash sensor found
    for state in states:
        if "abholung" in state["entity_id"] or "mullabfuhr" in state["entity_id"] or "trash" in state["entity_id"]:
            card_counter += 1
            overview_sections.append(Section(
                id="overview_trash",
                title="Müllabfuhr",
                icon="delete",
                items=[CardItem(
                    id=f"c{card_counter}",
                    type="trash",
                    entity=state["entity_id"],
                    size="1x1",
                )],
            ))
            break

    # Auto-add area cards for overview
    area_card_items = []
    for area in areas:
        card_counter += 1
        area_card_items.append(CardItem(
            id=f"c{card_counter}",
            type="area_small",
            entity="",
            size="1x1",
            config={"area_id": area["area_id"]},
        ))
    if area_card_items:
        overview_sections.append(Section(
            id="overview_areas",
            title="Bereiche",
            icon="building",
            items=area_card_items,
        ))

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
                icon=DOMAIN_ICON_MAP.get(domain, "card"),
                items=items[:8],  # limit to 8 per section in overview
            ))

    if overview_sections:
        views.append(ViewConfig(
            id="overview",
            name="Overview",
            icon="home",
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
                icon="building",
                type="object_page",
                area=area_id,
                sections=sections,
            ))

    dashboard = DashboardConfig(
        views=views,
        default_view="overview" if any(v.id == "overview" for v in views) else (views[0].id if views else ""),
    )

    return dashboard.model_dump()
