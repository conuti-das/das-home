import os
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    hass_url: str = "http://homeassistant.local:8123"
    hass_token: str = ""
    data_dir: Path = Path("/app/data")
    port: int = 5050
    debug: bool = False

    @property
    def is_addon(self) -> bool:
        return "SUPERVISOR_TOKEN" in os.environ

    @property
    def supervisor_token(self) -> str:
        return os.environ.get("SUPERVISOR_TOKEN", "")

    class Config:
        env_prefix = "DAS_HOME_"


settings = Settings()
