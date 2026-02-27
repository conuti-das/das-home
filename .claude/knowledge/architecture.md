# Architecture

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + UI5 Web Components (`@ui5/webcomponents-react`)
- **Backend**: Python 3.11+ FastAPI
- **State**: Zustand stores (connection, entity, dashboard, config)
- **Styling**: CSS custom properties, UI5 theme variables, component-level CSS files
- **Build**: Vite (frontend), uvicorn (backend), Docker Compose (production)

## Frontend Modules

### Components
- `components/cards/` - 24 native card types + HACS bridge + custom cards (Area, Pill, Radar, Trash, Vehicle, LightSlider, WeatherIcon)
- `components/layout/` - AppShell, ViewRenderer, BottomToolbar, TabBar, StatusBar, PopupModal, ConnectionStatus, GreetingHeader, CardContextMenu
- `components/views/` - GridView, ObjectPageView, DraggableGrid
- `components/wizard/` - WidgetWizard, CardEditPopup, EntityExplorer, WidgetGallery, PlacementPreview, SizeSelector, StylingPanel
- `components/popups/` - Entity detail popups (light, weather, area, trash, media, etc.)
- `components/settings/` - SettingsDialog

### Stores (Zustand)
- `entityStore.ts` - HA entity state cache, WebSocket subscription
- `dashboardStore.ts` - Dashboard config, views, cards, edit mode, undo/redo
- Connection state managed in `useHomeAssistant` hook

### Hooks
- `useEntity.ts` - Single entity subscription
- `useHomeAssistant.ts` - HA WebSocket connection management
- `useEntityFilter.ts` - Entity filtering/search

### Key Files
- `CardRegistry.ts` - Maps entity type strings to React card components
- `main.tsx` - App entry point, theme setup
- `App.tsx` - Root component, routing, wizard integration

## Backend Modules

### API Routes
- `discovery_routes.py` - Auto-discovery, generates dashboard from HA entities
- `media_routes.py` - Media proxy for HA media content

### Core
- `main.py` - FastAPI app, CORS, static files, WebSocket proxy
- `settings.py` - Pydantic settings (HA URL, token from env)
- `ws/proxy.py` - WebSocket fan-out (single HA connection → N browser clients)
- `config/manager.py` - YAML config persistence with Pydantic models

## Data Flow

```
Browser ←WebSocket→ FastAPI ←WebSocket→ Home Assistant
Browser ←HTTP/REST→ FastAPI ←HTTP→ Home Assistant REST API
```

1. Frontend connects via WebSocket to backend proxy
2. Backend maintains single persistent connection to HA
3. Entity state changes fan out to all connected browsers
4. Config changes saved to YAML via config manager
5. Discovery endpoint queries HA for all entities/areas and generates dashboard layout

## Ports
- Frontend dev: `:3000` (Vite, proxies `/api` to `:5050`)
- Backend: `:5050`
- Docker production: `:5050` (serves both)
- Home Assistant: `:8123`
