# Changelog

## 0.1.1

### Behoben

- **[Admin]** Frontend laedt jetzt korrekt im Docker-Container (Static-Files-Pfad korrigiert)

## 0.1.0

### Hinzugefuegt

- **[Benutzer]** 24 native Karten-Typen (Licht, Klima, Medien, Sensoren, Kameras, Vakuum, Wetter, Personen, ...)
- **[Benutzer]** Auto-Discovery: Dashboard wird automatisch aus allen HA-Entities und Areas generiert
- **[Benutzer]** Widget-Wizard zum Hinzufuegen und Konfigurieren von Karten
- **[Benutzer]** Popup-System fuer Detail-Ansichten (Licht mit Farbsteuerung, Wetter-Vorhersage, Medien-Player, Fahrzeug-Status)
- **[Benutzer]** Area-Views mit Tab-Navigation und Bottom-Toolbar
- **[Benutzer]** Custom Cards: Area, Pill, Radar, Trash, Vehicle, LightSlider, WeatherIcon
- **[Benutzer]** Dark/Light Theme-Umschaltung
- **[Benutzer]** Drag & Drop Grid-Layout mit Edit-Modus
- **[Benutzer]** Undo/Redo fuer Dashboard-Aenderungen
- **[Admin]** HACS Custom Card Bridge: HACS-Karten direkt einbinden
- **[Admin]** Docker und Home Assistant Add-on Deployment
- **[Admin]** YAML-basierte Konfigurationspersistenz
- **[Entwickler]** WebSocket Fan-out Proxy (eine HA-Verbindung, N Browser-Clients)
- **[Entwickler]** Card Registry System fuer erweiterbare Karten-Typen
- **[Entwickler]** GitHub Actions CI/CD mit Multi-Plattform Docker Builds
