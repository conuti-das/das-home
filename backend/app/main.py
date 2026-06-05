import os
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response
from pathlib import Path

import yaml

from app.settings import settings

def _read_version_from_config() -> str:
    """Read version from das-home/config.yaml (HA add-on manifest).

    Falls back to 'unknown' if the file can't be read — single source of truth
    is ``das-home/config.yaml`` per project release workflow.
    """
    repo_root = Path(__file__).resolve().parents[2]
    addon_config = repo_root / "das-home" / "config.yaml"
    try:
        with open(addon_config, encoding="utf-8") as f:
            cfg = yaml.safe_load(f) or {}
        return cfg.get("version", "unknown")
    except Exception:
        return "unknown"


__version__ = _read_version_from_config()
RELEASES_URL = "https://github.com/conuti-das/das-home/releases"

app = FastAPI(title="das-home", version=__version__)

# Allow embedding the das-home UI inside a Home Assistant "Webpage" dashboard
# (local HA + Nabu Casa remote). We deliberately use a CSP `frame-ancestors`
# directive instead of `X-Frame-Options` — the latter would block the iframe
# embedding that lets das-home be used as a default HA dashboard/start page.
_FRAME_ANCESTORS = (
    "frame-ancestors 'self' "
    "https://*.home-assistant.io "
    "https://*.ui.nabu.casa "
    "http://homeassistant.local:8123"
)


@app.middleware("http")
async def add_frame_embedding_headers(request: Request, call_next) -> Response:
    """Set a permissive ``frame-ancestors`` CSP on every response.

    Runs around the route/static handlers (registered before CORSMiddleware so
    CORS stays the outermost layer). Stamps the header on every response —
    including static files and ``serve_index`` — without setting
    ``X-Frame-Options``, which would prevent iframe embedding in HA.
    """
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = _FRAME_ANCESTORS
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else [],
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.config_routes import router as config_router
from app.api.discovery_routes import router as discovery_router
from app.api.hacs_routes import router as hacs_router
from app.api.media_routes import router as media_router, geo_router
from app.api.calendar_routes import router as calendar_router
from app.api.panel_routes import router as panel_router
from app.api.insights_routes import router as insights_router
from app.api.history_routes import router as history_router
from app.ws.proxy import router as ws_router

# API routes
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "version": __version__,
        "mode": "addon" if settings.is_addon else "standalone",
        "releases_url": RELEASES_URL,
    }

app.include_router(config_router)
app.include_router(discovery_router)
app.include_router(hacs_router)
app.include_router(media_router)
app.include_router(geo_router)
app.include_router(calendar_router)
app.include_router(panel_router)
app.include_router(insights_router)
app.include_router(history_router)
app.include_router(ws_router)

# Serve frontend static files (added after frontend build)
# Check multiple candidate paths: env override, Docker layout, dev layout
_static_candidates = [
    os.environ.get("DAS_HOME_STATIC_DIR", ""),           # explicit override
    str(Path(__file__).parent.parent / "frontend" / "dist"),  # Docker: /app/frontend/dist
    str(Path(__file__).parent.parent.parent / "frontend" / "dist"),  # Dev: ../../frontend/dist
]
static_dir = None
for _candidate in _static_candidates:
    if _candidate and Path(_candidate).is_dir():
        static_dir = Path(_candidate)
        break

if static_dir:
    _index_html = static_dir / "index.html"

    # Serve index.html with no-cache headers so HA Ingress always gets fresh content
    @app.get("/", response_class=HTMLResponse)
    async def serve_index(request: Request):
        content = _index_html.read_text(encoding="utf-8")
        return HTMLResponse(
            content=content,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )

    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
