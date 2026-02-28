import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

# Explicitly load .env from project root before Settings class is created
_env_file = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_file.exists():
    load_dotenv(_env_file, override=False)

# Addon mode: override defaults before Settings class reads env
_is_addon = bool(os.environ.get("SUPERVISOR_TOKEN"))
if _is_addon:
    os.environ.setdefault("DAS_HOME_HASS_URL", "http://supervisor/core")
    os.environ.setdefault("DAS_HOME_DATA_DIR", "/config/das-home")


class Settings(BaseSettings):
    hass_url: str = "http://homeassistant.local:8123"
    hass_token: str = ""
    data_dir: Path = Path("/app/data")
    port: int = 5050
    debug: bool = False

    @property
    def is_addon(self) -> bool:
        return _is_addon

    @property
    def supervisor_token(self) -> str:
        return os.environ.get("SUPERVISOR_TOKEN", "")

    model_config = ConfigDict(env_prefix="DAS_HOME_")


settings = Settings()
