from fastapi import APIRouter
from app.config import config_manager
from app.config.models import AppConfiguration, DashboardConfig

router = APIRouter(prefix="/api")


def _fix_encoding(text: str) -> str:
    """Fix triple-encoded UTF-8 strings (e.g. 'BÃƒÂ¼ro' -> 'Büro')."""
    if not text:
        return text
    fixed = text
    for _ in range(3):
        try:
            fixed = fixed.encode("cp1252").decode("utf-8")
        except (UnicodeDecodeError, UnicodeEncodeError):
            break
    return fixed


def _sanitize_dashboard(dashboard: DashboardConfig) -> DashboardConfig:
    """Fix encoding issues in dashboard view names."""
    changed = False
    for view in dashboard.views:
        fixed = _fix_encoding(view.name)
        if fixed != view.name:
            view.name = fixed
            changed = True
    if changed:
        config_manager.save_dashboard(dashboard)
    return dashboard


@router.get("/config")
async def get_config():
    return config_manager.load_app_config().model_dump()


@router.put("/config")
async def put_config(config: AppConfiguration):
    config_manager.save_app_config(config)
    return {"status": "ok"}


@router.get("/dashboard")
async def get_dashboard():
    dashboard = config_manager.load_dashboard()
    dashboard = _sanitize_dashboard(dashboard)
    return dashboard.model_dump()


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
