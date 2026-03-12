# Changelog

## 0.2.0

### Added

- Calendar popup with day, week and month views, event details and multi-calendar support
- Calendar card now fetches real events via HA Calendar REST API with countdown to next event
- Favorites system: cards marked as favorite are grouped at the top of the view
- Move cards between sections via new "Section" tab in card editor
- Size preview in card editor shows live card preview when changing size
- Trash card redesigned with waste-type icons and urgency color coding (red/yellow/green)
- CardItem model extended with order, visible, favorite, custom_label, custom_icon, custom_color fields
- Automatic UTF-8 encoding fix for dashboard view names
- Snake_case to camelCase normalization for API data

### Hinzugefuegt

- Kalender-Popup mit Tag-, Wochen- und Monatsansicht, Termindetails und Multi-Kalender-Unterstuetzung
- Kalender-Karte holt jetzt echte Termine ueber HA Calendar REST API mit Countdown zum naechsten Termin
- Favoriten-System: Als Favorit markierte Karten werden oben in der Ansicht gruppiert
- Karten zwischen Sektionen verschieben ueber neuen "Sektion"-Tab im Karten-Editor
- Groessenvorschau im Karten-Editor zeigt Live-Vorschau beim Aendern der Kartengroesse
- Muellabfuhr-Karte ueberarbeitet mit Abfalltyp-Icons und Dringlichkeits-Farbkodierung (rot/gelb/gruen)
- CardItem-Modell erweitert um order, visible, favorite, custom_label, custom_icon, custom_color Felder
- Automatische UTF-8 Encoding-Korrektur fuer Dashboard-Viewnamen
- Snake_case zu camelCase Normalisierung fuer API-Daten

## 0.1.9

### Improved

- Sonos popup shows friendly player name as title instead of "Sonos Gruppe"
- Now-playing info (title + artist) shown prominently at the top
- Each player row is expandable with per-player settings: volume, bass, treble, balance sliders and loudness toggle
- Source selector moved inline next to "Quelle" label
- Player state shows readable labels ("Spielt · TV" instead of "playing")

### Verbessert

- Sonos-Popup zeigt Friendly Name des Players als Titel statt "Sonos Gruppe"
- Wiedergabe-Info (Titel + Kuenstler) prominent oben angezeigt
- Jeder Player aufklappbar mit Einstellungen: Lautstaerke, Bass, Hoehen, Balance und Loudness
- Quellen-Auswahl inline neben "Quelle" Label
- Player-Status zeigt lesbare Labels ("Spielt · TV" statt "playing")

### Fixed

- Entity sort priority always applies (main devices first) regardless of sort direction
- Lights popup and status bar count now hide WLED segments and sub-entities (only show main lights)

### Behoben

- Entity-Sortierung nach Prioritaet greift jetzt immer (Hauptgeraete zuerst), unabhaengig von Sortierrichtung
- Lichter-Popup und StatusBar-Zaehler blenden WLED-Segmente und Sub-Entities aus (nur Hauptlampen)

## 0.1.8

### Fixed

- Strip sections now stack vertically on mobile instead of being squeezed horizontally
- Trash card wizard pre-filters entities by keywords (only shows trash-related sensors, not all)
- Search field added to entity-widget pairing step when many entities are listed

### Changed

- Entity list in wizard sorts main devices (media player, lights, climate) before config entities (bass, balance, loudness)
- CardMetadata extended with `entityKeywords` for smarter entity pre-filtering
- CI: Docker builds now run in parallel (3 jobs instead of sequential)

### Behoben

- Kartenleiste (Strip): Auf Mobilgeraeten werden Karten jetzt vertikal gestapelt statt horizontal gequetscht
- Wizard: Muellabfuhr-Karte zeigt nur noch relevante Entities (statt alle Sensoren inkl. Wetter)
- Wizard: Suchfeld im Entity-Zuordnungs-Schritt bei vielen Entities

### Geaendert

- Entity-Liste im Wizard: Hauptgeraete (Medien, Licht, Klima) werden vor Hilfs-Entities (Bass, Balance, Loudness) sortiert
- CardMetadata um `entityKeywords` erweitert fuer intelligentere Entity-Vorfilterung
- CI: Docker-Builds laufen jetzt parallel (3 Jobs statt sequentiell)

## 0.1.7

### Added

- Card strip sections: new section type displaying cards in a horizontal row with flexible widths (1x/2x/3x weighting)
- Sonos group card: shows all Sonos players, enables grouping/ungrouping, playback control, volume and source selection via popup
- Weight tab in card editor: cards in a strip section can set relative width (1x, 2x, 3x)

### Changed

- Section data model extended with `layout` field ("grid" or "strip")
- CardItem data model extended with `flexWeight` field for strip cards
- DraggableGrid and GridView support strip sections with flexbox layout

### Hinzugefuegt

- Kartenleiste (Strip Section): Neuer Section-Typ, der Karten in einer horizontalen Reihe mit flexiblen Breiten anzeigt (1x/2x/3x Gewichtung)
- Sonos Gruppen-Karte: Zeigt alle Sonos-Player, ermoeglicht Gruppierung/Aufloesen, Wiedergabesteuerung, Lautstaerke und Quellenwahl per Popup
- Gewichtung-Tab im Karten-Editor: Bei Karten in einer Kartenleiste kann die relative Breite (1x, 2x, 3x) eingestellt werden

### Geaendert

- Section-Datenmodell erweitert um `layout` Feld ("grid" oder "strip")
- CardItem-Datenmodell erweitert um `flexWeight` Feld fuer Strip-Karten
- DraggableGrid und GridView unterstuetzen Strip-Sections mit Flexbox-Layout

## 0.1.6

### Fixed

- Add-on: Correct Supervisor WebSocket URL (`ws://supervisor/core/websocket` instead of `/api/websocket`)
- Add-on: Settings auto-detects `SUPERVISOR_TOKEN` and sets correct defaults (URL, data dir)
- Add-on: Logging now shows WebSocket URL and token status for easier debugging

### Behoben

- Add-on: Korrekte Supervisor WebSocket-URL (`ws://supervisor/core/websocket` statt `/api/websocket`)
- Add-on: Settings erkennt `SUPERVISOR_TOKEN` und setzt automatisch die richtigen Defaults (URL, Data-Dir)
- Add-on: Logging zeigt jetzt WebSocket-URL und Token-Status fuer einfacheres Debugging

## 0.1.5

### Fixed

- Add-on mode: HA connection now uses internal Supervisor URL (`http://supervisor/core`) instead of external URL
- Discovery, WebSocket proxy, media proxy and HACS scanner all use Supervisor token correctly in add-on mode
- `run.sh` sets `DAS_HOME_HASS_URL` to internal Supervisor endpoint

### Behoben

- Add-on Modus: HA-Verbindung nutzt jetzt den internen Supervisor-URL (`http://supervisor/core`) statt externen URL
- Discovery, WebSocket-Proxy, Media-Proxy und HACS-Scanner verwenden im Add-on Modus alle den Supervisor-Token korrekt
- `run.sh` setzt `DAS_HOME_HASS_URL` auf den internen Supervisor-Endpoint

## 0.1.4

### Added

- Setup wizard fully in German, with help box for token creation including direct link to HA profile page
- In add-on mode, token is automatically inherited from Supervisor (no manual entry needed)
- Sidebar name is now "DAS Home" with fish icon instead of "das-home"

### Hinzugefuegt

- Setup-Wizard komplett auf Deutsch, mit Hilfe-Box zum Token erstellen inkl. Direkt-Link zur HA-Profilseite
- Im Add-on-Modus wird der Token automatisch vom Supervisor uebernommen (kein manuelles Eingeben noetig)
- Sidebar-Name ist jetzt "DAS Home" mit Fisch-Icon statt "das-home"

## 0.1.3

### Added

- Version info in settings dialog: version, mode (addon/standalone) and link to GitHub releases
- Automatic GitHub release on version bump (`.github/workflows/release.yml`)
- Health endpoint now returns `releases_url` and `mode`

### Hinzugefuegt

- Versionshinweise im Settings-Dialog: Version, Modus (Addon/Standalone) und Link zu GitHub Releases
- Automatischer GitHub Release bei Version-Bump (`.github/workflows/release.yml`)
- Health-Endpoint liefert jetzt `releases_url` und `mode`

## 0.1.2

### Fixed

- Frontend now loads correctly in Docker container (static files path fixed)
- HA Ingress compatibility: asset paths (CSS/JS) and API/WebSocket URLs now use relative paths

### Behoben

- Frontend laedt jetzt korrekt im Docker-Container (Static-Files-Pfad korrigiert)
- HA Ingress-Kompatibilitaet: Asset-Pfade (CSS/JS) und API/WebSocket-URLs nutzen jetzt relative Pfade statt absolute

## 0.1.1

### Fixed

- Static files path in Docker container fixed

### Behoben

- Static-Files-Pfad im Docker-Container korrigiert

## 0.1.0

### Added

- 24 native card types (light, climate, media, sensors, cameras, vacuum, weather, persons, ...)
- Auto-discovery: dashboard automatically generated from all HA entities and areas
- Widget wizard for adding and configuring cards
- Popup system for detail views (light with color control, weather forecast, media player, vehicle status)
- Area views with tab navigation and bottom toolbar
- Custom cards: Area, Pill, Radar, Trash, Vehicle, LightSlider, WeatherIcon
- Dark/light theme toggle
- Drag & drop grid layout with edit mode
- Undo/redo for dashboard changes
- HACS custom card bridge: embed HACS cards directly
- Docker and Home Assistant add-on deployment
- YAML-based configuration persistence
- WebSocket fan-out proxy (one HA connection, N browser clients)
- Card registry system for extensible card types
- GitHub Actions CI/CD with multi-platform Docker builds

### Hinzugefuegt

- 24 native Karten-Typen (Licht, Klima, Medien, Sensoren, Kameras, Vakuum, Wetter, Personen, ...)
- Auto-Discovery: Dashboard wird automatisch aus allen HA-Entities und Areas generiert
- Widget-Wizard zum Hinzufuegen und Konfigurieren von Karten
- Popup-System fuer Detail-Ansichten (Licht mit Farbsteuerung, Wetter-Vorhersage, Medien-Player, Fahrzeug-Status)
- Area-Views mit Tab-Navigation und Bottom-Toolbar
- Custom Cards: Area, Pill, Radar, Trash, Vehicle, LightSlider, WeatherIcon
- Dark/Light Theme-Umschaltung
- Drag & Drop Grid-Layout mit Edit-Modus
- Undo/Redo fuer Dashboard-Aenderungen
- HACS Custom Card Bridge: HACS-Karten direkt einbinden
- Docker und Home Assistant Add-on Deployment
- YAML-basierte Konfigurationspersistenz
- WebSocket Fan-out Proxy (eine HA-Verbindung, N Browser-Clients)
- Card Registry System fuer erweiterbare Karten-Typen
- GitHub Actions CI/CD mit Multi-Plattform Docker Builds
