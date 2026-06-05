# Changelog

## 0.7.1

### Fixed

- Room popup overview no longer shows "NaN°" when the area's temperature sensor is unavailable. Both AreaPopupV2 and AreaPopup now use `numericState` and simply omit an offline sensor instead of rendering `NaN`/"unavailable°".

### Behoben

- Die Übersicht im Raum-Popup zeigt kein "NaN°" mehr, wenn der Temperatursensor des Bereichs nicht verfügbar ist. AreaPopupV2 und AreaPopup nutzen jetzt `numericState` und lassen einen Offline-Sensor einfach weg, statt `NaN`/"unverfügbar°" anzuzeigen.

## 0.7.0

### Added

- das-home can now be embedded as a Home Assistant Webpage dashboard (e.g. set as your default start page). A new CSP `frame-ancestors` middleware allows iframing from local HA and Nabu Casa remote, replacing the `X-Frame-Options` that would have blocked it.
- Sidebar entry now hidden from non-admin users by default (`panel_admin: false`), so guests only see the dashboard tile and not the add-on settings.
- Room popups (AreaPopupV2) now show a mixed list of lights and switches as compact 58px control "pills" via the new `ControlTile` component — lights get an amber brightness slider with %, switches and `input_boolean` get an iOS-style toggle. Unavailable entities are dimmed.
- Entity picker editor (`EntityPickerList`) inside the room popup lets you hide auto-discovered controls and add foreign-area entities. Choices persist per card (`hidden` / `extra` lists in card config).
- New `resolveAreaEntities` utility centralises how a room card derives its lights/switches/sensors from area assignments and overrides, with full test coverage.

### Fixed

- Tapping a light tile now toggles via the matching domain service (`light.turn_on/off`, `switch.turn_on/off`, `input_boolean.toggle`) instead of guessing.

### Hinzugefuegt

- das-home laesst sich jetzt als Home-Assistant-Webseiten-Dashboard einbetten (z. B. als Standard-Startseite). Eine neue CSP-`frame-ancestors`-Middleware erlaubt das iFrame-Einbetten aus lokalem HA und Nabu Casa Remote — ersetzt das vorherige `X-Frame-Options`, das das blockiert haette.
- Seitenleisten-Eintrag ist fuer Nicht-Admins jetzt standardmaessig ausgeblendet (`panel_admin: false`), sodass Gaeste nur die Dashboard-Kachel sehen und nicht die Add-on-Einstellungen.
- Raum-Popups (AreaPopupV2) zeigen jetzt eine gemischte Liste aus Lampen und Schaltern als kompakte 58-px-„Pill"-Steuerungen ueber die neue `ControlTile`-Komponente — Lampen bekommen einen amberfarbenen Helligkeits-Slider mit %, Schalter und `input_boolean` einen iOS-Toggle. Nicht verfuegbare Entities werden gedimmt.
- Entity-Picker-Editor (`EntityPickerList`) im Raum-Popup erlaubt es, automatisch erkannte Steuerungen auszublenden und raumfremde Entities hinzuzufuegen. Auswahl wird pro Karte persistiert (`hidden` / `extra` in der Karten-Config).
- Neues `resolveAreaEntities`-Util buendelt zentral, wie eine Raum-Karte ihre Lampen/Schalter/Sensoren aus Bereichszuordnungen und Overrides ableitet — mit voller Testabdeckung.

### Behoben

- Ein Tipp auf eine Lampen-Kachel toggelt jetzt ueber den passenden Domain-Service (`light.turn_on/off`, `switch.turn_on/off`, `input_boolean.toggle`) statt zu raten.

## 0.6.0

### Added

- Sensor sparklines: numeric sensor cards now show a 24-hour history mini-graph under the value, backed by a new `/api/history` endpoint (HA `history_during_period`, 5-minute cache). Inspired by the popular mini-graph-card.
- Climate detail popup: tapping a climate card now opens a control popup with current/target temperature (± stepping) and HVAC mode buttons, instead of doing nothing.
- device_class-based sensor selection in area cards: temperature/humidity slots prefer a real `device_class` match with a numeric reading before falling back to an entity_id name match, avoiding wrong or unavailable sensors.

### Fixed

- `/api/discovery` returned 500 after a ~9s hang on large HA instances; the WebSocket proxy now uses `max_size=None`, so large state payloads (1148 entities) load correctly.
- AreaCardV2 showed "NaN°" for temperature; now uses a proper numeric-state check.
- Duplicate React keys (cards sharing an id) caused cards to be dropped or duplicated; card IDs are now deduplicated deterministically on load.
- Sensor cards appended units to unavailable values ("unavailable°C"); a central state formatter now suppresses the unit when offline.
- Sensor cards rendered raw ISO timestamps; these are now formatted by device_class.
- Media player and special cards showed the raw `entity_id` when offline; they now use the friendly name.
- Invalid UI5 icon "shower" replaced with "blur".
- `/api/media/artwork` returned 500 on camera upstream errors; now degrades to a graceful 404.
- Climate card showed the raw "unavailable" state; now shows "—".
- German weather conditions had missing umlauts ("Bewolkt" → "Bewölkt").

### Changed

- Unavailable/offline cards are now visually dimmed so offline entities are recognizable at a glance.

### Hinzugefuegt

- Sensor-Sparklines: Numerische Sensor-Karten zeigen jetzt einen 24-Stunden-Verlauf als Mini-Graph unter dem Wert, gespeist von einem neuen `/api/history`-Endpoint (HA `history_during_period`, 5-Minuten-Cache). Inspiriert von der beliebten mini-graph-card.
- Klima-Detail-Popup: Ein Tipp auf eine Klima-Karte oeffnet jetzt ein Steuerungs-Popup mit Ist-/Soll-Temperatur (± Schritte) und HVAC-Modus-Buttons, statt nichts zu tun.
- device_class-basierte Sensor-Auswahl in Bereichs-Karten: Temperatur-/Feuchte-Slots bevorzugen einen echten `device_class`-Treffer mit numerischem Wert, bevor sie auf eine entity_id-Namenssuche zurueckfallen. Vermeidet falsche oder nicht verfuegbare Sensoren.

### Behoben

- `/api/discovery` lieferte nach ~9s Haengen einen 500-Fehler auf grossen HA-Instanzen; der WebSocket-Proxy nutzt jetzt `max_size=None`, sodass grosse State-Payloads (1148 Entities) korrekt laden.
- AreaCardV2 zeigte "NaN°" fuer die Temperatur; nutzt jetzt eine korrekte numerische State-Pruefung.
- Doppelte React-Keys (Karten mit gleicher ID) fuehrten zu verschwundenen oder duplizierten Karten; Karten-IDs werden jetzt beim Laden deterministisch dedupliziert.
- Sensor-Karten haengten Einheiten an nicht verfuegbare Werte an ("unavailable°C"); ein zentraler State-Formatter unterdrueckt die Einheit jetzt im Offline-Zustand.
- Sensor-Karten zeigten rohe ISO-Zeitstempel; diese werden jetzt nach device_class formatiert.
- Media-Player- und Spezial-Karten zeigten im Offline-Zustand die rohe `entity_id`; jetzt den Anzeigenamen.
- Ungueltiges UI5-Icon "shower" durch "blur" ersetzt.
- `/api/media/artwork` lieferte bei Kamera-Upstream-Fehlern einen 500; degradiert jetzt zu einem sauberen 404.
- Klima-Karte zeigte den rohen "unavailable"-Status; zeigt jetzt "—".
- Deutsche Wetter-Bedingungen hatten fehlende Umlaute ("Bewolkt" → "Bewölkt").

### Geaendert

- Nicht verfuegbare/Offline-Karten werden jetzt visuell gedimmt, sodass Offline-Entities auf einen Blick erkennbar sind.

## 0.5.0

### Added

- Mobile single-column layout: on phones (under 600px) the dashboard stacks every card into one full-width column instead of a cramped two-column grid. Works in both the normal view and edit mode, with favorite cards sorted to the top. Saved desktop grid positions are ignored on mobile and left untouched, so the desktop layout is unaffected. A new `useMediaQuery` hook drives the breakpoint.

### Changed

- On phones, per-card drag, resize, and the size badge are hidden (they conflict with vertical scrolling and are meaningless in a single column). The favorite / edit / hide / delete controls stay available.

### Hinzugefuegt

- Mobile einspaltige Ansicht: Auf Smartphones (unter 600px) stapelt das Dashboard jede Karte in einer vollbreiten Spalte statt eines gequetschten Zwei-Spalten-Rasters. Funktioniert im Normal- und im Bearbeitungsmodus, Favoriten-Karten werden nach oben sortiert. Gespeicherte Desktop-Rasterpositionen werden auf Mobilgeraeten ignoriert und bleiben unveraendert, das Desktop-Layout ist nicht betroffen. Ein neuer `useMediaQuery`-Hook steuert den Breakpoint.

### Geaendert

- Auf Smartphones sind Karten-Drag, -Resize und das Groessen-Badge ausgeblendet (sie stoeren das vertikale Scrollen und ergeben in einer Einzelspalte keinen Sinn). Die Favorit-/Bearbeiten-/Ausblenden-/Loeschen-Steuerung bleibt verfuegbar.

## 0.4.2

### Added

- AreaCardV2 now auto-discovers entities from the configured `area_id` when explicit per-slot configs are missing. Picks the first matching `sensor.*temperature*`, `light.*`, `media_player.*`, and special device (vacuum / washer / dryer / dishwasher) in the area. Explicit configs still win as overrides.

### Changed

- Grid gap increased from 12px to 16px (`--dh-grid-gap`) for clearer visual separation between cards on dark backgrounds.
- Minimum grid row height raised from 120px to 140px (`grid-auto-rows`). Reduces height-mismatch between rich cards (group lights with settings gear) and simple cards (single light toggles) in the same section.

### Hinzugefuegt

- AreaCardV2 erkennt jetzt Entities automatisch ueber die `area_id`, wenn die expliziten Pro-Slot-Configs fehlen. Waehlt die erste passende `sensor.*temperature*`, `light.*`, `media_player.*` und Spezial-Geraet (Saugroboter / Waschmaschine / Trockner / Spuelmaschine) der Area. Explizite Configs gewinnen weiterhin als Override.

### Geaendert

- Grid-Abstand von 12px auf 16px erhoeht (`--dh-grid-gap`) fuer bessere visuelle Trennung zwischen Karten auf dunklem Hintergrund.
- Minimale Grid-Zeilen-Hoehe von 120px auf 140px erhoeht (`grid-auto-rows`). Reduziert Hoehen-Mismatch zwischen reichhaltigen Karten (Gruppen-Lichter mit Settings-Zahnrad) und einfachen Karten (einzelne Licht-Toggles) in derselben Sektion.

## 0.4.1

### Fixed

- Card wizard now supports adding cards that don't require entity assignment (`home_ops_briefing`, `iframe`, `markdown`, `radar`, `area`, `area_small`, `area_v2`, `hacs`). Previously the "Zuordnung" step rendered blank with no "Next" button because no pairings were initialized for cards with empty `compatibleDomains`. Wizard now shows a clear "no entity required" panel with a working Weiter button for these card types.

### Behoben

- Karten-Wizard unterstuetzt jetzt das Hinzufuegen von Karten, die keine Entity-Zuordnung benoetigen (`home_ops_briefing`, `iframe`, `markdown`, `radar`, `area`, `area_small`, `area_v2`, `hacs`). Bisher war der "Zuordnung"-Step leer ohne "Weiter"-Button, weil fuer Karten mit leerer `compatibleDomains`-Liste keine Pairings erzeugt wurden. Wizard zeigt jetzt einen klaren "Keine Entity-Zuordnung noetig"-Panel mit funktionierendem Weiter-Button fuer diese Kartentypen.

## 0.4.0

### Added

- Home Operations Briefing card: new card type `home_ops_briefing` with 4 KPI tiles (energy cost today, occupancy hours, device uptime, anomaly count), 7-day trend chart with year-over-year overlay, and daily anomalies list
- `/api/insights` endpoint with HA `recorder/statistics_during_period` integration, 5-minute TTL cache, and auto-discovery of relevant sensors by `device_class`
- Day-of-week anomaly detection for climate sensors, energy/power sensors, and occupancy/motion/door/window binary sensors
- Frontend test infrastructure: Vitest + @testing-library/react for unit tests, Playwright for end-to-end coverage (`pnpm test`, `pnpm e2e`)
- Version string now read from `das-home/config.yaml` at startup — backend no longer needs a second manual version sync

### Changed

- `historyStore` renamed to `undoStore` to avoid confusion with Home Assistant entity history work
- Tremor React charting library added as a runtime dependency (lazy-loaded — only pulled in when the Briefing card is used)

### Hinzugefuegt

- Home Operations Briefing Karte: neuer Kartentyp `home_ops_briefing` mit 4 KPI-Kacheln (Energiekosten heute, Anwesenheitsstunden, Geraete-Verfuegbarkeit, Anomalie-Anzahl), 7-Tage-Trend-Chart mit Vorjahresvergleich und taeglicher Anomalie-Liste
- `/api/insights` Endpoint mit HA `recorder/statistics_during_period` Integration, 5-Minuten TTL-Cache und automatischer Sensor-Erkennung ueber `device_class`
- Wochentags-basierte Anomalie-Erkennung fuer Klimasensoren, Energie-/Leistungssensoren sowie Anwesenheits-/Bewegungs-/Tuer-/Fenster-Sensoren
- Frontend-Test-Infrastruktur: Vitest + @testing-library/react fuer Unit-Tests, Playwright fuer End-to-End-Tests (`pnpm test`, `pnpm e2e`)
- Versions-String wird beim Start aus `das-home/config.yaml` gelesen — Backend benoetigt keine zweite manuelle Versions-Synchronisation mehr

### Geaendert

- `historyStore` umbenannt in `undoStore`, um Verwechslung mit Home Assistant Entity-Historie zu vermeiden
- Tremor React Charting-Library als Laufzeit-Dependency hinzugefuegt (lazy-geladen — wird nur geladen wenn die Briefing-Karte verwendet wird)

### Merged

- Includes the v0.3.10 light slider scroll fix (popup slider no longer intercepts vertical scroll)

## 0.3.10

### Fixed

- Light slider in popup no longer intercepts vertical scroll — sliding only activates on horizontal finger movement

### Behoben

- Helligkeitsregler im Lichter-Popup unterbricht nicht mehr das vertikale Scrollen — Slider reagiert nur noch auf horizontale Fingerbewegung

## 0.3.9

### Changed

- Update banner only appears when regeneration is actually beneficial (new card types/discovery), not for every version bump
- Dismissing the banner persists — it won't reappear until a new regen-worthy release
- "Aktualisieren" now merges new entities into existing dashboard instead of replacing it — preserves card arrangement, order, sizing, badges, and theme
- Banner text clarified: "Deine Anordnung bleibt erhalten"

### Geaendert

- Update-Banner erscheint nur noch wenn Neugenerierung sinnvoll ist (neue Karten-Typen), nicht bei jedem Versions-Update
- Wegklicken des Banners wird gespeichert — erscheint nicht erneut bis zum naechsten relevanten Release
- "Aktualisieren" fuegt neue Entities ins bestehende Dashboard ein statt alles zurueckzusetzen — Anordnung, Reihenfolge, Badges und Theme bleiben erhalten
- Banner-Text angepasst: "Deine Anordnung bleibt erhalten"

## 0.3.8

### Changed

- Weather popup now shows 12 hours and 7 days forecast (was 5h / 3d)
- Daily forecast shows high/low temperatures (e.g. "14° / 6°")
- Daily forecast labels: "Heute", "Morgen", then weekday names
- Grid gap between cards increased from 8px to 12px for better visual spacing

### Geaendert

- Wetter-Popup zeigt jetzt 12 Stunden und 7 Tage Vorhersage (vorher 5h / 3d)
- Tagesvorhersage zeigt Hoch/Tief-Temperaturen (z.B. "14° / 6°")
- Tagesvorhersage-Labels: "Heute", "Morgen", dann Wochentage
- Abstand zwischen Karten von 8px auf 12px erhoeht fuer bessere Uebersicht

## 0.3.7

### Fixed

- Trash badge now shows next pickup type name (e.g. "6 Restmüll" instead of "6d Müll")
- Finds nearest pickup from all trash sensors (Restmüll, Papiertonne, Gelbe Tonne)

### Behoben

- Muell-Badge zeigt jetzt den Namen der naechsten Abholung (z.B. "6 Restmüll" statt "6d Müll")
- Findet den naechsten Abholtermin aus allen Muell-Sensoren (Restmuell, Papiertonne, Gelbe Tonne)

## 0.3.6

### Fixed

- Trash badge now works with date-based sensors (dd.mm.yyyy), text states ("in X days"), and numeric states
- Trash sensor detection expanded to match restmull, tonne, mullabfuhr entity IDs

### Behoben

- Muell-Badge funktioniert jetzt mit datumsbasierten Sensoren (dd.mm.yyyy), Text-States ("in X days") und numerischen States
- Muell-Sensor-Erkennung erweitert fuer restmull, tonne, mullabfuhr Entity-IDs

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
