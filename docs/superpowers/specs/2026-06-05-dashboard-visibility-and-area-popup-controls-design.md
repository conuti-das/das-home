# Design: Dashboard-Sichtbarkeit/Startseite + Raum-Popup Entity-Auswahl

**Datum:** 2026-06-05
**Status:** Freigegeben (Brainstorming abgeschlossen)

Zwei unabhängige, gemeinsam angeforderte Features:
- **A** — das-home für alle HA-Nutzer sichtbar + als Default-Dashboard/Startseite wählbar
- **B** — Raum-Popups: sichtbare Schalter + Lampen kuratieren, mit überarbeitetem, einheitlichem UI

Beide können als getrennte Arbeitspakete umgesetzt werden.

---

## Feature A — Sichtbarkeit für alle + als Startseite

### A1 — Für alle Nutzer sichtbar
- **Änderung:** `das-home/config.yaml` (Add-on-Manifest) → `panel_admin: false`.
- **Effekt:** Alle HA-Nutzer (nicht nur Admins/Installierer) sehen das Ingress-Panel in der Sidebar.
- **Verifikation:** Add-on-Konfig lädt fehlerfrei; Panel erscheint für Nicht-Admin-Nutzer.

### A2 — Als Default-Dashboard/Startseite
HA listet im „Standard-Dashboard"-Dropdown **nur Lovelace-Dashboards**, keine Add-on-Panels. Der native Weg ist ein **„Webpage"-Dashboard**, das die das-home-URL einbettet — das ist ein vollwertiges Dashboard und per „Set as default" für alle Nutzer als Startseite setzbar.

**Add-on-Voraussetzung (Code):**
- Neue, schlanke Response-Header-Middleware im FastAPI-Backend, die `Content-Security-Policy: frame-ancestors 'self' <HA-Origins>` setzt (statt restriktivem `X-Frame-Options`), damit die Einbettung in HA zuverlässig erlaubt ist. Aktuell setzt das Backend keine Frame-Header (nur CORS).

**HA-Konfiguration (einmalig in der Instanz des Nutzers, via HA-Anbindung):**
- „Webpage"-Dashboard anlegen, das die das-home-URL einbettet, sichtbar für alle, als Default gesetzt.
- **URL-Strategie:** primär die Ingress-Panel-URL; **Fallback** auf die direkte Add-on-Port-URL, falls iframe-Einbettung an HA-internen Headern scheitert.

**Risiko / Verifikation:** iframe-Einbettung muss **live verifiziert** werden (lädt das-home im Webpage-Dashboard?), bevor „fertig" gemeldet wird. Bei Bedarf URL-Strategie wechseln.

---

## Feature B — Raum-Popup: Schalter + Lampen kuratieren

### Scope
- `AreaPopupV2` (Karten-Typ `area_v2`, Tab-Layout) **und** `AreaPopup` (`area`/`area_small`, Sektions-Layout). Beide bekommen die gemischte Schalter/Lampen-Liste + Editor.

### Datenmodell (in Card-config, pro Raum-Karte)
- `popup_hidden_entities: string[]` — ausgeblendete (sonst automatisch sichtbare) Raum-Entities.
- `popup_extra_entities: string[]` — zusätzlich eingeblendete Entities (auch aus anderen Räumen).
- Backend-Pydantic-Modell `CardItem.config` ist ein freies `dict` → keine Schema-Migration nötig.

### Entity-Auflösung (testbarer Helper)
```
resolveAreaEntities(areaEntities, config) ->
  sichtbar = (Raum-Lampen[light.*] + Raum-Schalter[switch.*] − hidden) + extra
```
- Reihenfolge stabil: zuerst Raum-Lampen, dann Raum-Schalter, dann extra (in Hinzufüge-Reihenfolge).
- `isMainLight`-Filter (WLED-Segmente etc.) bleibt erhalten; analoger Filter für Schalter.

### UI-Design (Design-Review-Ergebnis, „My Smart Home"-orientiert)
**Geteilte Pill-Form für Lampen + Schalter** (eine wiederverwendbare Komponente `ControlTile`):
- Höhe **58px**, Rundung **14px**, Icon im Kreis (links), Name, gemischt in **einer** Liste (Grid 1–2 Spalten, kurze Namen nebeneinander).
- **Lampe:** amber (`--dh-yellow`) Helligkeits-**Slider-Fill** (drag) + %-Wert. Bestehende `LightSliderCard` wird auf den schlankeren/runderen Stil (58px/14px, Icon-Kreis) angepasst — kein separater Look mehr.
- **Schalter:** *dieselbe* Pill — an = **voll** in Akzentfarbe (`--dh-blue`) gefüllt + **iOS-Toggle** rechts; aus = neutral (`--dh-gray300`). Tap toggelt.
- Konsistente Zustände: „an" akzentuiert/gefüllt, „aus" neutral; unavailable gedimmt (analog `muted`).

**Editor-Modus:**
- Zahnrad/„Bearbeiten" im Popup-Header schaltet den Editor an.
- Wiederverwendbare `EntityPickerList`: alle Raum-Lampen/-Schalter mit **👁 Sichtbar/Aus**-Toggle; ausgeblendete gedimmt; **„➕ Entity hinzufügen"** öffnet Suche über alle `light.*`/`switch.*` der Instanz (für `extra`).
- „Fertig" schließt den Editor.

### Persistenz / Datenfluss
- Popup-Öffnung erweitern: `AreaCardV2`/`AreaCard`/`AreaCardSmall` übergeben zusätzlich `cardId` (`card.id`) an das Popup-`props`.
- Neue Store-Methode `updateCardConfigById(cardId, configPatch)` im `dashboardStore` — findet die Karte ID-basiert über alle Sektionen (Card-IDs sind seit dem Dedup-Fix eindeutig) und merged in `config`.
- Editor schreibt `popup_hidden_entities` / `popup_extra_entities` zurück → persistiert via bestehendes `PUT /api/dashboard`.

### Komponenten (Isolation)
- `ControlTile` — eine Pill, rendert Lampe (Helligkeits-Slider) ODER Schalter (Toggle) je nach Domain. Übernimmt die Slider-Logik (Pointer/Optimistic) aus `LightSliderCard` und ersetzt diese im Popup-Kontext (LightSliderCard wird auf ControlTile umgestellt oder zum dünnen Wrapper).
- `resolveAreaEntities(areaEntities, config)` — reine Funktion, unit-testbar.
- `EntityPickerList` — Editor-Liste, von beiden Popups genutzt.
- `updateCardConfigById` — Store-Action.

---

## Testing
- **Unit:** `resolveAreaEntities` (hidden/extra/leer/Domain-Filter), `updateCardConfigById` (ID-Lookup, Merge).
- **Component (Vitest):** `ControlTile` rendert Lampe vs. Schalter; an/aus/unavailable.
- **Live (Browser):** beide Popups — gemischte Liste, Slider, Toggle, Editor (ausblenden + hinzufügen → Persistenz nach Reload). Feature A: das-home lädt im Webpage-Dashboard.

## Offene Punkte / Risiken
- A2: iframe-Einbettbarkeit der Ingress-URL (live verifizieren, Fallback Port-URL).
- B: `AreaPopup` (V1) hat anderes Layout (Sektionen statt Tabs) — die gemischte Liste + Editor müssen in beide passen; `ControlTile`/`EntityPickerList` als gemeinsame Bausteine halten den Aufwand klein.
