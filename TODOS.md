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
