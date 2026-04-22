# das-home

SAP UI5-based Home Assistant Dashboard with auto-discovery, wizard-driven config, and HACS custom card support.

## Architecture

Monolithic FastAPI backend (Python 3.11+) serving a React 19 / TypeScript frontend with UI5 Web Components. Backend handles HA WebSocket proxy, config persistence (YAML), and discovery. Frontend uses Zustand stores.

## Quick Commands

```bash
# Backend
cd backend && python -m uvicorn app.main:app --port 5050 --reload
cd backend && python -m pytest tests/ -v

# Frontend
cd frontend && pnpm dev      # Dev server on :3000 (proxies /api to :5050)
cd frontend && pnpm build    # Production build
cd frontend && npx tsc --noEmit  # Type check
cd frontend && pnpm test     # Vitest unit tests
cd frontend && pnpm e2e      # Playwright end-to-end tests

# Docker
docker-compose up -d          # Full stack on :5050
```

## Project Structure

- `backend/` - FastAPI server (app/main.py, api/, config/, ws/, services/)
- `frontend/` - React + Vite + UI5 (src/components/, stores/, hooks/, services/, test/, e2e/)
- `das-home/` - Home Assistant add-on manifest (config.yaml, CHANGELOG.md, translations/)
- `data/` - Persisted YAML config (gitignored)

## Key Patterns

- **Card Registry**: `frontend/src/components/cards/CardRegistry.ts` maps type strings to React components
- **WebSocket Fan-out**: Single HA connection multiplexed to N browser clients via `backend/app/ws/`
- **Ingress Base Path**: All API/WS URLs use `frontend/src/utils/basePath.ts` helpers (`apiUrl()`, `wsUrl()`)
- **Config Persistence**: YAML files managed by `backend/app/config/manager.py` with Pydantic models

## Testing

- Backend: `cd backend && python -m pytest tests/ -v`
- Frontend: `cd frontend && npx tsc --noEmit`
- CI: GitHub Actions (`.github/workflows/ci.yml`)

---

## RELEASE WORKFLOW (WICHTIG!)

**Bei JEDEM Push mit Versionsaenderung MUSS Folgendes passieren:**

1. **CHANGELOG.md** aktualisieren: `das-home/CHANGELOG.md`
   - Bilingual: Englisch zuerst (Added/Fixed/Changed), dann Deutsch (Hinzugefuegt/Behoben/Geaendert)
   - Keine Zielgruppen-Tags mehr noetig
2. **Version bumpen** an ZWEI Stellen:
   - `das-home/config.yaml` → `version: "X.Y.Z"`
   - `backend/app/main.py` → `__version__ = "X.Y.Z"`
3. **GitHub Release** wird automatisch durch CI erstellt (`release.yml`)
4. **Nach dem Push**: GitHub Release auf github.com editieren:
   - Englische Zusammenfassung oben ergaenzen
   - Screenshots bei UI-Aenderungen hochladen

**Format fuer GitHub Release (bilingual):**

```markdown
## What's New / Was ist neu

### EN
- Brief English summary of changes

### DE
- Deutsche Zusammenfassung der Aenderungen

### Screenshots
![Screenshot](url)
```

Details: siehe `.claude/docs/changelog-guide.md`
