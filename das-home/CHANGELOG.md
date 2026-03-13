# Changelog

## 0.3.5

### Fixed

- Legacy badge config migration: existing dashboards with old string-based badge lists no longer crash on load
- Discovery route now uses default BadgeConfig objects instead of plain strings

### Behoben

- Legacy-Badge-Config-Migration: bestehende Dashboards mit altem String-Format fuer Badges stuerzen nicht mehr ab
- Discovery-Route nutzt jetzt Standard-BadgeConfig-Objekte statt einfacher Strings

## 0.3.4

### Added

- Badge editor popup: configure StatusBar badges in edit mode (reorder, enable/disable, weather count)
- Camera entity selector in Area Card V2 editor (background source "Kamera")
- Configurable weather badge count (1-6 hourly, 1-5 daily)
- All StatusBar badges now config-driven with persistent order and visibility

### Hinzugefuegt

- Badge-Editor-Popup: StatusBar-Badges im Edit-Modus konfigurieren (Reihenfolge, ein/ausschalten, Wetter-Anzahl)
- Kamera-Entity-Auswahl im Bereichskarte V2 Editor (Hintergrund-Quelle "Kamera")
- Konfigurierbare Wetter-Badge-Anzahl (1-6 stuendlich, 1-5 taeglich)
- Alle StatusBar-Badges jetzt konfigurationsgesteuert mit persistenter Reihenfolge und Sichtbarkeit

## 0.3.3

### Added

- Camera background source for Area Card V2: show live camera image as card background
- Volume +/- buttons in area popup media player widget
- Media player summary badge in status bar: shows "X spielen" when multiple players are active
- UI5 outline icons in Area Card V2 buttons (lightbulb, media-play, activate) instead of emojis

### Fixed

- Weather cards now fill equal height in strip rows
- Area popup light list no longer shows WLED segments and sub-entities

### Hinzugefuegt

- Kamera-Hintergrund fuer Bereichskarte V2: zeigt Live-Kamerabild als Kartenhintergrund
- Lautstaerke +/- Buttons im Bereichs-Popup Media-Player-Widget
- Media-Player Sammel-Badge in der Statusleiste: zeigt "X spielen" wenn mehrere Player aktiv sind
- UI5 Outline-Icons in Bereichskarte V2 Buttons (Gluehbirne, Play, Aktivieren) statt Emojis

### Behoben

- Wetterkarten fuellen jetzt gleiche Hoehe in Strip-Zeilen
- Bereichs-Popup Lichtliste zeigt keine WLED-Segmente und Sub-Entities mehr

## 0.3.2

### Fixed

- Equal card heights in grid rows: all cards in the same row now stretch to match

### Behoben

- Gleiche Kartenhoehen in Grid-Zeilen: alle Karten in einer Zeile haben jetzt dieselbe Hoehe

## 0.3.1

### Fixed

- Card edit popup crash (black screen) caused by infinite render loop with React 19 useSyncExternalStore
- Weather forecast data not loading: backend now properly handles HA subscription-based forecast API
- Weather forecast race condition: waits for entity store before fetching forecast data

### Behoben

- Karten-Editor-Absturz (schwarzer Bildschirm) durch Endlos-Render-Schleife mit React 19 useSyncExternalStore
- Wettervorhersagedaten wurden nicht geladen: Backend verarbeitet jetzt korrekt die HA Subscription-basierte Forecast-API
- Wettervorhersage-Race-Condition: wartet auf Entity-Store bevor Vorhersagedaten abgerufen werden

## 0.3.0

### Added

- Area Card V2: rich area card with temperature, light/media/special entity buttons, background image (area picture, custom URL, or media artwork)
- Weather Badges: hourly and daily forecast badges in the status bar with animated weather icons
- Weather Popup V2: detailed weather popup with current conditions, hourly scroll strip, and 3-day forecast cards
- Area Popup V2: area detail popup with text overview, scene shortcuts, media player controls, and tabbed entity controls (Licht/Rollos/Klima)
- Weather forecast hook (`useWeatherForecast`) for shared forecast data across components
- Area V2 config fields in card editor (area, temperature sensor, light, special entity, media player, background source)

### Fixed

- Equal card heights in grid rows

### Hinzugefuegt

- Bereich-Karte V2: reichhaltige Bereichskarte mit Temperatur, Licht/Media/Spezial-Buttons, Hintergrundbild (Bereichsbild, eigene URL oder Media-Artwork)
- Wetter-Badges: stuendliche und taegliche Vorhersage-Badges in der Statusleiste mit animierten Wettersymbolen
- Wetter-Popup V2: detailliertes Wetter-Popup mit aktuellen Bedingungen, stuendlicher Scroll-Leiste und 3-Tage-Vorhersage
- Bereich-Popup V2: Bereich-Detail-Popup mit Textuebersicht, Szenen-Schnellzugriff, Media-Player-Steuerung und Tabs fuer Licht/Rollos/Klima
- Wettervorhersage-Hook (`useWeatherForecast`) fuer gemeinsame Vorhersagedaten
- Bereich-V2-Konfigurationsfelder im Karten-Editor (Bereich, Temperatursensor, Licht, Spezial-Entity, Media Player, Hintergrundquelle)

### Behoben

- Gleiche Kartenhoehen in Grid-Zeilen

## 0.2.3

### Fixed

- HA Ingress iframe caching: auto-reloads when version changes on visibility (fixes stale dashboard after updates)
- Added no-cache meta tags to index.html for aggressive cache prevention

### Behoben

- HA Ingress iframe Caching: automatischer Reload bei Versionswechsel wenn Seite sichtbar wird (behebt veraltetes Dashboard nach Updates)
- No-Cache Meta-Tags in index.html fuer aggressive Cache-Verhinderung

## 0.2.2

### Added

- "Set as homepage" button in Settings: registers DAS Home as default panel in HA via WebSocket API
- Panel info endpoint to detect the add-on's ingress panel name

### Hinzugefuegt

- "Als Startseite setzen" Button in den Einstellungen: registriert DAS Home als Standard-Panel in HA ueber WebSocket API
- Panel-Info-Endpoint zur Erkennung des Add-on Ingress Panel-Namens

## 0.2.1

### Added

- Update banner: shows notification when dashboard was generated with an older version, with one-click regeneration
- Dashboard tracks `generated_with_version` to detect outdated configs after updates
- No-cache headers for index.html to prevent stale content in HA Ingress iframe

### Hinzugefuegt

- Update-Banner: zeigt Hinweis wenn Dashboard mit aelterer Version erstellt wurde, mit Ein-Klick-Neugenerierung
- Dashboard speichert `generated_with_version` um veraltete Konfigurationen nach Updates zu erkennen
- No-Cache-Header fuer index.html verhindert veralteten Inhalt im HA Ingress-iframe

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
