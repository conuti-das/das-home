import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from app.settings import settings

__version__ = "0.1.3"
RELEASES_URL = "https://github.com/conuti-das/das-home/releases"

app = FastAPI(title="das-home", version=__version__)

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
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
