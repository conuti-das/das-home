import asyncio
import json
import logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.clients: list[WebSocket] = []
        self._ha_ws = None
        self._ha_task: asyncio.Task | None = None
        self._msg_id = 0

    async def connect_client(self, ws: WebSocket):
        await ws.accept()
        self.clients.append(ws)
        logger.info(f"Client connected. Total: {len(self.clients)}")

    def disconnect_client(self, ws: WebSocket):
        if ws in self.clients:
            self.clients.remove(ws)
        logger.info(f"Client disconnected. Total: {len(self.clients)}")

    async def broadcast(self, message: dict):
        data = json.dumps(message)
        disconnected = []
        for client in self.clients:
            try:
                await client.send_text(data)
            except Exception:
                disconnected.append(client)
        for client in disconnected:
            self.disconnect_client(client)

    def next_id(self) -> int:
        self._msg_id += 1
        return self._msg_id


ws_manager = ConnectionManager()
