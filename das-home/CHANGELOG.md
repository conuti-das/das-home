# Changelog

## 0.1.4

### Hinzugefuegt

- **[Benutzer]** Setup-Wizard komplett auf Deutsch, mit Hilfe-Box zum Token erstellen inkl. Direkt-Link zur HA-Profilseite
- **[Benutzer]** Im Add-on-Modus wird der Token automatisch vom Supervisor uebernommen (kein manuelles Eingeben noetig)
- **[Benutzer]** Sidebar-Name ist jetzt "DAS Home" mit Fisch-Icon statt "das-home"

## 0.1.3

### Hinzugefuegt

- **[Benutzer]** Versionshinweise im Settings-Dialog: Version, Modus (Addon/Standalone) und Link zu GitHub Releases
- **[Entwickler]** Automatischer GitHub Release bei Version-Bump (`.github/workflows/release.yml`)
- **[Entwickler]** Health-Endpoint liefert jetzt `releases_url` und `mode`

## 0.1.2

### Behoben

- **[Admin]** Frontend laedt jetzt korrekt im Docker-Container (Static-Files-Pfad korrigiert)
- **[Admin]** HA Ingress-Kompatibilitaet: Asset-Pfade (CSS/JS) und API/WebSocket-URLs nutzen jetzt relative Pfade statt absolute

## 0.1.1

### Behoben

- **[Admin]** Static-Files-Pfad im Docker-Container korrigiert

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
