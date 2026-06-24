# TODOS

## Backlog

### Card-/UX-Verbesserungen (Review 2026-06-02, HA-Anwender-Mehrwert)
- [ ] Einheitliche Detail-Popups (more-info) mit Verlaufskurve für alle Cards (Tap-on-body) <!-- priority:high -->
- [ ] area_small: Status-Fallback (Lichter-an-Zähler, Geräteanzahl) wenn keine Klimadaten — Card wirkt sonst leer <!-- priority:medium -->
- [ ] Light: Card-Größe an Render-Pfad koppeln (dimmbar → mind. 2x1, sonst Slider gequetscht) <!-- priority:medium -->
- [ ] AreaCardV2 special-button: echte Aktion je Domain (vacuum.start/return etc.) statt funktionslos <!-- priority:medium -->
- [ ] Trash: Badge-Quelle (StatusBar) und Popup-Quelle konsolidieren — zeigen unterschiedliche Tonnen <!-- priority:medium -->
- [ ] TrashCard: robustes State-Parsing (Tage / Datum / device_class:timestamp / unavailable) <!-- priority:medium -->
- [ ] CoverCard: Positions-Slider (0–100 %) + Lamellen-Tilt statt nur Auf/Stop/Zu <!-- priority:medium -->
- [ ] MediaPlayerCard: Lautstärke-Slider + Quellen-/Gruppen-Auswahl inline <!-- priority:low -->
- [ ] Zentrale weatherConditions-Map (DRY — ersetzt 4 duplizierte CONDITION_TEXT-Maps) <!-- priority:medium -->
- [ ] Backend discovery: stabile, kollisionsfreie Card-IDs (slug aus entity_id statt positions-basiertem c{n}) <!-- priority:medium -->
- [ ] Card-Smoke-Tests: unavailable/unknown/NaN-Rendering für alle Cards (Vitest) <!-- priority:medium -->

### Bestehend
- [ ] Test-Backfill: Backend Routes
- [ ] Test-Backfill: Frontend Cards
- [ ] Lovelace-native Distribution (das-home-insights)
- [ ] Weitere E2E-Tests: HA-down + Config-override

## In Progress

### prince-ui Einführung (Branch `feat/prince-ui`)
- [x] prince-ui (0.3.0) + tokens (0.1.0) vendoren + via pnpm installieren; Baseline tsc/build grün
- [ ] Theme-Bridge: `--dh-*`/`--sap*` auf `--prn-*` mappen; apple-theme → prince-ui-getrieben; Light/Dark an `setTheme`/`data-theme` koppeln
- [ ] Wave B: HomeOpsBriefing → prince `KpiCard` + Charts (löst Tremor ab)
- [ ] Wave C: Settings/Wizard-Formulare → prince `TextField`/`Switch`/`Select`/`Slider`/`Button`/`Modal`
- [ ] Wave D: Layout-Chrome → prince `Toolbar`/`TabBar`/`Sidebar`/`Badge` wo sinnvoll
- [ ] Wave E: `ObjectPageView` → prince `ObjectPage`
- [ ] Visuelle Verifikation (design-shots Light+Dark) + Schlussbericht

## Done

### Review-Session 2026-06-02 — verifizierte Bug-Fixes
- [x] `/api/discovery` 500 (+9 s) → `max_size=None` bei `websockets.connect` (4 Dateien); 1148 Entities, 200 OK
- [x] AreaCardV2 „NaN°" → `numericState()` statt parseFloat-Truthiness-Check
- [x] React Key-Kollision (c134–c137 doppelt) → deterministische ID-Dedup in `migrateCards`
- [x] SensorCard „unavailable°C/%/kr/kWh" → zentraler `formatStateValue` (kein Unit-Anhang bei unavailable)
- [x] SensorCard rohe ISO-Timestamps → `device_class`-basierte Datumsformatierung
- [x] media_player/special unavailable → `entityFriendlyName` (kein roher `entity_id` mehr)
- [x] UI5-Icon „shower" (ungültig) → „blur"
- [x] `/api/media/artwork` 500 (Kamera) → graceful 404 bei Upstream-Fehler
- [x] ClimateCard unavailable → „—" statt rohem State; `current_temperature` finite-geprüft
- [x] AreaCard temp/humidity → NaN-Schutz via `numericState`
- [x] AreaCardV2 Area-Name kleingeschrieben → `titleize`-Fallback (z. B. „Wohnzimmer")
- [x] AreaCardV2 toter Media-Button → mit `handleMediaToggle` verdrahtet
- [x] Wetter „Bewolkt" → „Bewölkt" (i18n, 3 Dateien)
- [x] Neuer Helfer `frontend/src/utils/formatEntityState.ts` + 12 Unit-Tests (grün)

### Review-Session 2026-06-02 — verifizierte Verbesserungen
- [x] device_class-basierte Sensor-Auswahl in AreaCardV2/AreaCard (liefert Temp/Feuchte statt Fehlgriff)
- [x] ClimateCard Detail-Popup (Ist-/Soll-Temp ±, HVAC-Modi) — Card öffnete vorher nichts
- [x] unavailable-Karten visuell gedimmt (opacity 0.55) via PillCard `muted`
- [x] Sensor-Sparkline (24h-Verlauf): neuer `/api/history`-Endpoint + `useSensorHistory`-Hook + `Sparkline`-SVG in SensorCard (live verifiziert, 41 Punkte)

---

# Legacy Notes

_Long-Form-Backlog vor der Migration. Hier liegen die Details zu den oben aufgelisteten Backlog-Tasks._

# Backlog / Deferred Work

Projekt-weites Backlog von Arbeit die bewusst verschoben wurde. Pro Eintrag: **What / Why / Pros / Cons / Context / Depends-on**.

---

## Test-Backfill: Backend Routes

**What:** Backend-Tests hinzufügen für `api/discovery_routes.py`, `api/panel_routes.py`, `api/media_routes.py`, `api/hacs_routes.py`, `api/calendar_routes.py`, und `ws/proxy.py`.

**Why:** Aktuell existieren nur `backend/tests/test_config_api.py` und `test_config_manager.py`. Die Data-Layer ist damit weitgehend ungetestet. "Well-tested code is non-negotiable" ist eine erklärte Präferenz, aber die Codebase widerspricht dem. Systemic Gap.

**Pros:**
- Regression-Schutz bei HA API-Änderungen
- Dokumentiert erwartetes Verhalten der WS-Proxy-Logik
- Öffnet den Weg für Contributor-PRs ohne Angst vor Breakage

**Cons:**
- Schätzungsweise ~2 Tage Arbeit (6 Router-Files + ws/proxy mit mock HA-WS).
- Kein unmittelbarer Business-Value, reiner Hygiene-Gewinn.

**Context:** Test-Pattern ist schon etabliert (`TestClient` + fixtures in `test_config_api.py`). Einfach replizieren pro Router. Für `ws/proxy.py` braucht es eine Mock-WebSocket-Fixture, das ist der komplizierteste Teil.

**Depends on:** Nichts. Kann jederzeit gestartet werden.

---

## Test-Backfill: Frontend Cards

**What:** Vitest + Testing-Library Tests für die 30 bestehenden Cards hinzufügen (nach dem Vitest-Setup das im HomeOpsBriefing-PR landet).

**Why:** Gleiche Story wie Backend-Backfill. Sobald Vitest eingerichtet ist, bestehen für 30 Cards keine Tests. Smoke-Tests + Props-Variationen wären minimal aber wertvoll.

**Pros:**
- Verhindert Regressions bei zukünftigen Card-Änderungen
- Dokumentiert die Card-Props-APIs

**Cons:**
- ~1-2 Tage für basic Smoke-Tests aller Cards
- Keine visuellen Regressions (braucht Screenshots / Playwright)

**Context:** Jede Card folgt dem Pattern `(props: CardComponentProps) => JSX`. Einfach: mount mit mock card + mock callService, assert renders without throwing + key text/values.

**Depends on:** Vitest-Setup (landet im HomeOpsBriefing-PR).

---

## Lovelace-native Distribution (das-home-insights)

**What:** Briefing Card (und evt. weitere KPI-Cards) als Lovelace Custom Card Pack verpacken, distributable via HACS ohne dass User den FastAPI-Server starten müssen.

**Why:** Das-home's Standalone-Architektur (FastAPI + React app) ist im Vergleich zu Lovelace-Native-Competitors (Mushroom, UL-Minimalist, Bubble) Adoption-Friction. Wenn die BI-These valide ist aber Setup-Friction Nutzer verliert, ist ein HACS-native Entry-Point die einfachste Brücke.

**Pros:**
- ~1-Minute-Install via HACS statt ganzem Server-Setup
- Erschließt Nutzer die "nur die Briefing Card" wollen
- Behält Standalone-App für Power-User
- Spielt gegen UL-Minimalist direkt auf ihrem Platz

**Cons:**
- Zweite Distribution-Lane heißt: zwei Codebases / Shared Code pflegen
- BI-Logik muss client-seitig laufen ODER via public REST Endpoint vom User's Server
- Komplexität der /api/insights-Dependency

**Context:** Trigger: wenn Week-4-Metriken aus Approach A (Thesis Test) positiv sind (3+/4 Success Criteria erreicht) und Issues/Feedback explizit Distribution-Friction erwähnen. Dann ist dies der nächste große Build.

**Depends on:** Approach-A-Launch + 4 Wochen Adoption-Daten.

---

## Weitere E2E-Tests: HA-down + Config-override

**What:** Zwei zusätzliche Playwright E2E-Tests:
1. HA-Disconnect mid-session: Dashboard mit Briefing Card auf, HA-Container stoppen, Card zeigt stale-Badge mit letztem Timestamp, HA restart, Card recovers.
2. Config-Override: User öffnet CardEditPopup auf Briefing Card, ändert entity_id für "Energie" KPI, saved, Card refetches mit neuer Entity.

**Why:** MVP E2E deckt nur den kritischen Add-Card-Flow. Die zwei Edge-Flows (Resilience und Customization) sind nicht abgedeckt. Integrations-Bugs bleiben bis Launch verdeckt.

**Pros:**
- Fängt Integration-Bugs die Unit-Tests mocken
- Resilience-Test ist besonders wichtig für "is das-home trustworthy" Frage

**Cons:**
- ~3h Arbeit einmal Playwright-Setup läuft
- E2Es sind flaky wenn HA-Mock/Fixture nicht sauber ist

**Context:** Playwright-Setup wird für den Add-Card-E2E im HomeOpsBriefing-PR eingerichtet. Diese zwei folgen dann der gleichen Struktur.

**Depends on:** Playwright-Setup aus HomeOpsBriefing-PR.

## Erkenntnisse / Context

- Stack: React 19 + TypeScript + UI5 Web Components (Frontend) + Python FastAPI (Backend). HA-Add-on verpackt, Ingress-fähig via `basePath.ts`.
- Alle 40 Implementierungs-Tasks (Phase 1–11) abgeschlossen. 24 native Cards, HACS-Bridge, Auto-Discovery, Wizard-System.
- Version in ZWEI Stellen: `das-home/config.yaml` UND `backend/app/main.py`. CHANGELOG bilingual (EN zuerst, dann DE).
- FastAPI gepinnt auf `>=0.115.6,<1.0.0`. Pydantic v2 `ConfigDict`. Vite `base: "./"` für relative Pfade unter HA Ingress.
- HA-Token in `.env` (gitignored). Backend: `cd backend && python -m uvicorn app.main:app --port 5050 --reload`.
- Uvicorn `--reload` unter Windows unzuverlässig — Backend nach Python-Änderungen manuell neu starten.
- `useEntitiesByArea` braucht noch Device-Area-Mapping (TODO im Code).
- Aktuell offene Spec: Wetter-Card-Popup-Erweiterung (`. auto-claude/specs/002-...`).
