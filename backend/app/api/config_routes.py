from fastapi import APIRouter
from app.config import config_manager
from app.config.models import AppConfiguration, DashboardConfig

router = APIRouter(prefix="/api")


@router.get("/config")
async def get_config():
    return config_manager.load_app_config().model_dump()


@router.put("/config")
async def put_config(config: AppConfiguration):
    config_manager.save_app_config(config)
    return {"status": "ok"}


@router.get("/dashboard")
async def get_dashboard():
    return config_manager.load_dashboard().model_dump()


@router.put("/dashboard")
async def put_dashboard(dashboard: DashboardConfig):
    config_manager.save_dashboard(dashboard)
    return {"status": "ok"}


@router.get("/auth/status")
async def get_auth_status():
    return {
        "configured": config_manager.is_configured(),
        "mode": "addon" if config_manager.load_app_config().connection.token_stored else "standalone",
    }
