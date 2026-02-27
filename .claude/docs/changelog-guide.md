# Changelog-Guide

Bei **jedem abgeschlossenen Feature/Bugfix** MUSS ein Changelog-Eintrag erstellt oder aktualisiert werden.

## Dateistruktur
```
docs/changelog/
  YYYY-MM-DD.md               # Ein Eintrag pro Tag
```

## Kategorien
- `## Hinzugefuegt` - Neue Features
- `## Geaendert` - Aenderungen an bestehender Funktionalitaet
- `## Behoben` - Fehlerbehebungen
- `## Entfernt` - Entfernte Features
- `## Sicherheit` - Sicherheitsupdates

## Zielgruppen-Tags
- `**[Benutzer]**` - Endanwender (UI, Dashboard, Cards)
- `**[Admin]**` - Administratoren (Config, Docker, Add-on)
- `**[Entwickler]**` - Entwickler (API, Refactoring, Build)

## Beispiel

```markdown
# Changelog 2026-02-27

## Hinzugefuegt

- **[Benutzer]** **Vehicle Card** - Neue Karte fuer Fahrzeug-Entities mit Tankfuellstand und Kilometerstand

  Zeigt den aktuellen Status des Fahrzeugs als kompakte Kachel mit Icon und Fortschrittsbalken.

- **[Entwickler]** Media-Proxy Endpoint fuer HA-Medieninhalte (`/api/media/`)

## Behoben

- **[Benutzer]** Weather-Popup zeigt jetzt korrekte Temperatur-Einheit
- **[Admin]** Docker-Build fehlte static files Pfad
```

## Regeln

1. Pro Tag eine Datei: `docs/changelog/YYYY-MM-DD.md`
2. Deutsch schreiben
3. Benutzer-Perspektive zuerst, dann Admin, dann Entwickler
4. Benutzer-Features ausfuehrlich beschreiben (1-2 Saetze)
5. Feature-Namen **fett** markieren
6. Keine leeren Kategorien (nur Kategorien mit Eintraegen auflisten)
7. Changelog-Eintrag gehoert mit in den Commit
