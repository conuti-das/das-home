# das-home Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a SAP UI5 based Home Assistant dashboard with auto-discovery, wizard-driven config, and HACS custom card support.

**Architecture:** Monolithic FastAPI server serving a React/UI5 frontend. Backend handles HA WebSocket proxy, config persistence (YAML), and discovery. Frontend uses Zustand stores, UI5 Web Components, and a Web Component Bridge for HACS cards.

**Tech Stack:** Python 3.11+/FastAPI, React 18+/TypeScript, @ui5/webcomponents-react, Zustand, home-assistant-js-websocket, Vite, Docker

**Reference:** See `docs/plans/2026-02-24-das-home-design.md` for full design.

---

## Phase 1: Project Scaffolding & Backend Foundation

> Goal: FastAPI server running, serving a placeholder React app, with config persistence working.

---

### Task 1: Initialize Backend Project

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/settings.py`
- Create: `backend/requirements.txt`
- Create: `backend/pyproject.toml`

**Step 1: Create backend directory structure and requirements**

`backend/requirements.txt`:
```
fastapi==0.115.6
uvicorn[standard]==0.34.0
pyyaml==6.0.2
cryptography==44.0.0
websockets==14.1
httpx==0.28.1
pydantic==2.10.4
pydantic-settings==2.7.1
```

`backend/pyproject.toml`:
```toml
[project]
name = "das-home"
version = "0.1.0"
requires-python = ">=3.11"

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
```

**Step 2: Create settings module**

`backend/app/settings.py`:
```python
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
```

**Step 3: Create main FastAPI app**

`backend/app/main.py`:
```python
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

# API routes will be added in later tasks
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0", "mode": "addon" if settings.is_addon else "standalone"}

# Serve frontend static files (added after frontend build)
static_dir = Path(__file__).parent.parent.parent / "frontend" / "dist"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
```

`backend/app/__init__.py`: (empty file)

**Step 4: Verify backend starts**

Run: `cd backend && pip install -r requirements.txt && python -m uvicorn app.main:app --port 5050 --reload`
Expected: Server starts on http://localhost:5050, GET /api/health returns `{"status": "ok", ...}`

**Step 5: Commit**

```bash
git add backend/
git commit -m "feat: initialize FastAPI backend with settings and health endpoint"
```

---

### Task 2: Config Persistence Layer

**Files:**
- Create: `backend/app/config/__init__.py`
- Create: `backend/app/config/manager.py`
- Create: `backend/app/config/models.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/test_config_manager.py`
- Create: `data/.gitkeep`

**Step 1: Write the config Pydantic models**

`backend/app/config/models.py`:
```python
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
    type: str = "grid"  # "grid" | "object_page"
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
```

**Step 2: Write the config manager**

`backend/app/config/manager.py`:
```python
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
```

`backend/app/config/__init__.py`:
```python
from app.config.manager import config_manager, ConfigManager
from app.config.models import AppConfiguration, DashboardConfig

__all__ = ["config_manager", "ConfigManager", "AppConfiguration", "DashboardConfig"]
```

**Step 3: Write tests**

`backend/tests/test_config_manager.py`:
```python
import pytest
from pathlib import Path
from app.config.manager import ConfigManager
from app.config.models import AppConfiguration, DashboardConfig, ViewConfig, Section, CardItem


@pytest.fixture
def tmp_config(tmp_path):
    return ConfigManager(data_dir=tmp_path)


def test_load_default_app_config(tmp_config):
    config = tmp_config.load_app_config()
    assert config.version == 1
    assert config.locale == "de"
    assert config.connection.hass_url == "http://homeassistant.local:8123"


def test_save_and_reload_app_config(tmp_config):
    config = tmp_config.load_app_config()
    config.locale = "en"
    tmp_config.save_app_config(config)
    tmp_config.invalidate_cache()
    reloaded = tmp_config.load_app_config()
    assert reloaded.locale == "en"


def test_load_default_dashboard(tmp_config):
    dashboard = tmp_config.load_dashboard()
    assert dashboard.version == 1
    assert dashboard.theme == "sap_horizon_dark"
    assert dashboard.views == []


def test_save_dashboard_with_views(tmp_config):
    dashboard = tmp_config.load_dashboard()
    view = ViewConfig(
        id="test",
        name="Test View",
        sections=[
            Section(
                id="sec1",
                title="Lights",
                items=[CardItem(id="c1", type="light", entity="light.test")]
            )
        ]
    )
    dashboard.views.append(view)
    tmp_config.save_dashboard(dashboard)
    tmp_config.invalidate_cache()
    reloaded = tmp_config.load_dashboard()
    assert len(reloaded.views) == 1
    assert reloaded.views[0].name == "Test View"
    assert reloaded.views[0].sections[0].items[0].entity == "light.test"


def test_is_configured_false_initially(tmp_config):
    assert tmp_config.is_configured() is False


def test_is_configured_true_after_save(tmp_config):
    tmp_config.save_app_config(tmp_config.load_app_config())
    assert tmp_config.is_configured() is True
```

**Step 4: Run tests**

Run: `cd backend && pip install pytest pytest-asyncio && python -m pytest tests/ -v`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add backend/app/config/ backend/tests/ data/.gitkeep
git commit -m "feat: add config persistence layer with YAML read/write and Pydantic models"
```

---

### Task 3: Config REST API Endpoints

**Files:**
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/config_routes.py`
- Create: `backend/tests/test_config_api.py`
- Modify: `backend/app/main.py`

**Step 1: Write the failing test**

`backend/tests/test_config_api.py`:
```python
import pytest
from fastapi.testclient import TestClient
from pathlib import Path
from app.main import app
from app.config.manager import ConfigManager, config_manager


@pytest.fixture(autouse=True)
def use_tmp_config(tmp_path, monkeypatch):
    tmp_manager = ConfigManager(data_dir=tmp_path)
    monkeypatch.setattr("app.api.config_routes.config_manager", tmp_manager)
    yield tmp_manager


@pytest.fixture
def client():
    return TestClient(app)


def test_get_config(client):
    resp = client.get("/api/config")
    assert resp.status_code == 200
    data = resp.json()
    assert data["locale"] == "de"
    assert data["version"] == 1


def test_put_config(client):
    resp = client.get("/api/config")
    config = resp.json()
    config["locale"] = "en"
    resp = client.put("/api/config", json=config)
    assert resp.status_code == 200
    resp = client.get("/api/config")
    assert resp.json()["locale"] == "en"


def test_get_dashboard(client):
    resp = client.get("/api/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert data["theme"] == "sap_horizon_dark"
    assert data["views"] == []


def test_put_dashboard(client):
    resp = client.get("/api/dashboard")
    dashboard = resp.json()
    dashboard["views"] = [{"id": "test", "name": "Test", "type": "grid", "sections": []}]
    resp = client.put("/api/dashboard", json=dashboard)
    assert resp.status_code == 200
    resp = client.get("/api/dashboard")
    assert len(resp.json()["views"]) == 1


def test_get_status(client):
    resp = client.get("/api/auth/status")
    assert resp.status_code == 200
    assert "configured" in resp.json()
```

**Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_config_api.py -v`
Expected: FAIL (routes not yet created)

**Step 3: Write the API routes**

`backend/app/api/config_routes.py`:
```python
from fastapi import APIRouter, HTTPException
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
```

`backend/app/api/__init__.py`: (empty file)

Add to `backend/app/main.py` — insert before the static mount:
```python
from app.api.config_routes import router as config_router
app.include_router(config_router)
```

**Step 4: Run tests**

Run: `cd backend && python -m pytest tests/test_config_api.py -v`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add backend/app/api/ backend/tests/test_config_api.py backend/app/main.py
git commit -m "feat: add config and dashboard REST API endpoints"
```

---

### Task 4: Initialize Frontend Project

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/vite-env.d.ts`

**Step 1: Scaffold the React + Vite + UI5 project**

Run:
```bash
cd frontend && pnpm init
pnpm add react react-dom @ui5/webcomponents-react @ui5/webcomponents @ui5/webcomponents-fiori @ui5/webcomponents-icons
pnpm add -D typescript @types/react @types/react-dom vite @vitejs/plugin-react
```

**Step 2: Create config files**

`frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`frontend/tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

`frontend/vite.config.ts`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:5050",
      "/ws": {
        target: "ws://localhost:5050",
        ws: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
```

**Step 3: Create entry point files**

`frontend/index.html`:
```html
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>das-home</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`frontend/src/main.tsx`:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-react/dist/Assets.js";
import "@ui5/webcomponents-icons/dist/AllIcons.js";
import { setTheme } from "@ui5/webcomponents-base/dist/config/Theme.js";
import App from "./App";

setTheme("sap_horizon_dark");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
```

`frontend/src/App.tsx`:
```tsx
import { ShellBar, Card, CardHeader, FlexBox, FlexBoxDirection, FlexBoxAlignItems, FlexBoxJustifyContent, Title, TitleLevel } from "@ui5/webcomponents-react";

export default function App() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <ShellBar primaryTitle="das-home" />
      <FlexBox
        direction={FlexBoxDirection.Column}
        alignItems={FlexBoxAlignItems.Center}
        justifyContent={FlexBoxJustifyContent.Center}
        style={{ flex: 1, gap: "1rem" }}
      >
        <Title level={TitleLevel.H1}>das-home</Title>
        <Card header={<CardHeader titleText="Setup Required" />}>
          <div style={{ padding: "1rem" }}>
            <p>Dashboard is not configured yet. Setup wizard will start automatically.</p>
          </div>
        </Card>
      </FlexBox>
    </div>
  );
}
```

`frontend/src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />
```

**Step 4: Verify frontend builds and runs**

Run: `cd frontend && pnpm dev`
Expected: Vite dev server on http://localhost:3000 showing UI5 ShellBar + placeholder Card

**Step 5: Commit**

```bash
git add frontend/
echo "node_modules/" > frontend/.gitignore
git add frontend/.gitignore
git commit -m "feat: initialize React frontend with UI5 Web Components and Vite"
```

---

### Task 5: Zustand Stores + API Service Layer

**Files:**
- Create: `frontend/src/stores/connectionStore.ts`
- Create: `frontend/src/stores/configStore.ts`
- Create: `frontend/src/stores/dashboardStore.ts`
- Create: `frontend/src/stores/entityStore.ts`
- Create: `frontend/src/services/api.ts`
- Create: `frontend/src/types/index.ts`

**Step 1: Install dependencies**

Run: `cd frontend && pnpm add zustand home-assistant-js-websocket`

**Step 2: Create TypeScript types**

`frontend/src/types/index.ts`:
```typescript
export interface ConnectionConfig {
  hass_url: string;
  token_stored: boolean;
}

export interface SidebarConfig {
  width: number;
  visible: boolean;
  show_clock: boolean;
  show_weather: boolean;
  weather_entity: string;
}

export interface HacsCardEntry {
  name: string;
  url: string;
  version: string;
}

export interface AppConfiguration {
  version: number;
  connection: ConnectionConfig;
  locale: string;
  custom_js_enabled: boolean;
  hacs_cards: HacsCardEntry[];
  sidebar: SidebarConfig;
}

export interface CardItem {
  id: string;
  type: string;
  entity: string;
  size: string;
  config: Record<string, unknown>;
}

export interface SubSection {
  id: string;
  title: string;
  items: CardItem[];
}

export interface Section {
  id: string;
  title: string;
  icon: string;
  items: CardItem[];
  subsections: SubSection[];
}

export interface HeaderConfig {
  show_badges: boolean;
  badges: string[];
}

export interface ViewConfig {
  id: string;
  name: string;
  icon: string;
  type: "grid" | "object_page";
  area: string;
  header: HeaderConfig;
  layout: Record<string, unknown>;
  sections: Section[];
}

export interface DashboardConfig {
  version: number;
  theme: string;
  accent_color: string;
  auto_theme: boolean;
  sidebar_visible: boolean;
  default_view: string;
  views: ViewConfig[];
}

export interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface Area {
  area_id: string;
  name: string;
  picture: string | null;
  floor_id: string | null;
}

export interface Device {
  id: string;
  name: string;
  area_id: string | null;
  manufacturer: string;
  model: string;
}

export interface Floor {
  floor_id: string;
  name: string;
  level: number;
}
```

**Step 3: Create API service**

`frontend/src/services/api.ts`:
```typescript
import type { AppConfiguration, DashboardConfig } from "@/types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!resp.ok) {
    throw new Error(`API error: ${resp.status} ${resp.statusText}`);
  }
  return resp.json();
}

export const api = {
  getHealth: () => request<{ status: string; version: string }>("/health"),
  getConfig: () => request<AppConfiguration>("/config"),
  putConfig: (config: AppConfiguration) =>
    request("/config", { method: "PUT", body: JSON.stringify(config) }),
  getDashboard: () => request<DashboardConfig>("/dashboard"),
  putDashboard: (dashboard: DashboardConfig) =>
    request("/dashboard", { method: "PUT", body: JSON.stringify(dashboard) }),
  getAuthStatus: () => request<{ configured: boolean; mode: string }>("/auth/status"),
};
```

**Step 4: Create Zustand stores**

`frontend/src/stores/connectionStore.ts`:
```typescript
import { create } from "zustand";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

interface ConnectionStore {
  status: ConnectionStatus;
  hassUrl: string;
  haVersion: string;
  setStatus: (status: ConnectionStatus) => void;
  setHassUrl: (url: string) => void;
  setHaVersion: (version: string) => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  status: "disconnected",
  hassUrl: "",
  haVersion: "",
  setStatus: (status) => set({ status }),
  setHassUrl: (hassUrl) => set({ hassUrl }),
  setHaVersion: (haVersion) => set({ haVersion }),
}));
```

`frontend/src/stores/entityStore.ts`:
```typescript
import { create } from "zustand";
import type { EntityState, Area, Device, Floor } from "@/types";

interface EntityStore {
  entities: Map<string, EntityState>;
  areas: Map<string, Area>;
  devices: Map<string, Device>;
  floors: Map<string, Floor>;
  setEntity: (entityId: string, state: EntityState) => void;
  setEntities: (entities: Map<string, EntityState>) => void;
  setAreas: (areas: Area[]) => void;
  setDevices: (devices: Device[]) => void;
  setFloors: (floors: Floor[]) => void;
}

export const useEntityStore = create<EntityStore>((set) => ({
  entities: new Map(),
  areas: new Map(),
  devices: new Map(),
  floors: new Map(),
  setEntity: (entityId, state) =>
    set((prev) => {
      const next = new Map(prev.entities);
      next.set(entityId, state);
      return { entities: next };
    }),
  setEntities: (entities) => set({ entities }),
  setAreas: (areas) =>
    set({ areas: new Map(areas.map((a) => [a.area_id, a])) }),
  setDevices: (devices) =>
    set({ devices: new Map(devices.map((d) => [d.id, d])) }),
  setFloors: (floors) =>
    set({ floors: new Map(floors.map((f) => [f.floor_id, f])) }),
}));
```

`frontend/src/stores/dashboardStore.ts`:
```typescript
import { create } from "zustand";
import type { DashboardConfig, ViewConfig } from "@/types";

interface DashboardStore {
  dashboard: DashboardConfig | null;
  activeViewId: string;
  editMode: boolean;
  setDashboard: (dashboard: DashboardConfig) => void;
  setActiveViewId: (id: string) => void;
  setEditMode: (editMode: boolean) => void;
  getActiveView: () => ViewConfig | undefined;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  dashboard: null,
  activeViewId: "",
  editMode: false,
  setDashboard: (dashboard) =>
    set({ dashboard, activeViewId: dashboard.default_view || dashboard.views[0]?.id || "" }),
  setActiveViewId: (activeViewId) => set({ activeViewId }),
  setEditMode: (editMode) => set({ editMode }),
  getActiveView: () => {
    const { dashboard, activeViewId } = get();
    return dashboard?.views.find((v) => v.id === activeViewId);
  },
}));
```

`frontend/src/stores/configStore.ts`:
```typescript
import { create } from "zustand";
import type { AppConfiguration } from "@/types";

interface ConfigStore {
  config: AppConfiguration | null;
  setConfig: (config: AppConfiguration) => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}));
```

**Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: add Zustand stores, TypeScript types, and API service layer"
```

---

## Phase 2: WebSocket Proxy & HA Connection

> Goal: Frontend connects to HA via backend WebSocket proxy, real-time entity states flowing.

---

### Task 6: Backend WebSocket Proxy

**Files:**
- Create: `backend/app/ws/__init__.py`
- Create: `backend/app/ws/proxy.py`
- Create: `backend/app/ws/manager.py`
- Modify: `backend/app/main.py`

**Step 1: Create WebSocket manager (fan-out)**

`backend/app/ws/manager.py`:
```python
import asyncio
import json
import logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.clients: list[WebSocket] = []
        self._ha_ws = None
        self._ha_task: asyncio.Task | None = None
        self._msg_id = 0

    async def connect_client(self, ws: WebSocket):
        await ws.accept()
        self.clients.append(ws)
        logger.info(f"Client connected. Total: {len(self.clients)}")

    def disconnect_client(self, ws: WebSocket):
        if ws in self.clients:
            self.clients.remove(ws)
        logger.info(f"Client disconnected. Total: {len(self.clients)}")

    async def broadcast(self, message: dict):
        data = json.dumps(message)
        disconnected = []
        for client in self.clients:
            try:
                await client.send_text(data)
            except Exception:
                disconnected.append(client)
        for client in disconnected:
            self.disconnect_client(client)

    def next_id(self) -> int:
        self._msg_id += 1
        return self._msg_id


ws_manager = ConnectionManager()
```

**Step 2: Create WebSocket proxy endpoint**

`backend/app/ws/proxy.py`:
```python
import asyncio
import json
import logging

import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.ws.manager import ws_manager
from app.config import config_manager

logger = logging.getLogger(__name__)
router = APIRouter()

_ha_connection = None
_ha_listen_task = None
_subscribed = False


async def _get_ha_url() -> str:
    config = config_manager.load_app_config()
    url = config.connection.hass_url.rstrip("/")
    return url.replace("http://", "ws://").replace("https://", "wss://") + "/api/websocket"


async def _get_ha_token() -> str:
    from app.settings import settings
    if settings.is_addon:
        return settings.supervisor_token
    return settings.hass_token


async def _ensure_ha_connection():
    global _ha_connection, _ha_listen_task, _subscribed

    if _ha_connection is not None:
        try:
            await _ha_connection.ping()
            return
        except Exception:
            _ha_connection = None
            _subscribed = False

    ha_url = await _get_ha_url()
    token = await _get_ha_token()

    _ha_connection = await websockets.connect(ha_url)

    # Wait for auth_required
    auth_msg = json.loads(await _ha_connection.recv())
    if auth_msg.get("type") == "auth_required":
        await _ha_connection.send(json.dumps({"type": "auth", "access_token": token}))
        result = json.loads(await _ha_connection.recv())
        if result.get("type") != "auth_ok":
            raise ConnectionError(f"HA auth failed: {result}")

    logger.info("Connected to Home Assistant WebSocket")

    # Subscribe to state changes
    if not _subscribed:
        msg_id = ws_manager.next_id()
        await _ha_connection.send(json.dumps({
            "id": msg_id,
            "type": "subscribe_events",
            "event_type": "state_changed",
        }))
        _subscribed = True

    # Start listener if not running
    if _ha_listen_task is None or _ha_listen_task.done():
        _ha_listen_task = asyncio.create_task(_listen_ha())


async def _listen_ha():
    global _ha_connection, _subscribed
    try:
        async for raw in _ha_connection:
            msg = json.loads(raw)
            if msg.get("type") == "event":
                event_data = msg.get("event", {})
                if event_data.get("event_type") == "state_changed":
                    data = event_data.get("data", {})
                    await ws_manager.broadcast({
                        "type": "state_changed",
                        "entity_id": data.get("entity_id"),
                        "new_state": data.get("new_state"),
                        "old_state": data.get("old_state"),
                    })
    except Exception as e:
        logger.error(f"HA WebSocket listener error: {e}")
        _ha_connection = None
        _subscribed = False


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws_manager.connect_client(ws)
    try:
        await _ensure_ha_connection()
        # Send initial connection status
        await ws.send_json({"type": "connected", "ha_connected": _ha_connection is not None})

        while True:
            data = await ws.receive_json()
            msg_type = data.get("type")

            if msg_type == "call_service":
                if _ha_connection:
                    msg_id = ws_manager.next_id()
                    await _ha_connection.send(json.dumps({
                        "id": msg_id,
                        "type": "call_service",
                        "domain": data.get("domain"),
                        "service": data.get("service"),
                        "service_data": data.get("data", {}),
                        "target": data.get("target", {}),
                    }))

            elif msg_type == "get_states":
                if _ha_connection:
                    msg_id = ws_manager.next_id()
                    await _ha_connection.send(json.dumps({
                        "id": msg_id,
                        "type": "get_states",
                    }))
                    # Wait for response and forward
                    resp = json.loads(await _ha_connection.recv())
                    await ws.send_json({"type": "states_result", "result": resp.get("result", [])})

            elif msg_type == "ping":
                await ws.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Client WS error: {e}")
    finally:
        ws_manager.disconnect_client(ws)
```

`backend/app/ws/__init__.py`: (empty file)

**Step 3: Register in main.py**

Add to `backend/app/main.py`:
```python
from app.ws.proxy import router as ws_router
app.include_router(ws_router)
```

**Step 4: Commit**

```bash
git add backend/app/ws/ backend/app/main.py
git commit -m "feat: add WebSocket proxy with HA connection and fan-out to browser clients"
```

---

### Task 7: Frontend WebSocket Hook

**Files:**
- Create: `frontend/src/hooks/useHomeAssistant.ts`
- Create: `frontend/src/hooks/useEntity.ts`

**Step 1: Create WebSocket connection hook**

`frontend/src/hooks/useHomeAssistant.ts`:
```typescript
import { useEffect, useRef, useCallback } from "react";
import { useConnectionStore } from "@/stores/connectionStore";
import { useEntityStore } from "@/stores/entityStore";
import type { EntityState } from "@/types";

export function useHomeAssistant() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const reconnectDelay = useRef(1000);

  const setStatus = useConnectionStore((s) => s.setStatus);
  const setEntity = useEntityStore((s) => s.setEntity);
  const setEntities = useEntityStore((s) => s.setEntities);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      setStatus("connected");
      reconnectDelay.current = 1000;
      // Request all current states
      ws.send(JSON.stringify({ type: "get_states" }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "state_changed" && msg.new_state) {
        setEntity(msg.entity_id, msg.new_state as EntityState);
      }

      if (msg.type === "states_result" && Array.isArray(msg.result)) {
        const map = new Map<string, EntityState>();
        for (const state of msg.result) {
          map.set(state.entity_id, state);
        }
        setEntities(map);
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      wsRef.current = null;
      // Exponential backoff reconnect
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
        connect();
      }, reconnectDelay.current);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [setStatus, setEntity, setEntities]);

  const callService = useCallback(
    (domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: "call_service", domain, service, data, target })
        );
      }
    },
    []
  );

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { callService };
}
```

**Step 2: Create entity convenience hook**

`frontend/src/hooks/useEntity.ts`:
```typescript
import { useEntityStore } from "@/stores/entityStore";
import type { EntityState } from "@/types";

export function useEntity(entityId: string): EntityState | undefined {
  return useEntityStore((s) => s.entities.get(entityId));
}

export function useEntitiesByDomain(domain: string): EntityState[] {
  return useEntityStore((s) => {
    const result: EntityState[] = [];
    for (const [id, state] of s.entities) {
      if (id.startsWith(`${domain}.`)) {
        result.push(state);
      }
    }
    return result;
  });
}

export function useEntitiesByArea(areaId: string): EntityState[] {
  // This will be enhanced once we have device-area mapping
  return useEntityStore((s) => Array.from(s.entities.values()));
}
```

**Step 3: Commit**

```bash
git add frontend/src/hooks/
git commit -m "feat: add useHomeAssistant WebSocket hook and entity convenience hooks"
```

---

## Phase 3: Core Layout & Navigation Shell

> Goal: ShellBar + SideNavigation + View switching working with placeholder content.

---

### Task 8: App Shell Layout

**Files:**
- Create: `frontend/src/components/layout/AppShell.tsx`
- Create: `frontend/src/components/layout/Sidebar.tsx`
- Create: `frontend/src/components/layout/ViewRenderer.tsx`
- Modify: `frontend/src/App.tsx`

**Step 1: Create the layout components**

`frontend/src/components/layout/AppShell.tsx`:
```tsx
import { ShellBar, ShellBarItem } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/edit.js";
import "@ui5/webcomponents-icons/dist/settings.js";
import { useDashboardStore } from "@/stores/dashboardStore";

interface AppShellProps {
  onSettingsClick: () => void;
  children: React.ReactNode;
}

export function AppShell({ onSettingsClick, children }: AppShellProps) {
  const { editMode, setEditMode } = useDashboardStore();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <ShellBar
        primaryTitle="das-home"
        showCoPilot={false}
      >
        <ShellBarItem
          icon="edit"
          text={editMode ? "Done" : "Edit"}
          onClick={() => setEditMode(!editMode)}
        />
        <ShellBarItem
          icon="settings"
          text="Settings"
          onClick={onSettingsClick}
        />
      </ShellBar>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
```

`frontend/src/components/layout/Sidebar.tsx`:
```tsx
import {
  SideNavigation,
  SideNavigationItem,
} from "@ui5/webcomponents-react";
import { useDashboardStore } from "@/stores/dashboardStore";

export function Sidebar() {
  const { dashboard, activeViewId, setActiveViewId } = useDashboardStore();

  if (!dashboard) return null;

  return (
    <SideNavigation
      style={{ width: "280px", flexShrink: 0 }}
      onSelectionChange={(e) => {
        const item = e.detail.item;
        const viewId = item.dataset.viewId;
        if (viewId) setActiveViewId(viewId);
      }}
    >
      {dashboard.views.map((view) => (
        <SideNavigationItem
          key={view.id}
          text={view.name}
          icon={view.icon.replace("mdi:", "")}
          selected={view.id === activeViewId}
          data-view-id={view.id}
        />
      ))}
    </SideNavigation>
  );
}
```

`frontend/src/components/layout/ViewRenderer.tsx`:
```tsx
import { Title, TitleLevel, FlexBox, FlexBoxDirection, FlexBoxAlignItems, FlexBoxJustifyContent, IllustratedMessage } from "@ui5/webcomponents-react";
import { useDashboardStore } from "@/stores/dashboardStore";

export function ViewRenderer() {
  const activeView = useDashboardStore((s) => {
    const { dashboard, activeViewId } = s;
    return dashboard?.views.find((v) => v.id === activeViewId);
  });

  if (!activeView) {
    return (
      <FlexBox
        direction={FlexBoxDirection.Column}
        alignItems={FlexBoxAlignItems.Center}
        justifyContent={FlexBoxJustifyContent.Center}
        style={{ flex: 1 }}
      >
        <Title level={TitleLevel.H2}>No view selected</Title>
      </FlexBox>
    );
  }

  return (
    <div style={{ flex: 1, padding: "1rem", overflow: "auto" }}>
      <Title level={TitleLevel.H2}>{activeView.name}</Title>
      <p style={{ color: "var(--sapContent_LabelColor)" }}>
        View type: {activeView.type} | Sections: {activeView.sections.length}
      </p>
      {/* Card rendering will be added in Phase 4 */}
    </div>
  );
}
```

**Step 2: Update App.tsx**

`frontend/src/App.tsx`:
```tsx
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { ViewRenderer } from "@/components/layout/ViewRenderer";
import { useHomeAssistant } from "@/hooks/useHomeAssistant";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useConfigStore } from "@/stores/configStore";
import { api } from "@/services/api";

export default function App() {
  const [loading, setLoading] = useState(true);
  const setDashboard = useDashboardStore((s) => s.setDashboard);
  const setConfig = useConfigStore((s) => s.setConfig);
  useHomeAssistant();

  useEffect(() => {
    async function init() {
      try {
        const [config, dashboard] = await Promise.all([
          api.getConfig(),
          api.getDashboard(),
        ]);
        setConfig(config);
        setDashboard(dashboard);
      } catch (e) {
        console.error("Failed to load config:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [setConfig, setDashboard]);

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  return (
    <AppShell onSettingsClick={() => console.log("TODO: settings dialog")}>
      <Sidebar />
      <ViewRenderer />
    </AppShell>
  );
}
```

**Step 3: Verify it works**

Run: `cd frontend && pnpm dev` (with backend running on 5050)
Expected: ShellBar + Sidebar (empty, no views yet) + "No view selected" placeholder

**Step 4: Commit**

```bash
git add frontend/src/
git commit -m "feat: add app shell with ShellBar, SideNavigation, and view renderer"
```

---

## Phase 4: Card System Foundation

> Goal: BaseCard wrapper + first 6 native cards (one per group) rendering real HA entity data.

---

### Task 9: BaseCard Component + CardRegistry

**Files:**
- Create: `frontend/src/components/cards/BaseCard.tsx`
- Create: `frontend/src/components/cards/CardRegistry.ts`
- Create: `frontend/src/components/cards/CardErrorBoundary.tsx`

Detailed implementation for the card wrapper, error boundary, and registry mapping card type strings to React components. Each card gets: UI5 `Card` shell, edit-mode overlay, error boundary, loading state.

### Task 10: First Card — SwitchCard (Group B)

Simplest interactive card. Toggle switch for `switch.*` and `input_boolean.*` entities. Uses UI5 `Switch` component + `callService` to toggle.

### Task 11: SensorCard (Group A)

Display-only card for `sensor.*`. Shows entity name, current value, unit, and a sparkline trend icon (up/down/stable based on state change direction).

### Task 12: LightCard (Group C)

Slider-based card for `light.*`. UI5 `Slider` for brightness, optional color indicator. Calls `light.turn_on` with `brightness_pct`.

### Task 13: ClimateCard (Group D)

Complex card for `climate.*`. UI5 `StepInput` for target temp, `SegmentedButton` for HVAC mode (heat/cool/auto/off), current temperature display.

### Task 14: MediaPlayerCard (Group D)

Transport controls (play/pause/next/prev) via UI5 `Button`, volume `Slider`, artwork display, current media title.

### Task 15: SceneCard (Group B)

Simple action button card. One-click activation via `scene.turn_on`. UI5 `Button` with icon.

---

## Phase 5: Grid + ObjectPage View Renderers

> Goal: Grid view for overview, ObjectPage view for area pages, with real cards rendering.

### Task 16: GridView Component

CSS Grid layout rendering cards from a `grid`-type view config. Supports 1x1, 2x1, 1x2, 2x2 sizes. Responsive `auto-fill` columns.

### Task 17: ObjectPageView Component

UI5 `ObjectPage` with `ObjectPageSection`/`ObjectPageSubSection` for `object_page`-type views. Header with KPI badges. AnchorBar navigation between sections.

### Task 18: Wire ViewRenderer to GridView/ObjectPageView

ViewRenderer dispatches to the correct component based on `view.type`. Cards rendered inside sections via CardRegistry.

---

## Phase 6: Discovery & Setup Wizard

> Goal: First-run wizard that discovers HA entities and generates a dashboard.

### Task 19: Backend Discovery Engine

`/api/discovery` endpoint that connects to HA, fetches areas, devices, entities, floors. Returns structured JSON.

### Task 20: Backend Dashboard Suggestion Generator

`/api/discovery/suggest` that takes discovery data and generates a `DashboardConfig` with views per area, sections per domain, auto-mapped card types.

### Task 21: Setup Wizard Frontend

UI5 `Wizard` component with 5 steps: Connection -> Discovery -> Preview -> Customize -> Done. Shows on first run when `is_configured` is false.

---

## Phase 7: Card & View Wizards

> Goal: Full CRUD for cards and views via wizard dialogs.

### Task 22: Card Wizard Dialog

UI5 `Dialog` with `Wizard`: Entity picker, card type selector, dynamic config form, live preview.

### Task 23: View Wizard Dialog

UI5 `Dialog` with `Wizard`: Name/icon/type, entity assignment, layout selection.

### Task 24: Edit Mode + Drag & Drop

Toggle edit mode in ShellBar. Cards get overlay with gear/delete buttons. `@dnd-kit/core` for reordering. Resize handles.

### Task 25: Settings Dialog

UI5 `Dialog` with `TabContainer`: General, Connection, Theme, HACS, Advanced tabs.

---

## Phase 8: HACS Web Component Bridge

> Goal: Load and render HACS custom cards inside the dashboard.

### Task 26: Backend HACS Scanner & Proxy

`/api/hacs/scan` scans HA `/config/www/community/`, `/api/hacs/proxy/*` serves JS files.

### Task 27: HacsCardBridge React Component

Shadow DOM container, loads custom element JS, builds `hass` shim from Zustand stores, assigns config. Error boundary wrapper.

### Task 28: HACS Card in Card Wizard

"Custom (HACS)" option in card type selector. CodeMirror YAML editor for config. Visual editor detection via `getConfigElement()`.

---

## Phase 9: Remaining Cards

> Goal: Complete all 30+ card types.

### Task 29: Group A remaining — BinarySensorCard, WeatherCard, PersonCard, CalendarCard, UpdateCard
### Task 30: Group B remaining — ButtonCard, AutomationCard, LockCard, ScriptCard
### Task 31: Group C remaining — CoverCard, FanCard, HumidifierCard, NumberCard, SelectCard
### Task 32: Group D remaining — VacuumCard, AlarmCard, CameraCard, TimerCard
### Task 33: Group E — IframeCard, MarkdownCard, GroupCard

---

## Phase 10: Polish, Undo/Redo, Theming

### Task 34: Undo/Redo History Store

Zustand middleware for undo/redo on dashboard mutations. Ctrl+Z/Ctrl+Shift+Z keybindings. Max 50 history entries.

### Task 35: Theme Switching

UI5 `setTheme()` integration. Theme selector in settings. Auto-switch based on `sun.sun` entity or time of day.

### Task 36: Error Handling & Reconnection UI

MessageStrip for connection status. Toast notifications for API errors. Retry logic.

---

## Phase 11: Docker & HA Add-on

### Task 37: Dockerfile (Multi-Stage)

Node stage builds frontend, Python stage runs backend + serves static files.

### Task 38: docker-compose.yml

Docker Compose file for standalone deployment.

### Task 39: HA Add-on Manifest

`config.yaml`, `run.sh`, Ingress integration, translations.

### Task 40: CI/CD GitHub Actions

Test + build + publish multi-arch Docker image to GHCR.
