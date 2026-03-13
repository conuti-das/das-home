# Area Card V2, Weather Badges & Popups

**Date:** 2026-03-13
**Status:** Approved

## Overview

Four interconnected features that enhance the das-home dashboard with rich area cards, weather forecast badges in the header, a detailed weather popup, and a redesigned area popup with text overview, scenes, media, and light controls.

---

## Feature 1: Area Card V2 (`area_v2`)

### Card Type
- New card type `area_v2` registered in `CardRegistry.ts`
- Category: `"komplex"`
- Default size: `1x1`
- Free placement in the normal grid (no special layout coupling with radar)

### Visual Design
- **Top left:** Area name (14px, font-weight 500, opacity 0.7)
- **Below name:** Temperature value (28px, font-weight 700) from configured temperature entity
- **Right side:** 3 round entity buttons stacked vertically (40×40px, 8px gap)
  - **Light button:** Yellow background when on (`#fef3c7`), gray when off (`#e8e8e3`)
  - **Media button:** Pink background when on (`#fce7f3`), gray when off
  - **Special button:** Green background when on (`#d1fae5`), gray when off
  - Each button shows an emoji/icon representing the entity type
  - State changes reactively via entity store
  - Buttons without a configured entity are hidden (not shown gray)
- **Bottom left:** Large play/pause button (56×56px, round)
  - Green (`#22c55e`) when playing, gray when stopped
  - Only visible when media player entity is configured
  - Volume slider bar below the button (60px wide, 4px height)
- **Background:** Configurable via `card.config.backgroundSource`:
  - `"area"` (default): HA area picture from `areas` store
  - `"custom"`: URL from `card.config.backgroundUrl` (image URL or webcam stream)
  - `"media"`: `entity_picture` from configured media player entity (album art)
    - **Fallback:** When media player is idle/off (no `entity_picture`), falls back to `"area"` picture
  - Dark overlay gradient for readability when background image is present
  - Light background (`#f5f5f0`) when no image is set
- **Click:** Opens Area Popup V2 via `onCardAction?.("area-v2", { areaId, ...card.config })`
- **Minimum config:** Only `area_id` is required. Card shows area name + background even with no entities configured.

### Configuration (`card.config`)
```typescript
{
  area_id: string              // HA area ID (required)
  temperature_entity?: string  // e.g. "sensor.living_room_temperature"
  light_entity?: string        // e.g. "light.living_room" or light group
  special_entity?: string      // e.g. "vacuum.roborock", "sensor.washing_machine"
  media_player_entity?: string // e.g. "media_player.sonos_living_room"
  backgroundSource?: "area" | "custom" | "media"  // default: "area"
  backgroundUrl?: string       // for "custom" source
}
```

### Card Edit Integration
- Add entity selection fields to `CardEditPopup.tsx` for `area_v2` type
- Entity pickers filter by relevant domains:
  - Temperature: `sensor` domain with `device_class: "temperature"`
  - Light: `light` domain
  - Special: `vacuum`, `sensor`, `switch` domains
  - Media player: `media_player` domain
- Background source selector (dropdown: Area-Bild / Custom URL / Media Player)
- Background URL input (visible only when source = "custom")

---

## Feature 2: Weather Badges in StatusBar

### Position & Layout
- Placed after existing status chips in `StatusBar.tsx`
- Separated from status chips by a vertical divider (1px, 24px height, `#444`)
- Same height as existing chips: 36px, `padding: 6px 12px`, `border-radius: 8px`
- Same styling: `background: rgba(255,255,255,0.06)`, `border: 1px solid rgba(255,255,255,0.08)`

### Hourly Badges (3)
- Layout: horizontal inline — `badge-time | WeatherIcon (18×18) | badge-temp`
- Time: 11px, `color: #888`
- Temp: 13px, font-weight 700, white
- Uses next 3 hours from weather forecast data
- **Fallback:** If hourly forecast is unavailable (some HA integrations don't support it), hide the hourly badges entirely. Only show daily badges.

### Daily Badges (3)
- Separated from hourly by another vertical divider
- Layout: horizontal inline — `day-name | WeatherIcon (18×18) | high° low°`
- High temp: 13px bold white; Low temp: 11px `#666`
- Uses next 3 days from weather forecast data

### Weather Icons
- Reuse existing `WeatherIcon.tsx` component (animated SVGs)
- Render at 18×18px size for badges
- Condition mapping already exists in `WeatherIcon.tsx`

### Data Source — Weather Forecast Hook
Create a new `useWeatherForecast` hook in `frontend/src/hooks/useWeatherForecast.ts`:
- Uses `sendCommand` from `useHomeAssistant` to call HA WebSocket:
  ```typescript
  sendCommand({
    type: "weather/subscribe_forecast",
    entity_id: "weather.forecast_home",
    forecast_type: "hourly" // or "daily"
  })
  ```
- Returns `{ hourlyForecast, dailyForecast, isLoading }`
- Subscribes on mount, caches results, auto-updates when HA pushes new data
- Both `WeatherBadges` and `WeatherPopupV2` consume this hook (single subscription)
- **Loading state:** Show empty/skeleton badges while loading
- **Error state:** Hide badges if weather entity is unavailable

### Click Behavior
- Any weather badge click triggers `onOpenPopup?.("weather", { entityId })`
- Uses same popup ID `"weather"` as the existing WeatherCard for consistency
- `WeatherPopupV2` replaces the existing `WeatherPopup` in `PopupRegistry.ts`

---

## Feature 3: Weather Popup V2

### Replaces
- **New file** `WeatherPopupV2.tsx` replaces `WeatherPopup.tsx` in `PopupRegistry.ts`
- Old `WeatherPopup.tsx` can be deleted after migration
- Triggered by: weather badge click OR WeatherCard click (both use popup ID `"weather"`)

### Layout (top to bottom)
1. **Header:** WeatherIcon (40×40 in circle) + "Wetter" title + close button
2. **Current weather card** (rounded 16px, `#2a2a2a` background):
   - Left: Temperature (48px bold), "Gefühlt X°" (14px gray), condition text (13px)
   - Right: Large animated WeatherIcon (56×56)
3. **Hourly forecast** (horizontal scroll, hidden scrollbar):
   - 5+ hour items, each in rounded card (12px radius)
   - Time, WeatherIcon (18×18), temperature (15px bold), wind + rain (9px)
   - Hidden if hourly forecast unavailable
4. **Daily forecast** (vertical stack, 8px gap):
   - 3 day cards (rounded 16px), each with:
   - Left: Day name (14px bold), temperature (28px bold), condition (12px gray)
   - Right: Animated WeatherIcon (38×38)

### Data
- Current: `weather.*` entity state + attributes (temperature, humidity, wind_speed, etc.)
- Forecast: `useWeatherForecast` hook (shared with badges, see Feature 2)

---

## Feature 4: Area Popup V2

### Registration
- New popup registered as `"area-v2"` in `PopupRegistry.ts`
- Triggered by Area Card V2 click: `onCardAction?.("area-v2", { areaId, ...card.config })`
- Coexists with existing `AreaPopup.tsx` (popup ID `"area"`, used by old area cards)

### Layout (top to bottom)
1. **Header:** Area icon (40×40, colored circle) + area name + close button
2. **Text overview** (rounded 16px, `#2a2a2a`):
   - Auto-generated sentence describing area state (German only, matching project language)
   - Inline highlight badges with borders:
     - Temperature (warm, `#f59e0b` border)
     - Humidity (info, `#60a5fa` border) — humidity used instead of air quality since HA areas typically have humidity sensors
     - Device usage info if available (info, `#60a5fa` border)
   - Template: "Es ist {temp} im {area} und die Luftfeuchtigkeit beträgt {humidity}. {device_info}."
   - Sections of the template are omitted when their entity data is unavailable
3. **Scenes row** (horizontal scroll, hidden scrollbar via `scrollbar-width: none` + `::-webkit-scrollbar { display: none }`):
   - Filter scenes using `entityAreaMap` from entity store — only scenes mapped to this area ID
   - **If no scenes mapped:** Hide the scenes section entirely (no empty row)
   - Each scene: round button (16px radius) with icon + name
   - Click activates scene via `callService("scene", "turn_on", {}, { entity_id })`
4. **Media player** (rounded 16px, only if media player entity in area):
   - Artwork (48×48, rounded 8px) from `entity_picture` attribute, proxied through existing `/api/media/artwork?entity_id=...` endpoint (already exists in `media_routes.py`)
   - Title, artist, play/pause button
   - Hidden if no media player in area
5. **Category tabs:** Licht | Rollos | Klima
   - Active tab: yellow background (`#fef3c7`), dark text
   - Inactive: border `#333`, gray text
   - Tabs are only shown if their entity type exists in the area (e.g., no "Rollos" tab if no cover entities)
6. **Entity controls** (based on active tab):
   - **Licht:** Existing `LightSliderCard` components for each light in the area (same as current `AreaPopup.tsx`)
   - **Rollos:** Existing `CoverCard` component for each cover entity in the area (rendered in a list, not as grid cards)
   - **Klima:** Read-only display — current mode, current temp, target temp (same as existing `AreaPopup.tsx` climate section)

### Data Sources
- Area entities from `useEntitiesByArea(areaId)` hook
- Scenes: `useEntitiesByDomain("scene")` filtered by `entityAreaMap[sceneEntityId] === areaId`
- Text overview: computed from entity states in the area
- `callService` passed from parent for scene activation and media control

---

## Shared Patterns

### Entity State Colors
| State | Color | Usage |
|-------|-------|-------|
| Light on | `#fef3c7` bg, `#92400e` text | Light button, slider fill |
| Media playing | `#22c55e` | Play button, media indicator |
| Special active | `#d1fae5` bg, `#065f46` text | Special entity button |
| Off / inactive | `#e8e8e3` bg, `#999` text | All entity buttons |

### Dark Background Variant
When area card has a background image, entity buttons use semi-transparent backgrounds:
- On: same colors with 0.9 opacity
- Off: `rgba(255,255,255,0.2)` with `rgba(255,255,255,0.6)` text

### Responsive
- Area Card V2: scales with grid cell size (min 120px as per existing grid)
- Weather badges: scroll horizontally on small screens (part of StatusBar scroll)
- Popups: max-width 380px, centered, full mobile experience

---

## Files to Create / Modify

### New Files
- `frontend/src/components/cards/AreaCardV2.tsx` — new area card component
- `frontend/src/components/cards/AreaCardV2.css` — styles
- `frontend/src/components/popups/AreaPopupV2.tsx` — new area popup
- `frontend/src/components/popups/AreaPopupV2.css` — styles
- `frontend/src/components/popups/WeatherPopupV2.tsx` — enhanced weather popup (replaces WeatherPopup)
- `frontend/src/components/popups/WeatherPopupV2.css` — styles
- `frontend/src/components/layout/WeatherBadges.tsx` — header weather badges
- `frontend/src/components/layout/WeatherBadges.css` — styles
- `frontend/src/hooks/useWeatherForecast.ts` — weather forecast subscription hook

### Modified Files
- `frontend/src/components/cards/CardRegistry.ts` — register `area_v2`
- `frontend/src/components/cards/index.ts` — export new card
- `frontend/src/components/layout/StatusBar.tsx` — integrate WeatherBadges, pass `sendCommand`
- `frontend/src/components/layout/StatusBar.css` — divider styles
- `frontend/src/components/wizard/CardEditPopup.tsx` — area_v2 config fields
- `frontend/src/components/popups/PopupRegistry.ts` — register `area-v2`, replace `weather` with V2

### No Backend Changes Required
- `/api/media/artwork` endpoint already exists in `media_routes.py`
- Weather forecast data comes via HA WebSocket (`weather/subscribe_forecast`)
- All entity/area data already available through existing WS proxy
