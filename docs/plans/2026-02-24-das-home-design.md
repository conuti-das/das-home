# das-home Design Document

> SAP UI5 based Home Assistant Dashboard with auto-configuration, wizard-driven setup, and HACS custom card support.

**Date:** 2026-02-24
**Status:** Approved

---

## 1. Gesamtarchitektur & Tech Stack

### Projektname: das-home

### Architektur: Monolithisch

Ein FastAPI-Server serviert alles: React-App + REST API + WebSocket-Proxy.

```
┌─────────────────────────────────────────┐
│  FastAPI Server                         │
│  ├─ /api/*        REST-Endpoints        │
│  ├─ /ws           WS-Proxy zu HA        │
│  ├─ /static/*     React Build (UI5)     │
│  └─ /config       Dashboard YAML/JSON   │
├─────────────────────────────────────────┤
│  React App (UI5 Web Components)         │
│  ├─ Dashboard Grid/Layout Engine        │
│  ├─ Native Card Components (30+ Typen)  │
│  ├─ Web Component Bridge (HACS Cards)   │
│  ├─ Wizard System (Setup, Edit, Config) │
│  └─ Auto-Discovery Engine              │
└─────────────────────────────────────────┘
```

### Tech Stack

| Schicht | Technologie |
|---|---|
| **Frontend** | React 18+ mit TypeScript |
| **UI Library** | `@ui5/webcomponents-react` + `@ui5/webcomponents-react-charts` |
| **Theme** | `sap_horizon_dark` (Default), alle Horizon-Varianten verfuegbar |
| **State Management** | Zustand (leichtgewichtig, React-nativ) |
| **WebSocket Client** | `home-assistant-js-websocket` (offizielle HA-Library) |
| **Backend** | Python 3.11+ / FastAPI |
| **WebSocket Proxy** | FastAPI WebSocket-Endpunkt -> HA WebSocket |
| **Config Storage** | YAML-Dateien im `data/`-Verzeichnis |
| **Build Tool** | Vite |
| **Containerisierung** | Docker + HA Add-on |

### Verzeichnisstruktur

```
das-home/
├── frontend/                  # React App
│   ├── src/
│   │   ├── components/
│   │   │   ├── cards/         # Native Karten (30+ Typen)
│   │   │   ├── wizards/       # Setup- und Config-Wizards
│   │   │   ├── layout/        # Grid, Sidebar, Navigation
│   │   │   └── bridge/        # HACS Web Component Bridge
│   │   ├── hooks/             # Custom React Hooks (useEntity, useHA)
│   │   ├── stores/            # Zustand Stores
│   │   ├── services/          # API/WS Client Layer
│   │   └── types/             # TypeScript-Typen
│   └── vite.config.ts
├── backend/                   # FastAPI Server
│   ├── app/
│   │   ├── api/               # REST-Endpunkte
│   │   ├── ws/                # WebSocket Proxy
│   │   ├── discovery/         # Auto-Discovery Engine
│   │   ├── config/            # Config Management
│   │   └── hacs/              # HACS Card Loader
│   └── requirements.txt
├── data/                      # Persistente Konfiguration
│   ├── configuration.yaml
│   └── dashboard.yaml
├── Dockerfile
├── config.yaml                # HA Add-on Manifest
└── docker-compose.yml
```

### Datenfluss

```
User Browser
    │
    ├─► React App (UI5 Components)
    │       │
    │       ├─► FastAPI REST (/api/config, /api/discovery)
    │       │       │
    │       │       └─► data/*.yaml (Persistenz)
    │       │
    │       └─► FastAPI WebSocket (/ws)
    │               │
    │               └─► Home Assistant WebSocket API
    │                       │
    │                       ├─► Entity States (Echtzeit)
    │                       ├─► Services (toggle, set_temperature, etc.)
    │                       └─► Areas, Devices, Entities (Discovery)
```

---

## 2. Auto-Discovery & Setup-Wizard

### Erster Start — Flow

```
1. Verbindung
   HA-URL + Long-Lived Token eingeben
   (Add-on: automatisch erkannt)
        │
        ▼
2. Discovery (automatisch)
   Backend ruft ab:
    - Areas (Raeume/Stockwerke)
    - Devices + zugeordnete Entities
    - Entity-Domains + States
    - Labels & Categories
        │
        ▼
3. Dashboard-Generierung (automatisch)
   Fuer jeden Raum eine View erstellen:
    - Geraete nach Domain gruppieren
    - Passenden Kartentyp pro Entity
    - Sinnvolles Default-Layout
    - "Uebersicht"-View mit Favoriten
        │
        ▼
4. Vorschau (Hybrid-Schritt)
   "Wir haben folgendes erkannt:"
    Wohnzimmer (8 Geraete)
    Schlafzimmer (5 Geraete)
    Kueche (6 Geraete)
    Klima (4 Geraete)

   [Live-Vorschau des Dashboards]
   [ Sieht gut aus ] [ Anpassen ]
        │
        ▼
5. Optional: Anpassen
    - Views umbenennen / entfernen
    - Entities zwischen Views verschieben
    - Kartentypen aendern
    - Reihenfolge anpassen
```

### Entity -> Karten-Mapping (Auto-Zuordnung)

| HA Domain | Standard-Karte | Begruendung |
|---|---|---|
| `light` | Light Card (Brightness Slider + Color) | Haeufigste Interaktion: dimmen |
| `switch`, `input_boolean` | Toggle Card | An/Aus reicht |
| `climate` | Thermostat Card (Zieltemp + Modi) | Braucht Temperatur-Kontrolle |
| `cover` | Cover Card (Auf/Ab/Stop + Position) | Drei Aktionen + Slider |
| `sensor` | Sensor Card (Wert + Einheit + Trend) | Nur Anzeige |
| `binary_sensor` | Status Card (Icon + State) | Nur Anzeige, farbcodiert |
| `media_player` | Media Card (Play/Pause/Vol + Artwork) | Braucht Transport-Controls |
| `camera` | Camera Card (Live-Stream) | Bild/Stream anzeigen |
| `fan` | Fan Card (Speed-Stufen) | Geschwindigkeit waehlen |
| `lock` | Lock Card (Lock/Unlock + Bestaetigung) | Sicherheit braucht Confirm |
| `vacuum` | Vacuum Card (Start/Pause/Dock + Map) | Aktionen + Status |
| `weather` | Weather Card (Forecast + Conditions) | Multi-Tage-Anzeige |
| `alarm_control_panel` | Alarm Card (Arm/Disarm + PIN) | PIN-Eingabe noetig |
| `humidifier` | Humidifier Card (Zielfeuchte) | Slider + Modi |
| `scene`, `script` | Action Button | Ein-Klick-Ausfuehrung |
| `automation` | Automation Card (Toggle + Trigger) | An/Aus + manueller Trigger |
| `timer` | Timer Card (Countdown) | Verbleibende Zeit |
| `person`, `device_tracker` | Presence Card (Avatar + Zone) | Standort-Anzeige |
| `update` | Update Card (Version + Install) | Update-Aktion |
| `number`, `input_number` | Slider Card | Wertebereich |
| `select`, `input_select` | Dropdown Card | Optionsauswahl |
| `button`, `input_button` | Action Button | Einmalige Aktion |
| `calendar` | Calendar Card | Termine anzeigen |
| `image` | Image Card | Bild anzeigen |
| `tts`, `stt` | Voice Card | Sprach-Interface |
| *Unbekannt* | Generic Entity Card (Name + State + Toggle) | Fallback |

### Discovery-API (Backend)

```
GET  /api/discovery          -> Alle Areas, Devices, Entities
GET  /api/discovery/suggest  -> Generierter Dashboard-Vorschlag
POST /api/config/accept      -> Vorschlag akzeptieren -> dashboard.yaml schreiben
POST /api/config/save        -> Angepasste Konfiguration speichern
```

---

## 3. Wizard-System & UI-Konfiguration

### 3.1 Setup-Wizard (Erster Start)

Bereits in Sektion 2 beschrieben. Nutzt den UI5 `Wizard` mit 5 Steps:
Verbindung -> Discovery -> Vorschau -> Anpassen -> Fertig

### 3.2 Karten-Wizard (Neue Karte hinzufuegen / bestehende bearbeiten)

Oeffnet sich als UI5 `Dialog` mit Wizard-Steps:

**Step 1: Entity waehlen**
- Suchfeld mit Entity-Autocomplete
- Filter nach Raum und Typ
- Haeufig verwendete Entities oben

**Step 2: Kartentyp waehlen**
- Empfohlener Typ basierend auf Entity-Domain (vorausgewaehlt)
- Alternative Typen als Optionen
- "Custom (HACS)" als letzte Option

**Step 3: Karte konfigurieren**
- Dynamisches Formular basierend auf Kartentyp-Schema
- Live-Vorschau der Karte neben dem Formular
- Kein YAML noetig — alles ueber UI-Felder

Jeder Kartentyp hat ein eigenes Config-Schema. Der Wizard rendert die Felder dynamisch basierend auf dem Schema.

### 3.3 View-Wizard (Neue View / Seite erstellen)

**Step 1: Grundeinstellungen**
- Name, Icon, Typ (Raum-basiert / Geraetetyp-basiert / Leer)

**Step 2: Entities zuweisen** (wenn Raum-basiert)
- Automatische Erkennung aus HA Area
- Checkboxen zum An/Abwaehlen
- Manuelles Hinzufuegen

**Step 3: Layout**
- Auto-Layout (empfohlen), 2/3 Spalten, oder Frei (Drag & Drop)

### 3.4 Dashboard-Einstellungen (Globaler Settings-Wizard)

Erreichbar ueber Zahnrad-Icon. Nutzt UI5 `TabContainer`:

| Tab | Inhalt |
|---|---|
| **Allgemein** | Dashboard-Name, Sprache, Standard-View, Sidebar |
| **Verbindung** | HA URL (readonly im Add-on-Modus), Token, Status |
| **Theme** | Theme-Auswahl (Horizon Dark/Light/HCB/HCW), Akzentfarbe, Auto-Switch (sun.sun), Schriftgroesse |
| **HACS** | Installierte Custom Cards, JS-URL manuell hinzufuegen, Card-Registry |
| **Erweitert** | Config YAML Export/Import, Dashboard Reset, Debug-Modus, Re-Discovery |

### 3.5 Edit-Modus (In-Place Editing)

Zusaetzlich zu den Wizards:
- Toggle ueber Button in ShellBar
- Karten werden Drag & Drop verschiebbar (`@dnd-kit/core`)
- Jede Karte zeigt Zahnrad (oeffnet Karten-Wizard) und X (loescht mit Bestaetigung)
- Resize ueber Corner-Handle, snappt auf Grid
- Toolbar: [ + Karte ] [ + View ] [ Reihenfolge ]

---

## 4. HACS Web Component Bridge

### Das Problem

HACS Custom Cards (wie button-card) sind Lit/Web Components, die erwarten:
1. Ein `hass`-Objekt (HA Connection, States, Services)
2. Ein `config`-Objekt (YAML -> JS-Object)
3. Registrierung via `customElements.define()`
4. Lovelace-spezifische APIs (`getConfigElement()`, `getStubConfig()`)

### Loesung: Bridge-Architektur

```
React App
  └─ <HacsCardBridge cardType="custom:button-card" config={...} />
       │
       ▼
  Bridge Layer
   1. Shadow DOM Container erstellen
   2. Custom Element per Tag-Name laden
   3. hass-Objekt aus Zustand Store bauen
   4. config-Objekt zuweisen
   5. State-Updates durchreichen
   6. Events abfangen und an React weiterleiten
       │
       ▼
  Lit Web Component (z.B. button-card)
  Laeuft isoliert in Shadow DOM
  Erhaelt hass + config wie in Lovelace
```

### HacsCardBridge React-Komponente

```
HacsCardBridge
├── useRef() -> Shadow DOM Container
├── useEffect() -> Custom Element erstellen & einhaengen
├── useEffect() -> hass-Objekt synchronisieren bei State-Aenderungen
├── useEffect() -> config-Objekt zuweisen bei Prop-Aenderungen
└── Cleanup -> Element entfernen bei Unmount
```

Das `hass`-Objekt wird aus dem Zustand Store gebaut und enthaelt:
- `states` — alle Entity-States
- `callService(domain, service, data)` — Service-Aufrufe
- `connection` — WebSocket-Connection-Referenz
- `locale` / `language` — Spracheinstellungen
- `themes` — aktives Theme

### HACS Card Loader (Backend)

```
GET  /api/hacs/cards              -> Liste installierter Custom Cards
POST /api/hacs/cards/register     -> Custom Card JS-URL registrieren
GET  /api/hacs/cards/:name/js     -> JS-Bundle der Card ausliefern
POST /api/hacs/cards/scan         -> HA /config/www scannen nach Cards
```

**Scan-Logik:**
1. HA-API aufrufen: Dateien in `/config/www/community/` auflisten
2. Bekannte Card-Patterns erkennen (z.B. `button-card.js`, `mushroom-*.js`)
3. Card-Registry in `data/hacs_cards.yaml` pflegen
4. JS-Dateien ueber FastAPI als Proxy ausliefern

### Card-Konfiguration im Wizard

Wenn ein User "Custom (HACS)" als Kartentyp waehlt:

**Step 1:** Custom Card aus Liste waehlen (oder manuell registrieren)
**Step 2:** Konfigurations-Methode:
- Visual Editor (wenn Card `getConfigElement()` exponiert)
- YAML Editor (CodeMirror) als Fallback
- Live-Vorschau via Bridge

### Isolations-Strategie

| Concern | Loesung |
|---|---|
| **CSS-Konflikte** | Shadow DOM isoliert Card-Styles von UI5 |
| **Globale Variablen** | Cards laufen im gleichen Window, aber Shadow DOM schuetzt DOM |
| **Fehlende HA-APIs** | Bridge stellt Minimal-Shim bereit (`hass`, `lovelace`, `panel`) |
| **Card-Fehler** | Error Boundary um jede Bridge, zeigt Fehlermeldung statt Crash |
| **Performance** | Lazy Loading — Card-JS wird erst geladen wenn sichtbar |

---

## 5. Native Card Components & Layout-System

### Card-Architektur

Jede native Karte folgt einem einheitlichen Pattern:

```
BaseCard (Wrapper)
├─ UI5 Card mit Header
├─ Edit-Modus Overlay (Zahnrad, X, Handles)
├─ Error Boundary
├─ Loading State
└─ Conditional Rendering (Bedingungen)
    └─ Spezifischer Card Content
       (LightCard, ClimateCard, etc.)
```

### Card-Gruppen

**Gruppe A — Simple State Cards** (nur Anzeige):
SensorCard, BinarySensorCard, WeatherCard, PersonCard, CalendarCard, UpdateCard

**Gruppe B — Toggle/Action Cards** (ein Klick):
SwitchCard, ButtonCard, SceneCard, ScriptCard, AutomationCard, LockCard

**Gruppe C — Slider/Range Cards** (Wert einstellen):
LightCard, CoverCard, FanCard, HumidifierCard, NumberCard, SelectCard

**Gruppe D — Complex Cards** (Multi-Control):
ClimateCard, MediaPlayerCard, VacuumCard, AlarmCard, CameraCard, TimerCard

**Gruppe E — Special Cards** (kein Entity):
IframeCard, MarkdownCard, HacsCard, GroupCard

### Layout-System — Zwei View-Typen

| View-Typ | UI5 Component | Verwendung |
|---|---|---|
| **Uebersicht** | `FlexBox` + CSS Grid | Kompakte Kacheln aller Favoriten/Raeume |
| **Bereichsseite** | `ObjectPage` mit Sections/SubSections | Detailseite pro Raum/Bereich |

### Bereichsseite (ObjectPage)

```
ObjectPage
├─ ObjectPageHeader
│   └─ KPI-Badges: Lichter an, Temperatur, Aktive Geraete, Media, Energie
├─ AnchorBar
│   └─ Beleuchtung | Klima | Medien | Sensoren | Szenen
├─ Section: Beleuchtung
│   ├─ SubSection: Hauptlicht
│   │   └─ [LightCard, LightCard, ...]
│   └─ SubSection: Akzentlicht
│       └─ [LightCard, LightCard, ...]
├─ Section: Klima
│   ├─ SubSection: Heizung
│   │   └─ [ClimateCard]
│   └─ SubSection: Luftqualitaet
│       └─ [SensorCard, SensorCard, SensorCard]
├─ Section: Medien
│   ├─ SubSection: Aktive Wiedergabe
│   │   └─ [MediaPlayerCard]
│   └─ SubSection: Geraete
│       └─ [MediaPlayerCard, MediaPlayerCard]
├─ Section: Szenen
│   └─ [SceneCard, SceneCard, SceneCard]
└─ ...
```

### Auto-Grouping: Entity -> Section/SubSection

| Section | SubSection-Logik | Entities |
|---|---|---|
| **Beleuchtung** | Gruppiert nach Device oder Label | `light.*` |
| **Klima** | Heizung / Luftqualitaet / Lueftung | `climate.*`, `sensor.*_temp`, `sensor.*_humidity`, `sensor.*_co2`, `fan.*` |
| **Medien** | Aktive Wiedergabe / Geraete | `media_player.*` |
| **Sensoren** | Gruppiert nach Sensor-Klasse | `sensor.*`, `binary_sensor.*` |
| **Szenen & Automatisierungen** | Szenen / Automatisierungen / Scripts | `scene.*`, `automation.*`, `script.*` |
| **Sicherheit** | Schloesser / Alarm / Kameras | `lock.*`, `alarm_control_panel.*`, `camera.*` |
| **Abdeckungen** | Gruppiert nach Typ | `cover.*` |

**Grouping-Regeln:**
1. Entities werden per `area_id` der View zugeordnet
2. Innerhalb einer Section gruppiert nach `device_id` -> SubSection pro Geraet
3. Fallback: Entities ohne Device werden nach `device_class` gruppiert
4. Leere Sections werden ausgeblendet
5. Sections mit nur einer SubSection -> SubSection-Titel wird weggelassen

### ObjectPage Header — KPI-Badges

| Badge | Logik |
|---|---|
| **Lichter** | Anzahl `light.*` mit `state=on` |
| **Temperatur** | Primaerer `sensor.*temperature` der Area |
| **Aktive Geraete** | Anzahl Entities mit `state != off/unavailable` |
| **Media** | Aktuell spielender `media_player` Name + Titel |
| **Energie** | Summe `sensor.*power` der Area (wenn vorhanden) |
| **Sicherheit** | Alarm-Status oder Lock-Status (wenn vorhanden) |

Nur relevante Badges werden angezeigt (keine leeren).

### Grid-System (innerhalb SubSections)

| Eigenschaft | Wert |
|---|---|
| **Typ** | CSS Grid mit `auto-fill` |
| **Spaltenbreite** | `minmax(280px, 1fr)` — responsiv |
| **Kartengroessen** | 1x1 (Standard), 2x1 (breit), 1x2 (hoch), 2x2 (gross) |
| **Gap** | `1rem` (UI5 Spacing) |
| **Breakpoints** | Mobile: 1 Spalte, Tablet: 2-3, Desktop: 4-6 |
| **Drag & Drop** | `@dnd-kit/core` im Edit-Modus |
| **Resize** | Corner-Handle im Edit-Modus, snappt auf Grid |

### Navigation

| Element | UI5 Component | Verhalten |
|---|---|---|
| **Top Bar** | `ShellBar` | App-Name, View-Tabs, Edit + Settings Buttons |
| **Sidebar** | `SideNavigation` | Alle Views als Liste, collapsible |
| **View Tabs** | `TabContainer` im ShellBar | Schnelles View-Switching |
| **Mobile** | Sidebar wird Hamburger-Menu | Responsiv |

---

## 6. Datenmodell, Config-Persistenz & API

### Dashboard-Konfiguration (dashboard.yaml)

```yaml
version: 1
theme: sap_horizon_dark
accent_color: "#0070f3"
auto_theme: false
sidebar_visible: true
default_view: overview

views:
  - id: overview
    name: Uebersicht
    icon: mdi:home
    type: grid                     # grid | object_page
    layout:
      columns: auto
      min_column_width: 280
    sections:
      - id: sec_favorites
        title: Favoriten
        items:
          - id: card_1
            type: light
            entity: light.wohnzimmer
            size: 1x1
            config:
              show_brightness: true
              show_color: true

  - id: wohnzimmer
    name: Wohnzimmer
    icon: mdi:sofa
    type: object_page              # ObjectPage mit Sections/SubSections
    area: living_room
    header:
      show_badges: true
      badges: [lights, temperature, active_devices, media]
    sections:
      - id: beleuchtung
        title: Beleuchtung
        icon: mdi:lightbulb-group
        subsections:
          - id: hauptlicht
            title: Hauptlicht
            items:
              - { id: c1, type: light, entity: light.deckenlampe, size: 1x1 }
              - { id: c2, type: light, entity: light.stehlampe, size: 1x1 }
          - id: akzent
            title: Akzentlicht
            items:
              - { id: c3, type: light, entity: light.led_strip, size: 1x1 }
      - id: klima
        title: Klima
        icon: mdi:thermometer
        subsections:
          - id: heizung
            title: Heizung
            items:
              - { id: c4, type: climate, entity: climate.wohnzimmer, size: 2x1 }
          - id: luft
            title: Luftqualitaet
            items:
              - { id: c5, type: sensor, entity: sensor.co2, size: 1x1 }
              - { id: c6, type: sensor, entity: sensor.humidity, size: 1x1 }
```

### Globale Konfiguration (configuration.yaml)

```yaml
version: 1
connection:
  hass_url: "http://homeassistant.local:8123"
  token_stored: true           # Token verschluesselt in data/token.enc

locale: de
custom_js_enabled: false

hacs_cards:
  - name: button-card
    url: /local/community/button-card/button-card.js
    version: "7.0.1"
  - name: mini-graph-card
    url: /local/community/mini-graph-card/mini-graph-card-bundle.js
    version: "0.12.0"

sidebar:
  width: 280
  visible: true
  show_clock: true
  show_weather: true
  weather_entity: weather.home
```

### REST API (FastAPI)

**Config-Endpunkte:**

```
GET    /api/config                -> configuration.yaml lesen
PUT    /api/config                -> configuration.yaml schreiben
GET    /api/dashboard             -> dashboard.yaml lesen
PUT    /api/dashboard             -> dashboard.yaml komplett ersetzen
PATCH  /api/dashboard/views/:id   -> einzelne View updaten
POST   /api/dashboard/views       -> neue View hinzufuegen
DELETE /api/dashboard/views/:id   -> View loeschen
PATCH  /api/dashboard/cards/:id   -> einzelne Card updaten
POST   /api/dashboard/cards       -> neue Card zu Section hinzufuegen
DELETE /api/dashboard/cards/:id   -> Card loeschen
POST   /api/config/export         -> Gesamte Config als ZIP download
POST   /api/config/import         -> Config-ZIP importieren
POST   /api/config/reset          -> Auf Werkseinstellungen zuruecksetzen
```

**Discovery-Endpunkte:**

```
GET    /api/discovery              -> { areas, devices, entities, floors }
GET    /api/discovery/suggest      -> Auto-generierter Dashboard-Vorschlag
POST   /api/discovery/accept       -> Vorschlag -> dashboard.yaml
GET    /api/discovery/entities     -> Entity-Liste mit Filteroptionen
       ?domain=light&area=kitchen
```

**HACS-Endpunkte:**

```
GET    /api/hacs/cards             -> Registrierte Custom Cards
POST   /api/hacs/cards             -> Card manuell registrieren
DELETE /api/hacs/cards/:name       -> Card entfernen
POST   /api/hacs/scan              -> HA www-Verzeichnis scannen
GET    /api/hacs/proxy/*path       -> JS-Dateien von HA proxyen
```

**Auth-Endpunkte:**

```
POST   /api/auth/connect           -> HA-Verbindung testen
POST   /api/auth/token             -> Token speichern (verschluesselt)
GET    /api/auth/status             -> Verbindungsstatus
```

### WebSocket-Endpunkt

```
WS /ws -> Bidirektionaler Proxy zu HA WebSocket

Client -> Server:
  { type: "subscribe_entities" }
  { type: "call_service", domain, service, data }
  { type: "subscribe_events", event_type }

Server -> Client:
  { type: "state_changed", entity_id, new_state, old_state }
  { type: "service_response", success, data }
  { type: "event", event_type, data }

Eigene Events:
  { type: "das_home:config_changed" }
  { type: "das_home:discovery_complete" }
  { type: "das_home:card_error", card_id }
```

### Zustand Stores (Frontend)

```
connectionStore
  ├─ status: "connected" | "disconnected" | "connecting"
  ├─ hassUrl: string
  └─ version: string (HA version)

entityStore
  ├─ entities: Map<entity_id, EntityState>
  ├─ areas: Map<area_id, Area>
  ├─ devices: Map<device_id, Device>
  └─ floors: Map<floor_id, Floor>

dashboardStore
  ├─ views: View[]
  ├─ activeViewId: string
  └─ editMode: boolean

configStore
  ├─ theme: string
  ├─ locale: string
  ├─ sidebar: SidebarConfig
  └─ hacsCards: HacsCard[]

historyStore (Undo/Redo)
  ├─ past: DashboardState[]
  ├─ present: DashboardState
  └─ future: DashboardState[]
```

---

## 7. Fehlerbehandlung, Performance & Sicherheit

### Fehlerbehandlung

**Verbindungsverlust:**

| Zustand | Verhalten |
|---|---|
| WS getrennt | Auto-Reconnect mit exponential backoff (1s, 2s, 4s, max 30s) |
| Reconnecting | UI5 MessageStrip: "Verbindung wird wiederhergestellt..." Cards bleiben sichtbar mit letztem State |
| Reconnected | Full State Refresh, Toast: "Verbunden" |
| Auth fehlerhaft | Redirect zum Verbindungs-Wizard |

**Card-Fehler:**

| Fehlerart | Handling |
|---|---|
| Entity nicht gefunden | Card zeigt `ObjectStatus` warning + "Entity unavailable" |
| HACS Card JS-Ladefehler | Error Boundary zeigt Fehlermeldung + "Im YAML bearbeiten" Link |
| Card wirft Runtime Error | Error Boundary faengt ab, zeigt Card-ID + Fehlermeldung |
| Config ungueltig | Wizard markiert fehlerhafte Felder, Card zeigt Fallback |

**API-Fehler:**

| Endpoint | Fehler | Handling |
|---|---|---|
| Config speichern | 500 | Toast: "Speichern fehlgeschlagen", Retry-Button |
| Discovery | Timeout | Retry mit Fortschrittsanzeige |
| HACS Scan | Card nicht gefunden | Warning in HACS-Settings, manuelle URL-Eingabe |

### Performance

**Frontend:**

| Massnahme | Umsetzung |
|---|---|
| **Code Splitting** | Jede Card-Gruppe als lazy chunk (`React.lazy`) |
| **Virtualisierung** | Views mit >50 Cards nutzen `react-window` |
| **Memo** | Cards re-rendern nur bei eigenem Entity-State-Change |
| **Debouncing** | Slider-Werte debounced (200ms) bevor Service Call |
| **HACS Lazy Load** | Card-JS erst laden wenn Card im Viewport |
| **Bundle Size** | UI5 Tree-Shaking: nur verwendete Components importieren |
| **Asset Caching** | Vite Content-Hashing, aggressive Browser-Cache-Header |

**Backend:**

| Massnahme | Umsetzung |
|---|---|
| **Entity Cache** | In-Memory Cache aller States, WS-Updates inkrementell |
| **Config Cache** | YAML einmal lesen, im Speicher halten, bei Aenderung neu laden |
| **Discovery Cache** | Areas/Devices cachen, nur bei manuellem Re-Scan neu laden |
| **Static Files** | Vite-Build mit gzip, served via FastAPI `StaticFiles` |
| **WS Fan-Out** | Ein HA-WebSocket, multiplexed zu N Browser-Clients |

**WS Fan-Out:**

```
Browser A ──┐
Browser B ──┼──► FastAPI WS Manager ──► 1x HA WebSocket
Browser C ──┘         │
                      └─► Broadcast State-Changes an alle Clients
```

### Sicherheit

| Concern | Massnahme |
|---|---|
| **Token-Speicherung** | HA Long-Lived Token verschluesselt in `data/token.enc` (Fernet) |
| **API-Auth** | Alle `/api/*` Endpunkte pruefen Session/Token |
| **Add-on Modus** | Kein Token noetig, Supervisor stellt Ingress-Auth bereit |
| **HACS Card Sandbox** | Shadow DOM Isolation, kein Zugriff auf Dashboard-State |
| **Config Injection** | YAML-Parser mit `safe_load`, kein Code-Execution |
| **XSS** | React escaped per Default, HACS Cards in Shadow DOM isoliert |
| **CORS** | Nur eigener Origin erlaubt, kein wildcard |
| **Rate Limiting** | FastAPI Middleware fuer API-Endpunkte |

### Undo/Redo System

```
Aktion                    History Stack
Card verschieben    ->    [state0, state1]
Card resizen        ->    [state0, state1, state2]
Ctrl+Z (Undo)      ->    [state0, state1] <- zurueck zu state1
Card loeschen       ->    [state0, state1, state3]

Max 50 History-Eintraege, FIFO bei Ueberlauf
Nur Dashboard-Layout-Aenderungen, nicht Entity-States
```

---

## 8. Deployment — Docker & HA Add-on

### Docker Image

```
Multi-Stage Build:

Stage 1: Frontend Build
  node:20-alpine
  pnpm install -> vite build
  Output: /app/frontend/dist/

Stage 2: Production
  python:3.11-slim
  pip install fastapi uvicorn pyyaml ...
  COPY frontend/dist -> /app/static/
  COPY backend/ -> /app/
  CMD: uvicorn app.main:app --port 5050
```

Image-Groesse Ziel: < 150MB

### docker-compose.yml

```yaml
services:
  das-home:
    image: das-home:latest
    ports:
      - "5050:5050"
    volumes:
      - ./data:/app/data
    environment:
      - HASS_URL=http://homeassistant.local:8123
      - HASS_TOKEN=eyJ...
    restart: unless-stopped
```

### HA Add-on Manifest (config.yaml)

```yaml
name: "das-home"
description: "SAP UI5 based Home Assistant Dashboard"
version: "0.1.0"
slug: "das-home"
arch:
  - amd64
  - aarch64
  - armv7
ports:
  5050/tcp: 5050
ports_description:
  5050/tcp: "das-home Web UI"
ingress: true
ingress_port: 5050
panel_icon: mdi:view-dashboard
panel_title: "das-home"
homeassistant_api: true
auth_api: true
options:
  locale: "de"
schema:
  locale: str
```

### Add-on vs Docker — Unterschiede im Code

| Aspekt | Add-on | Docker |
|---|---|---|
| **HA URL** | Supervisor API -> automatisch | Env-Variable `HASS_URL` |
| **Auth** | Ingress Header -> kein Token | Long-Lived Token noetig |
| **Base Path** | `/api/hassio_ingress/<id>/` | `/` |
| **Config Pfad** | `/data/` (Addon-Volume) | `./data/` (Docker-Volume) |
| **Erkennung** | `SUPERVISOR_TOKEN` env vorhanden? | Fallback |

Ein einziger `settings.py` erkennt den Modus:

```
if SUPERVISOR_TOKEN exists:
    mode = "addon"
    hass_url = call supervisor API
    base_path = ingress path
else:
    mode = "standalone"
    hass_url = HASS_URL env
    base_path = "/"
```

### CI/CD & Release-Strategie

```
GitHub Repository
    │
    ├─ Push to main
    │   ├─► Test: pytest + vitest + type-check + ruff + eslint
    │   └─► Build: Multi-arch Docker (amd64, arm64, armv7) -> GHCR
    │
    └─ Add-on Repository (separates Repo)
        └─ config.yaml -> verweist auf GHCR Image
```

### Mindestanforderungen

| Plattform | Minimum |
|---|---|
| **HA Version** | 2024.1+ (Areas API, WebSocket v2) |
| **Python** | 3.11+ |
| **Node** | 20+ (nur Build) |
| **Browser** | Chrome 90+, Firefox 90+, Safari 15+ |
| **Hardware** | RPi 4 (2GB RAM) aufwaerts |
| **Docker** | 20.10+ |
