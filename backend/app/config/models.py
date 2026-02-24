from pydantic import BaseModel, Field


class ConnectionConfig(BaseModel):
    hass_url: str = "http://homeassistant.local:8123"
    token_stored: bool = False


class SidebarConfig(BaseModel):
    width: int = 280
    visible: bool = True
    show_clock: bool = True
    show_weather: bool = True
    weather_entity: str = "weather.home"


class HacsCardEntry(BaseModel):
    name: str
    url: str
    version: str = ""


class AppConfiguration(BaseModel):
    version: int = 1
    connection: ConnectionConfig = Field(default_factory=ConnectionConfig)
    locale: str = "de"
    custom_js_enabled: bool = False
    hacs_cards: list[HacsCardEntry] = Field(default_factory=list)
    sidebar: SidebarConfig = Field(default_factory=SidebarConfig)


class CardItem(BaseModel):
    id: str
    type: str
    entity: str = ""
    size: str = "1x1"
    config: dict = Field(default_factory=dict)


class SubSection(BaseModel):
    id: str
    title: str
    items: list[CardItem] = Field(default_factory=list)


class Section(BaseModel):
    id: str
    title: str
    icon: str = ""
    items: list[CardItem] = Field(default_factory=list)
    subsections: list[SubSection] = Field(default_factory=list)


class HeaderConfig(BaseModel):
    show_badges: bool = True
    badges: list[str] = Field(default_factory=lambda: ["lights", "temperature", "active_devices"])


class ViewConfig(BaseModel):
    id: str
    name: str
    icon: str = "mdi:home"
    type: str = "grid"
    area: str = ""
    header: HeaderConfig = Field(default_factory=HeaderConfig)
    layout: dict = Field(default_factory=lambda: {"columns": "auto", "min_column_width": 280})
    sections: list[Section] = Field(default_factory=list)


class DashboardConfig(BaseModel):
    version: int = 1
    theme: str = "sap_horizon_dark"
    accent_color: str = "#0070f3"
    auto_theme: bool = False
    sidebar_visible: bool = True
    default_view: str = "overview"
    views: list[ViewConfig] = Field(default_factory=list)
