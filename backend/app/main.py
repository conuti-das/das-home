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

# API routes
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0", "mode": "addon" if settings.is_addon else "standalone"}

app.include_router(config_router)

# Serve frontend static files (added after frontend build)
static_dir = Path(__file__).parent.parent.parent / "frontend" / "dist"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
