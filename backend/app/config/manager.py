import yaml
from pathlib import Path
from typing import TypeVar, Type

from pydantic import BaseModel

from app.config.models import AppConfiguration, DashboardConfig
from app.settings import settings

T = TypeVar("T", bound=BaseModel)


class ConfigManager:
    def __init__(self, data_dir: Path | None = None):
        self.data_dir = data_dir or settings.data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self._app_config: AppConfiguration | None = None
        self._dashboard_config: DashboardConfig | None = None

    def _config_path(self) -> Path:
        return self.data_dir / "configuration.yaml"

    def _dashboard_path(self) -> Path:
        return self.data_dir / "dashboard.yaml"

    def _load_yaml(self, path: Path) -> dict:
        if not path.exists():
            return {}
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}

    def _save_yaml(self, path: Path, data: dict) -> None:
        with open(path, "w", encoding="utf-8") as f:
            yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

    def load_app_config(self) -> AppConfiguration:
        if self._app_config is None:
            data = self._load_yaml(self._config_path())
            self._app_config = AppConfiguration(**data)
        return self._app_config

    def save_app_config(self, config: AppConfiguration) -> None:
        self._app_config = config
        self._save_yaml(self._config_path(), config.model_dump())

    def load_dashboard(self) -> DashboardConfig:
        if self._dashboard_config is None:
            data = self._load_yaml(self._dashboard_path())
            self._dashboard_config = DashboardConfig(**data)
        return self._dashboard_config

    def save_dashboard(self, config: DashboardConfig) -> None:
        self._dashboard_config = config
        self._save_yaml(self._dashboard_path(), config.model_dump())

    def invalidate_cache(self) -> None:
        self._app_config = None
        self._dashboard_config = None

    def is_configured(self) -> bool:
        return self._config_path().exists()


config_manager = ConfigManager()
