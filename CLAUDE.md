# das-home

SAP UI5-based Home Assistant Dashboard mit Auto-Discovery, Wizard-Config und HACS-Support.

## Sprache & Kommunikation

- Deutsch, Du-Form
- Direkt und effizient, kein Smalltalk

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + UI5 Web Components
- **Backend**: Python 3.11+ FastAPI
- **State**: Zustand Stores
- **Infra**: Docker Compose, HA Add-on

## Quick Commands

```bash
# Backend
cd backend && python -m uvicorn app.main:app --port 5050 --reload
cd backend && python -m pytest tests/ -v

# Frontend
cd frontend && pnpm dev          # Dev server :3000 (proxies /api zu :5050)
cd frontend && pnpm build        # Production build
cd frontend && npx tsc --noEmit  # Type check

# Docker
docker-compose up -d             # Full stack auf :5050
```

## Projekt-Struktur

- `backend/` - FastAPI server (app/main.py, api/, config/, ws/)
- `frontend/` - React + Vite + UI5 (src/components/, stores/, hooks/)
- `addon/` - Home Assistant Add-on Manifest
- `data/` - YAML config (gitignored)
- `docs/plans/` - Design-Dokumente
- `docs/changelog/` - Changelog pro Tag (YYYY-MM-DD.md)
- `.claude/` - Claude Knowledge Base und TODO

## Key Patterns

- **Card Registry**: `CardRegistry.ts` mappt Entity-Types auf React-Komponenten (24 native + HACS Bridge)
- **WebSocket Fan-out**: Eine HA-Connection, multiplexed auf N Browser-Clients
- **Config Persistence**: YAML via `config/manager.py` mit Pydantic Models
- **Auto-Discovery**: `discovery_routes.py` generiert Dashboard aus HA-Entities
- **State Management**: Zustand Stores (entity, dashboard, connection)

## Workflow

1. **Plan**: Task in `.claude/TODO.md` eintragen mit Plan und betroffenen Dateien
2. **Implementieren**: Plan Schritt fuer Schritt umsetzen
3. **Testen**:
   - Backend: `python -m pytest tests/ -v`
   - Frontend: `npx tsc --noEmit` (keine TS-Fehler)
   - Build: `pnpm build` muss fehlerfrei durchlaufen
   - Browser: Visueller Test, Screenshot bei UI-Aenderungen
4. **Review**: Test-Ergebnis in TODO dokumentieren, auf Freigabe warten
5. **Changelog**: Eintrag in `docs/changelog/YYYY-MM-DD.md` (siehe `.claude/docs/changelog-guide.md`)
6. **Commit**: Erst nach erfolgreichen Tests und Freigabe (Changelog-Datei mit-committen)

## Regeln

- Kein Commit ohne Test und Freigabe
- Build (`pnpm build`) muss fehlerfrei sein vor Commit
- Pydantic: Immer `model_config = ConfigDict(...)`, nie `class Config`
- UI5: Nur `var(--sapXxx)` Theme-Variablen fuer Farben, kein hardcoded hex/rgb
- Secrets (HA Token etc.) gehoeren in `.env`, nie in Code oder CLAUDE.md

## Knowledge Base

Details ausgelagert in `.claude/knowledge/`:
- `architecture.md` - Detaillierte Architektur, Module, Datenfluss
- `api-learnings.md` - HA API Erkenntnisse, korrekte Endpoints, Pitfalls
- `known-issues.md` - Bekannte Probleme und Workarounds

## Testing

- Backend: 11 pytest Tests (config manager + API endpoints)
- Frontend: TypeScript strict mode, Vite build validation
- CI: GitHub Actions (`.github/workflows/ci.yml`)
