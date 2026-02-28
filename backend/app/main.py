from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from app.settings import settings

app = FastAPI(title="das-home", version="0.1.0")

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
    return {"status": "ok", "version": "0.1.0", "mode": "addon" if settings.is_addon else "standalone"}

app.include_router(config_router)
app.include_router(discovery_router)
app.include_router(hacs_router)
app.include_router(media_router)
app.include_router(geo_router)
app.include_router(ws_router)

# Serve frontend static files (added after frontend build)
static_dir = Path(__file__).parent.parent.parent / "frontend" / "dist"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
