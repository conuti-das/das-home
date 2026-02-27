# das-home Dokumentation

## Uebersicht

das-home ist ein alternatives Dashboard fuer Home Assistant, gebaut mit SAP UI5 Web Components. Es bietet Auto-Discovery, einen Widget-Wizard und ueber 24 Karten-Typen.

## Erste Schritte

Nach der Installation erscheint **das-home** in der HA-Seitenleiste. Beim ersten Start wird automatisch ein Dashboard aus den vorhandenen HA-Entities generiert.

## Konfiguration

| Option | Typ | Standard | Beschreibung |
|--------|-----|----------|-------------|
| `debug` | bool | `false` | Debug-Logging aktivieren |

## Karten-Typen

Das Dashboard unterstuetzt folgende Entity-Typen automatisch:

- **Licht** - Ein/Aus, Helligkeit, Farbtemperatur, RGB
- **Klima** - Temperatur, Modus, Luefter-Stufe
- **Medien** - Play/Pause, Lautstaerke, Quellen-Auswahl, Browse
- **Sensor** - Numerische Werte mit Einheiten
- **Binary Sensor** - An/Aus Status
- **Schalter** - Toggle
- **Cover** - Auf/Ab/Stop mit Position
- **Luefter** - Geschwindigkeit, Oszillation
- **Vakuum** - Start/Stop, Batterie, Bereich
- **Wetter** - Aktuell + Vorhersage
- **Person** - Standort, Zone
- **Kamera** - Live-Stream
- **Kalender** - Naechste Termine
- **Alarm** - Arm/Disarm Modi
- **Schloss** - Auf/Zu
- **Timer** - Countdown
- **Update** - Verfuegbare Updates
- **Button/Scene/Script/Automation** - Ausloeser

## Custom Cards

Zusaetzlich gibt es spezialisierte Karten:

- **Area Card** - Bereich-Uebersicht mit Status-Zusammenfassung
- **Pill Card** - Kompakte Status-Anzeige
- **Radar Card** - Regenradar
- **Trash Card** - Muellabfuhr-Kalender
- **Vehicle Card** - Fahrzeug-Status
- **Light Slider Card** - Licht-Steuerung mit Slider

## Edit-Modus

Im Edit-Modus koennen Karten hinzugefuegt, verschoben und konfiguriert werden:

1. Edit-Modus ueber das Stift-Icon in der Toolbar aktivieren
2. Karten per Drag & Drop verschieben
3. Widget-Wizard zum Hinzufuegen neuer Karten
4. Aenderungen werden automatisch gespeichert

## Troubleshooting

### Dashboard bleibt leer
- Pruefen ob die HA-Verbindung steht (Connection-Status in der StatusBar)
- Auto-Discovery erneut ausloesen ueber Settings

### Karten zeigen "unavailable"
- Entity existiert in HA, ist aber offline oder nicht erreichbar
- HA-Logs pruefen

### Add-on startet nicht
- Supervisor-Logs pruefen: Settings > System > Logs > Supervisor
- Debug-Modus in der Add-on Konfiguration aktivieren
