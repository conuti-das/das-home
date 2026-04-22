# das-home

**The Home Assistant dashboard for people who read their energy bill.**

What happens when an enterprise UI framework meets your light switches. A Home Assistant dashboard that your IT department would accidentally approve.

Where UL-Minimalist, Mushroom, Bubble Card, and native Lovelace optimise for pretty tiles, das-home optimises for the question "what did my house actually do today?" — it's a data-oriented BI dashboard for your home, not a minimalist screensaver. KPI tiles, trend charts, year-over-year overlays, and anomaly detection live alongside the usual light switches and media controls.

[![CI](https://github.com/conuti-das/das-home/actions/workflows/ci.yml/badge.svg)](https://github.com/conuti-das/das-home/actions/workflows/ci.yml)

## Features

- **Home Operations Briefing card** — 4 KPI tiles (energy cost, occupancy hours, device uptime, anomalies), 7-day trend chart with year-over-year overlay, and daily anomaly list backed by the new `/api/insights` endpoint
- **24+ card types** with auto-discovery from HA entities
- **Widget wizard** for drag & drop configuration
- **Popup system** for detailed entity control (lights, media, weather, vehicles)
- **Area views** with tab navigation and bottom toolbar
- **Custom cards**: Area, Pill, Radar, Trash, Vehicle, LightSlider
- **HACS custom card bridge** for embedding HACS cards
- **Dark/Light theme** via SAP UI5 theming engine
- **Ingress support** for seamless HA sidebar integration

## Architecture

```mermaid
graph LR
    subgraph Browser
        FE[React Frontend<br/>UI5 Web Components]
    end

    subgraph Backend["FastAPI Backend"]
        API[REST API]
        WSP[WebSocket Proxy]
        CFG[Config Manager<br/>YAML]
        DISC[Discovery Engine]
    end

    subgraph HA[Home Assistant]
        HAWS[WebSocket API]
        HAREST[REST API]
    end

    FE <-->|WebSocket| WSP
    FE <-->|HTTP| API
    WSP <-->|Single Connection| HAWS
    API -->|HTTP| HAREST
    DISC -->|Entity Query| HAREST
    CFG -->|Read/Write| DB[(YAML Files)]
```

```mermaid
graph TB
    subgraph Frontend
        App[App.tsx] --> Shell[AppShell]
        Shell --> VR[ViewRenderer]
        VR --> GV[GridView]
        VR --> OPV[ObjectPageView]
        GV --> CR[CardRegistry]
        CR --> Cards[24 Native Cards]
        CR --> CC[Custom Cards]
        CR --> HACS[HACS Bridge]
        App --> PM[PopupModal]
        PM --> PR[PopupRegistry]
        PR --> Popups[Light / Weather / Media / ...]
    end

    subgraph State["Zustand Stores"]
        ES[Entity Store]
        DS[Dashboard Store]
    end

    VR --> DS
    Cards --> ES
```

## Install as Home Assistant Add-on

1. **Settings** > **Add-ons** > **Add-on Store**
2. Three-dot menu top right > **Repositories**
3. Add repository URL:
   ```
   https://github.com/conuti-das/das-home
   ```
4. Click **Add**, then install the **das-home** add-on

[![Add Repository](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fconuti-das%2Fdas-home)

## Install with Docker

```bash
docker run -d \
  -p 5050:5050 \
  -e DAS_HOME_HASS_URL=http://homeassistant.local:8123 \
  -e DAS_HOME_HASS_TOKEN=your_token \
  -v das-home-data:/data \
  ghcr.io/conuti-das/das-home:latest
```

Or with Docker Compose:

```bash
git clone https://github.com/conuti-das/das-home.git
cd das-home
cp .env.example .env  # Set your HA URL and token
docker-compose up -d
```

## Development

```bash
# Backend
cd backend && python -m uvicorn app.main:app --port 5050 --reload

# Frontend (separate terminal)
cd frontend && pnpm dev
```

### Tests

```bash
# Backend (pytest)
cd backend && python -m pytest tests/ -v

# Frontend unit tests (Vitest + @testing-library/react)
cd frontend && pnpm test

# Frontend end-to-end tests (Playwright)
cd frontend && pnpm e2e
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, UI5 Web Components |
| State | Zustand |
| Backend | Python 3.11+, FastAPI |
| Realtime | WebSocket proxy (single HA connection, N browser clients) |
| Config | YAML persistence with Pydantic models |
| Deploy | Docker, HA Add-on with Ingress |

## License

MIT License - see [LICENSE](LICENSE)

---

# das-home (Deutsch)

**Das Home Assistant Dashboard fuer Leute, die ihre Stromrechnung lesen.**

Was passiert, wenn ein Enterprise-UI-Framework auf deine Lichtschalter trifft. Ein Home Assistant Dashboard, das deine IT-Abteilung aus Versehen freigeben wuerde.

Waehrend UL-Minimalist, Mushroom, Bubble Card und Lovelace auf huebsche Kacheln optimieren, optimiert das-home auf die Frage "was hat mein Haus heute eigentlich gemacht?" — es ist ein datenorientiertes BI-Dashboard fuer dein Zuhause, kein minimalistischer Bildschirmschoner. KPI-Kacheln, Trend-Charts, Vorjahresvergleiche und Anomalie-Erkennung stehen neben den ueblichen Lichtschaltern und Media-Controls.

## Funktionen

- **Home Operations Briefing Karte** — 4 KPI-Kacheln (Energiekosten, Anwesenheitsstunden, Geraete-Verfuegbarkeit, Anomalien), 7-Tage-Trend-Chart mit Vorjahresvergleich und tagesbezogene Anomalie-Liste ueber den neuen `/api/insights` Endpoint
- **24+ Karten-Typen** mit Auto-Discovery aus HA-Entities
- **Widget-Wizard** fuer Drag & Drop Konfiguration
- **Popup-System** fuer detaillierte Entity-Steuerung (Licht, Medien, Wetter, Fahrzeug)
- **Area-Views** mit Tab-Navigation und Bottom-Toolbar
- **Custom Cards**: Area, Pill, Radar, Muellabfuhr, Fahrzeug, LightSlider
- **HACS Custom Card Bridge** zum Einbinden von HACS-Karten
- **Dark/Light Theme** via SAP UI5 Theming
- **Ingress-Support** fuer nahtlose HA-Sidebar-Integration

## Installation als Home Assistant Add-on

1. **Einstellungen** > **Add-ons** > **Add-on Store**
2. Drei-Punkte-Menu oben rechts > **Repositories**
3. Repository-URL einfuegen:
   ```
   https://github.com/conuti-das/das-home
   ```
4. **Add** klicken, dann das Add-on **das-home** installieren

## Installation mit Docker

```bash
docker run -d \
  -p 5050:5050 \
  -e DAS_HOME_HASS_URL=http://homeassistant.local:8123 \
  -e DAS_HOME_HASS_TOKEN=dein_token \
  -v das-home-data:/data \
  ghcr.io/conuti-das/das-home:latest
```

## Entwicklung

```bash
# Backend starten
cd backend && python -m uvicorn app.main:app --port 5050 --reload

# Frontend starten (separates Terminal)
cd frontend && pnpm dev
```

### Tests

```bash
# Backend (pytest)
cd backend && python -m pytest tests/ -v

# Frontend Unit-Tests (Vitest + @testing-library/react)
cd frontend && pnpm test

# Frontend End-to-End-Tests (Playwright)
cd frontend && pnpm e2e
```
