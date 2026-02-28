# das-home

Home Assistant Dashboard mit SAP UI5 Web Components.

[![CI](https://github.com/conuti-das/das-home/actions/workflows/ci.yml/badge.svg)](https://github.com/conuti-das/das-home/actions/workflows/ci.yml)

## Features

- 24+ Karten-Typen (Licht, Klima, Medien, Sensoren, Kameras, ...)
- Auto-Discovery: Dashboard wird automatisch aus HA-Entities generiert
- Widget-Wizard: Karten per Drag & Drop hinzufuegen und konfigurieren
- HACS Custom Card Bridge: HACS-Karten direkt einbinden
- Responsive Design mit Tab-Navigation und Area-Views
- Popup-System fuer Detail-Ansichten (Licht, Wetter, Medien, Fahrzeug, ...)
- Dark/Light Theme via SAP UI5 Theming

## Installation als Home Assistant Add-on

1. **Settings** > **Add-ons** > **Add-on Store**
2. Drei-Punkte-Menu oben rechts > **Repositories**
3. Repository-URL einfuegen:
   ```
   https://github.com/conuti-das/das-home
   ```
4. **Add** klicken, dann das Add-on **das-home** installieren

[![Add Repository](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fconuti-das%2Fdas-home)

## Installation mit Docker

```bash
docker run -d \
  -p 5050:5050 \
  -e DAS_HOME_HASS_URL=http://homeassistant.local:8123 \
  -e DAS_HOME_HASS_TOKEN=your_token \
  -v das-home-data:/data \
  ghcr.io/conuti-das/das-home:latest
```

Oder mit Docker Compose:

```bash
git clone https://github.com/conuti-das/das-home.git
cd das-home
cp .env.example .env  # HA URL und Token eintragen
docker-compose up -d
```

## Entwicklung

```bash
# Backend starten
cd backend && python -m uvicorn app.main:app --port 5050 --reload

# Frontend starten (separates Terminal)
cd frontend && pnpm dev
```

Siehe [CLAUDE.md](CLAUDE.md) fuer Details zur Projektstruktur und Entwicklungs-Workflow.

## Architektur

```
Browser <--WebSocket--> FastAPI Backend <--WebSocket--> Home Assistant
Browser <--HTTP/REST--> FastAPI Backend <--HTTP-------> Home Assistant REST API
```

- **Frontend**: React 19 + TypeScript + UI5 Web Components + Zustand
- **Backend**: Python 3.11+ FastAPI mit WebSocket-Proxy und YAML-Config
- **Deployment**: Docker Container oder HA Add-on mit Ingress

## Lizenz

MIT License - siehe [LICENSE](LICENSE)
