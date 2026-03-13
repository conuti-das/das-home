# Area Card V2, Weather Badges & Popups — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add rich area cards with entity buttons, weather forecast badges in the header, a redesigned weather popup, and a new area popup with text overview, scenes, media, and light controls.

**Architecture:** Four features built bottom-up: shared weather forecast hook first, then weather badges + popup, then area card + popup. Each feature is independently testable. All components use existing patterns (CardRegistry, PopupRegistry, entity hooks, service calls).

**Tech Stack:** React 19, TypeScript, Zustand, CSS Modules (plain CSS), UI5 Web Components, existing WeatherIcon SVGs, existing LightSliderCard.

**Spec:** `docs/superpowers/specs/2026-03-13-area-card-weather-badges-design.md`

---

## Chunk 1: Weather Forecast Hook + Weather Badges

### Task 1: Create `useWeatherForecast` Hook

**Files:**
- Create: `frontend/src/hooks/useWeatherForecast.ts`

- [ ] **Step 1: Create the hook file**

```typescript
// frontend/src/hooks/useWeatherForecast.ts
import { useMemo } from "react";
import { useEntity, useEntitiesByDomain } from "./useEntity";

export interface ForecastEntry {
  datetime: string;
  condition: string;
  temperature: number;
  templow?: number;
  precipitation?: number;
  precipitation_probability?: number;
  wind_speed?: number;
  wind_bearing?: number;
  humidity?: number;
}

interface WeatherForecastResult {
  hourlyForecast: ForecastEntry[];
  dailyForecast: ForecastEntry[];
  entityId: string;
}

/**
 * Reads forecast data from weather entity attributes.
 * Uses the legacy forecast attribute (still available in most HA setups).
 * Splits entries into hourly (within 24h) and daily (beyond 24h) buckets.
 */
export function useWeatherForecast(): WeatherForecastResult {
  const weatherEntities = useEntitiesByDomain("weather");
  const entityId = weatherEntities[0]?.entity_id || "weather.forecast_home";
  const entity = useEntity(entityId);

  const forecast = (entity?.attributes?.forecast as ForecastEntry[]) || [];

  const { hourlyForecast, dailyForecast } = useMemo(() => {
    if (forecast.length === 0) return { hourlyForecast: [], dailyForecast: [] };

    const now = Date.now();
    const in24h = now + 24 * 60 * 60 * 1000;

    // If entries are spaced <= 3 hours apart, treat as hourly data
    const firstTwo = forecast.slice(0, 2);
    const isHourlyData = firstTwo.length === 2 &&
      (new Date(firstTwo[1].datetime).getTime() - new Date(firstTwo[0].datetime).getTime()) <= 3 * 60 * 60 * 1000;

    if (isHourlyData) {
      // All hourly — split into near-term (hourly badges) and daily summary not available
      return {
        hourlyForecast: forecast.filter((e) => new Date(e.datetime).getTime() <= in24h),
        dailyForecast: [],
      };
    }

    // Otherwise treat as daily data
    return {
      hourlyForecast: [],
      dailyForecast: forecast,
    };
  }, [forecast]);

  return { hourlyForecast, dailyForecast, entityId };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS (no errors related to useWeatherForecast)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useWeatherForecast.ts
git commit -m "feat: add useWeatherForecast hook for forecast data"
```

---

### Task 2: Create Weather Badges Component

**Files:**
- Create: `frontend/src/components/layout/WeatherBadges.tsx`
- Create: `frontend/src/components/layout/WeatherBadges.css`

- [ ] **Step 1: Create WeatherBadges.css**

```css
/* frontend/src/components/layout/WeatherBadges.css */
.weather-badges {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.weather-badges__divider {
  width: 1px;
  height: 24px;
  background: rgba(250, 251, 252, 0.12);
  flex-shrink: 0;
  align-self: center;
}

.weather-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--dh-card-radius);
  border: var(--dh-surface-border);
  background: var(--dh-gray300);
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background var(--dh-transition-normal);
}

.weather-badge:active {
  background: var(--dh-gray200);
}

.weather-badge__time {
  font-size: 11px;
  color: var(--dh-gray100);
  opacity: 0.5;
}

.weather-badge__temp {
  font-size: 13px;
  font-weight: 700;
  color: var(--dh-gray100);
}

.weather-badge__temps {
  display: flex;
  gap: 3px;
  align-items: baseline;
}

.weather-badge__temp-low {
  font-size: 11px;
  color: var(--dh-gray100);
  opacity: 0.4;
}
```

- [ ] **Step 2: Create WeatherBadges.tsx**

```tsx
// frontend/src/components/layout/WeatherBadges.tsx
import { useMemo } from "react";
import { WeatherIcon } from "@/components/cards/WeatherIcon";
import { useWeatherForecast } from "@/hooks/useWeatherForecast";
import "./WeatherBadges.css";

const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

interface WeatherBadgesProps {
  onOpenPopup?: (popupId: string, props?: Record<string, unknown>) => void;
}

export function WeatherBadges({ onOpenPopup }: WeatherBadgesProps) {
  const { hourlyForecast, dailyForecast, entityId } = useWeatherForecast();

  const hourlyBadges = useMemo(() => hourlyForecast.slice(0, 3), [hourlyForecast]);
  const dailyBadges = useMemo(() => dailyForecast.slice(0, 3), [dailyForecast]);

  if (hourlyBadges.length === 0 && dailyBadges.length === 0) {
    return null;
  }

  const handleClick = () => {
    onOpenPopup?.("weather", { entityId });
  };

  return (
    <>
      <div className="weather-badges__divider" />

      {/* Hourly badges */}
      {hourlyBadges.length > 0 && (
        <div className="weather-badges">
          {hourlyBadges.map((entry, i) => {
            const time = new Date(entry.datetime);
            const timeStr = time.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={i} className="weather-badge" onClick={handleClick}>
                <span className="weather-badge__time">{timeStr}</span>
                <WeatherIcon condition={entry.condition} size={18} />
                <span className="weather-badge__temp">{Math.round(entry.temperature)}°</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Divider between hourly and daily */}
      {hourlyBadges.length > 0 && dailyBadges.length > 0 && (
        <div className="weather-badges__divider" />
      )}

      {/* Daily badges */}
      {dailyBadges.length > 0 && (
        <div className="weather-badges">
          {dailyBadges.map((entry, i) => {
            const date = new Date(entry.datetime);
            const dayName = DAY_NAMES[date.getDay()];
            return (
              <div key={i} className="weather-badge" onClick={handleClick}>
                <span className="weather-badge__time">{dayName}</span>
                <WeatherIcon condition={entry.condition} size={18} />
                <span className="weather-badge__temps">
                  <span className="weather-badge__temp">{Math.round(entry.temperature)}°</span>
                  {entry.templow !== undefined && (
                    <span className="weather-badge__temp-low">{Math.round(entry.templow)}°</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/WeatherBadges.tsx frontend/src/components/layout/WeatherBadges.css
git commit -m "feat: add WeatherBadges component for status bar"
```

---

### Task 3: Integrate Weather Badges into StatusBar

**Files:**
- Modify: `frontend/src/components/layout/StatusBar.tsx` (lines 1-4 imports, line 108 after lights chip)

- [ ] **Step 1: Add import at top of StatusBar.tsx**

After line 3 (`import { useEntitiesByDomain } from "@/hooks/useEntity";`), add:

```typescript
import { WeatherBadges } from "./WeatherBadges";
```

- [ ] **Step 2: Add WeatherBadges after lights chip**

After the lights chip closing `</div>` and `)}` (line 108), and before the media players section (line 111), insert:

```tsx
      {/* Weather forecast badges */}
      <WeatherBadges onOpenPopup={onOpenPopup} />
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Visual test**

Run: `cd frontend && pnpm dev`
Open browser → check StatusBar shows weather badges after lights chip, same height as other chips.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/StatusBar.tsx
git commit -m "feat: integrate weather badges into status bar"
```

---

## Chunk 2: Weather Popup V2

### Task 4: Create Weather Popup V2

**Files:**
- Create: `frontend/src/components/popups/WeatherPopupV2.tsx`
- Create: `frontend/src/components/popups/WeatherPopupV2.css`

- [ ] **Step 1: Create WeatherPopupV2.css**

```css
/* frontend/src/components/popups/WeatherPopupV2.css */
.wpv2__current {
  background: var(--dh-gray300);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.wpv2__current-temp {
  font-size: 48px;
  font-weight: 700;
  color: var(--dh-gray100);
  line-height: 1;
}

.wpv2__current-feels {
  font-size: 14px;
  color: var(--dh-gray100);
  opacity: 0.5;
  margin-top: 4px;
}

.wpv2__current-condition {
  font-size: 13px;
  color: var(--dh-gray100);
  opacity: 0.6;
  margin-top: 8px;
}

.wpv2__hourly {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.wpv2__hourly::-webkit-scrollbar {
  display: none;
}

.wpv2__hour-item {
  background: var(--dh-gray300);
  border-radius: 12px;
  padding: 10px 8px;
  text-align: center;
  min-width: 60px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.wpv2__hour-time {
  font-size: 11px;
  color: var(--dh-gray100);
  opacity: 0.5;
}

.wpv2__hour-temp {
  font-size: 15px;
  font-weight: 700;
  color: var(--dh-gray100);
}

.wpv2__hour-extra {
  font-size: 9px;
  color: var(--dh-gray100);
  opacity: 0.4;
  line-height: 1.3;
}

.wpv2__daily {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wpv2__day-item {
  background: var(--dh-gray300);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.wpv2__day-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--dh-gray100);
}

.wpv2__day-temp {
  font-size: 28px;
  font-weight: 700;
  color: var(--dh-gray100);
  margin-top: 4px;
}

.wpv2__day-condition {
  font-size: 12px;
  color: var(--dh-gray100);
  opacity: 0.5;
  margin-top: 4px;
}
```

- [ ] **Step 2: Create WeatherPopupV2.tsx**

```tsx
// frontend/src/components/popups/WeatherPopupV2.tsx
import { useEntity, useEntitiesByDomain } from "@/hooks/useEntity";
import { useWeatherForecast } from "@/hooks/useWeatherForecast";
import { PopupModal } from "@/components/layout/PopupModal";
import { WeatherIcon } from "@/components/cards/WeatherIcon";
import type { PopupProps } from "./PopupRegistry";
import "./WeatherPopupV2.css";

const CONDITION_TEXT: Record<string, string> = {
  sunny: "Sonnig",
  "clear-night": "Klare Nacht",
  cloudy: "Bewolkt",
  partlycloudy: "Teilw. bewolkt",
  rainy: "Regen",
  pouring: "Starkregen",
  snowy: "Schnee",
  "snowy-rainy": "Schneeregen",
  lightning: "Gewitter",
  "lightning-rainy": "Gewitter + Regen",
  fog: "Nebel",
  windy: "Windig",
  "windy-variant": "Windig",
  hail: "Hagel",
  exceptional: "Ungewoehnlich",
};

const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export function WeatherPopupV2({ onClose, props }: PopupProps) {
  const weatherEntities = useEntitiesByDomain("weather");
  const entityId = (props?.entityId as string) || weatherEntities[0]?.entity_id || "weather.forecast_home";
  const entity = useEntity(entityId);
  const { hourlyForecast, dailyForecast } = useWeatherForecast();

  const condition = entity?.state || "";
  const temp = entity?.attributes?.temperature as number | undefined;
  const humidity = entity?.attributes?.humidity as number | undefined;
  const windSpeed = entity?.attributes?.wind_speed as number | undefined;
  const conditionText = CONDITION_TEXT[condition] || condition;

  const hourlyItems = hourlyForecast.slice(0, 5);
  const dailyItems = dailyForecast.slice(0, 3);

  return (
    <PopupModal open title="Wetter" icon="weather-proofing" onClose={onClose} className="weather-popup-modal">
      {/* Current weather */}
      <div className="wpv2__current">
        <div>
          <div className="wpv2__current-temp">
            {temp !== undefined ? `${Math.round(temp)}°` : "--"}
          </div>
          <div className="wpv2__current-feels">
            {conditionText}
            {humidity !== undefined && ` · ${humidity}%`}
            {windSpeed !== undefined && ` · ${Math.round(windSpeed)} km/h`}
          </div>
        </div>
        <WeatherIcon condition={condition} size={64} />
      </div>

      {/* Hourly forecast */}
      {hourlyItems.length > 0 && (
        <div className="wpv2__hourly">
          {hourlyItems.map((entry, i) => {
            const time = new Date(entry.datetime);
            const timeStr = time.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
            const wind = entry.wind_speed ? `${Math.round(entry.wind_speed)}km/h` : "";
            const precip = entry.precipitation ? `${entry.precipitation}mm` : "";
            const extra = [wind, precip].filter(Boolean).join(" · ");
            return (
              <div key={i} className="wpv2__hour-item">
                <span className="wpv2__hour-time">{timeStr}</span>
                <WeatherIcon condition={entry.condition} size={24} />
                <span className="wpv2__hour-temp">{Math.round(entry.temperature)}°</span>
                {extra && <span className="wpv2__hour-extra">{extra}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Daily forecast */}
      {dailyItems.length > 0 && (
        <div className="wpv2__daily">
          {dailyItems.map((entry, i) => {
            const date = new Date(entry.datetime);
            const dayName = i === 0 ? "Heute" : DAY_NAMES[date.getDay()];
            const condText = CONDITION_TEXT[entry.condition] || entry.condition;
            const precip = entry.precipitation ? `${entry.precipitation}mm` : "0mm";
            return (
              <div key={i} className="wpv2__day-item">
                <div>
                  <div className="wpv2__day-name">{dayName}</div>
                  <div className="wpv2__day-temp">{Math.round(entry.temperature)}°</div>
                  <div className="wpv2__day-condition">{condText} · {precip}</div>
                </div>
                <WeatherIcon condition={entry.condition} size={42} />
              </div>
            );
          })}
        </div>
      )}
    </PopupModal>
  );
}
```

- [ ] **Step 3: Register WeatherPopupV2 — replace old WeatherPopup**

Modify `frontend/src/components/popups/index.ts`:

Replace line 2:
```typescript
import { WeatherPopup } from "./WeatherPopup";
```
with:
```typescript
import { WeatherPopupV2 } from "./WeatherPopupV2";
```

Replace line 12:
```typescript
registerPopup("weather", WeatherPopup);
```
with:
```typescript
registerPopup("weather", WeatherPopupV2);
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Visual test**

Run: `cd frontend && pnpm dev`
Click a weather badge or weather card → new popup with current weather, hourly row, daily cards.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/popups/WeatherPopupV2.tsx frontend/src/components/popups/WeatherPopupV2.css frontend/src/components/popups/index.ts
git commit -m "feat: add WeatherPopupV2 with hourly and daily forecast"
```

---

## Chunk 3: Area Card V2

### Task 5: Create Area Card V2 Component

**Files:**
- Create: `frontend/src/components/cards/AreaCardV2.tsx`
- Create: `frontend/src/components/cards/AreaCardV2.css`

- [ ] **Step 1: Create AreaCardV2.css**

```css
/* frontend/src/components/cards/AreaCardV2.css */
.area-card-v2 {
  width: 100%;
  height: 100%;
  border-radius: var(--dh-card-radius);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 14px;
  cursor: pointer;
  background-size: cover;
  background-position: center;
}

.area-card-v2--light {
  background: var(--dh-gray300);
}

.area-card-v2--image::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.08) 40%,
    rgba(0, 0, 0, 0.45) 100%
  );
  z-index: 1;
}

.area-card-v2--image > * {
  position: relative;
  z-index: 2;
}

/* Top row: name + temp left, buttons right */
.acv2__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.acv2__info {
  flex: 1;
  min-width: 0;
}

.acv2__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--dh-gray100);
  opacity: 0.7;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.area-card-v2--image .acv2__name {
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.acv2__temp {
  font-size: 28px;
  font-weight: 700;
  color: var(--dh-gray100);
  line-height: 1.1;
  margin-top: 2px;
}

.area-card-v2--image .acv2__temp {
  color: white;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

/* Entity buttons */
.acv2__buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.acv2__btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

/* Light button states */
.acv2__btn--light-on {
  background: #fef3c7;
  color: #92400e;
}
.acv2__btn--light-off {
  background: rgba(255, 255, 255, 0.08);
  color: var(--dh-gray100);
  opacity: 0.5;
}

/* Media button states */
.acv2__btn--media-on {
  background: #fce7f3;
  color: #9d174d;
}
.acv2__btn--media-off {
  background: rgba(255, 255, 255, 0.08);
  color: var(--dh-gray100);
  opacity: 0.5;
}

/* Special button states */
.acv2__btn--special-on {
  background: #d1fae5;
  color: #065f46;
}
.acv2__btn--special-off {
  background: rgba(255, 255, 255, 0.08);
  color: var(--dh-gray100);
  opacity: 0.5;
}

/* Dark bg variants */
.area-card-v2--image .acv2__btn--light-on {
  background: rgba(254, 243, 199, 0.9);
}
.area-card-v2--image .acv2__btn--media-on {
  background: rgba(252, 231, 243, 0.9);
}
.area-card-v2--image .acv2__btn--special-on {
  background: rgba(209, 250, 229, 0.9);
}
.area-card-v2--image .acv2__btn--light-off,
.area-card-v2--image .acv2__btn--media-off,
.area-card-v2--image .acv2__btn--special-off {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.6);
  opacity: 1;
}

/* Bottom: media controls */
.acv2__bottom {
  display: flex;
  align-items: flex-end;
}

.acv2__play-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.acv2__play-btn--playing {
  background: #22c55e;
  color: white;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.35);
}

.acv2__play-btn--stopped {
  background: rgba(255, 255, 255, 0.08);
  color: var(--dh-gray100);
  opacity: 0.5;
}

.area-card-v2--image .acv2__play-btn--playing {
  background: rgba(34, 197, 94, 0.85);
}
.area-card-v2--image .acv2__play-btn--stopped {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.6);
  opacity: 1;
}

.acv2__volume {
  margin-top: 6px;
}

.acv2__volume-bar {
  width: 52px;
  height: 4px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;
}

.acv2__volume-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 2px;
  transition: width 0.15s ease;
}

.area-card-v2--light .acv2__volume-bar {
  background: rgba(0, 0, 0, 0.08);
}

.area-card-v2--light .acv2__volume-fill {
  background: #22c55e;
}
```

- [ ] **Step 2: Create AreaCardV2.tsx**

```tsx
// frontend/src/components/cards/AreaCardV2.tsx
import { useMemo, useCallback } from "react";
import { useEntity } from "@/hooks/useEntity";
import { useEntityStore } from "@/stores/entityStore";
import { apiUrl } from "@/utils/basePath";
import type { CardComponentProps } from "./CardRegistry";
import "./AreaCardV2.css";

/** Detect entity "on" state based on domain */
function isEntityOn(state: string | undefined, domain: string): boolean {
  if (!state) return false;
  if (domain === "vacuum") return state === "cleaning";
  if (domain === "media_player") return state === "playing";
  return state === "on";
}

/** Get icon for special entity based on domain/entity_id */
function getSpecialIcon(entityId: string): string {
  if (entityId.includes("vacuum") || entityId.includes("saugrobot")) return "🤖";
  if (entityId.includes("wasch") || entityId.includes("washing")) return "🫧";
  if (entityId.includes("trockner") || entityId.includes("dryer")) return "👕";
  if (entityId.includes("dishwasher") || entityId.includes("spuel")) return "🍽️";
  return "⚡";
}

export function AreaCardV2({ card, callService, onCardAction }: CardComponentProps) {
  const config = card.config ?? {};
  const areaId = config.area_id as string | undefined;
  const bgSource = (config.backgroundSource as string) || "area";
  const bgUrl = config.backgroundUrl as string | undefined;

  // Area info
  const area = useEntityStore((s) => areaId ? s.areas.get(areaId) : undefined);

  // Entities
  const tempEntity = useEntity(config.temperature_entity as string);
  const lightEntity = useEntity(config.light_entity as string);
  const specialEntity = useEntity(config.special_entity as string);
  const mediaEntity = useEntity(config.media_player_entity as string);

  // Background image
  const backgroundImage = useMemo(() => {
    if (bgSource === "custom" && bgUrl) return bgUrl;
    if (bgSource === "media" && mediaEntity?.attributes?.entity_picture) {
      return apiUrl(`/api/media/artwork?entity_id=${encodeURIComponent(config.media_player_entity as string)}`);
    }
    if (bgSource === "media" && area?.picture) return area.picture; // fallback
    if (area?.picture) return area.picture;
    return undefined;
  }, [bgSource, bgUrl, mediaEntity, area, config.media_player_entity]);

  const hasImage = !!backgroundImage;
  const areaName = area?.name || areaId || "Bereich";

  // Temperature
  const tempValue = tempEntity?.state ? parseFloat(tempEntity.state) : undefined;

  // Entity states
  const lightDomain = (config.light_entity as string)?.split(".")[0] || "light";
  const lightOn = isEntityOn(lightEntity?.state, lightDomain);

  const specialDomain = (config.special_entity as string)?.split(".")[0] || "";
  const specialOn = isEntityOn(specialEntity?.state, specialDomain);
  const specialIcon = config.special_entity ? getSpecialIcon(config.special_entity as string) : "⚡";

  const mediaPlaying = mediaEntity?.state === "playing";
  const mediaVolume = mediaEntity?.attributes?.volume_level as number | undefined;

  // Click handlers
  const handleClick = useCallback(() => {
    onCardAction?.("area-v2", { areaId, ...config });
  }, [onCardAction, areaId, config]);

  const handleMediaToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!config.media_player_entity) return;
    callService(
      "media_player",
      mediaPlaying ? "media_pause" : "media_play",
      {},
      { entity_id: config.media_player_entity as string }
    );
  }, [callService, config.media_player_entity, mediaPlaying]);

  const handleLightToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!config.light_entity) return;
    callService("light", lightOn ? "turn_off" : "turn_on", {}, { entity_id: config.light_entity as string });
  }, [callService, config.light_entity, lightOn]);

  const cardClass = `area-card-v2 ${hasImage ? "area-card-v2--image" : "area-card-v2--light"}`;

  return (
    <div
      className={cardClass}
      style={hasImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
      onClick={handleClick}
    >
      <div className="acv2__top">
        <div className="acv2__info">
          <div className="acv2__name">{areaName}</div>
          {tempValue !== undefined && (
            <div className="acv2__temp">{tempValue.toFixed(1)}°</div>
          )}
        </div>

        <div className="acv2__buttons">
          {config.light_entity && (
            <button
              className={`acv2__btn ${lightOn ? "acv2__btn--light-on" : "acv2__btn--light-off"}`}
              onClick={handleLightToggle}
              title={lightOn ? "Licht aus" : "Licht an"}
            >
              💡
            </button>
          )}
          {config.media_player_entity && (
            <button
              className={`acv2__btn ${mediaPlaying ? "acv2__btn--media-on" : "acv2__btn--media-off"}`}
              onClick={(e) => { e.stopPropagation(); }}
              title="Media"
            >
              🔊
            </button>
          )}
          {config.special_entity && (
            <button
              className={`acv2__btn ${specialOn ? "acv2__btn--special-on" : "acv2__btn--special-off"}`}
              onClick={(e) => { e.stopPropagation(); }}
              title={config.special_entity as string}
            >
              {specialIcon}
            </button>
          )}
        </div>
      </div>

      <div className="acv2__bottom">
        {config.media_player_entity && (
          <div>
            <button
              className={`acv2__play-btn ${mediaPlaying ? "acv2__play-btn--playing" : "acv2__play-btn--stopped"}`}
              onClick={handleMediaToggle}
            >
              {mediaPlaying ? "⏸" : "▶"}
            </button>
            {mediaVolume !== undefined && (
              <div className="acv2__volume">
                <div className="acv2__volume-bar">
                  <div className="acv2__volume-fill" style={{ width: `${Math.round(mediaVolume * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/cards/AreaCardV2.tsx frontend/src/components/cards/AreaCardV2.css
git commit -m "feat: add AreaCardV2 component with entity buttons and media controls"
```

---

### Task 6: Register Area Card V2

**Files:**
- Modify: `frontend/src/components/cards/index.ts` (add import + registration)

- [ ] **Step 1: Add import**

At the top of `frontend/src/components/cards/index.ts`, with the other imports (around line 34), add:

```typescript
import { AreaCardV2 } from "./AreaCardV2";
```

- [ ] **Step 2: Add registration**

After the `area_small` registration (line 319), add:

```typescript
registerCard("area_v2", AreaCardV2, {
  displayName: "Bereich (V2)",
  description: "Bereichskarte mit Temperatur, Licht, Media und Spezial-Entity",
  category: "komplex",
  compatibleDomains: [],
  defaultSize: "1x1",
  iconName: "home",
});
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/cards/index.ts
git commit -m "feat: register area_v2 card type in CardRegistry"
```

---

### Task 7: Add Area Card V2 Config to CardEditPopup

**Files:**
- Modify: `frontend/src/components/wizard/CardEditPopup.tsx`

- [ ] **Step 1: Add entity queries for area_v2**

After the wind sensors query (line 74), add:

```typescript
  const isAreaV2Card = cardType === "area_v2";
  const allLights = useEntitiesByDomain("light");
  const allMediaPlayers = useEntitiesByDomain("media_player");
  const allVacuums = useEntitiesByDomain("vacuum");
  const allSwitchesForSpecial = useEntitiesByDomain("switch");
  const specialSensors = useMemo(() =>
    allSensors.filter((e) =>
      e.entity_id.includes("wasch") || e.entity_id.includes("washing") ||
      e.entity_id.includes("trockner") || e.entity_id.includes("dryer") ||
      e.entity_id.includes("dishwasher") || e.entity_id.includes("spuel")
    ), [allSensors]);
  const areas = useEntityStore((s) => Array.from(s.areas.values()));
```

Add the import for `useEntityStore` at the top (line 1 area):

```typescript
import { useEntityStore } from "@/stores/entityStore";
```

- [ ] **Step 2: Add datasource tab for area_v2**

In the tabs array (line 108-117), change the condition to include `area_v2`:

Replace:
```typescript
    ...(isWeatherCard ? [{ key: "datasource" as const, label: "Datenquellen" }] : []),
```
with:
```typescript
    ...((isWeatherCard || isAreaV2Card) ? [{ key: "datasource" as const, label: "Datenquellen" }] : []),
```

- [ ] **Step 3: Add area_v2 config fields**

After the weather datasource block closing `)}` (line 326), add:

```tsx
        {/* Datasource tab (area_v2) */}
        {tab === "datasource" && isAreaV2Card && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Area selection */}
            <div>
              <div className="cep__ds-label">Bereich</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.area_id as string) || ""}
                onChange={(e) => setCardConfig({ ...cardConfig, area_id: e.target.value || undefined })}
              >
                <option value="">Bereich waehlen...</option>
                {areas.map((a) => (
                  <option key={a.area_id} value={a.area_id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Temperature entity */}
            <div>
              <div className="cep__ds-label">Temperatur-Sensor</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.temperature_entity as string) || ""}
                onChange={(e) => setCardConfig({ ...cardConfig, temperature_entity: e.target.value || undefined })}
              >
                <option value="">Keiner</option>
                {tempSensors.map((s) => (
                  <option key={s.entity_id} value={s.entity_id}>
                    {(s.attributes?.friendly_name as string) || s.entity_id} ({s.state}°)
                  </option>
                ))}
              </select>
            </div>

            {/* Light entity */}
            <div>
              <div className="cep__ds-label">Licht / Lichtgruppe</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.light_entity as string) || ""}
                onChange={(e) => setCardConfig({ ...cardConfig, light_entity: e.target.value || undefined })}
              >
                <option value="">Keines</option>
                {allLights.map((l) => (
                  <option key={l.entity_id} value={l.entity_id}>
                    {(l.attributes?.friendly_name as string) || l.entity_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Special entity */}
            <div>
              <div className="cep__ds-label">Spezial-Entity (Saugroboter, Waschmaschine, ...)</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.special_entity as string) || ""}
                onChange={(e) => setCardConfig({ ...cardConfig, special_entity: e.target.value || undefined })}
              >
                <option value="">Keines</option>
                {[...allVacuums, ...allSwitchesForSpecial, ...specialSensors].map((s) => (
                  <option key={s.entity_id} value={s.entity_id}>
                    {(s.attributes?.friendly_name as string) || s.entity_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Media player entity */}
            <div>
              <div className="cep__ds-label">Media Player</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.media_player_entity as string) || ""}
                onChange={(e) => setCardConfig({ ...cardConfig, media_player_entity: e.target.value || undefined })}
              >
                <option value="">Keiner</option>
                {allMediaPlayers.map((mp) => (
                  <option key={mp.entity_id} value={mp.entity_id}>
                    {(mp.attributes?.friendly_name as string) || mp.entity_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Background source */}
            <div>
              <div className="cep__ds-label">Hintergrund</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.backgroundSource as string) || "area"}
                onChange={(e) => setCardConfig({ ...cardConfig, backgroundSource: e.target.value })}
              >
                <option value="area">Bereichs-Bild (HA)</option>
                <option value="custom">Eigene URL / Webcam</option>
                <option value="media">Media Player Artwork</option>
              </select>
            </div>

            {/* Background URL (only for custom) */}
            {(cardConfig.backgroundSource as string) === "custom" && (
              <div>
                <div className="cep__ds-label">Bild-URL</div>
                <input
                  className="widget-wizard__input"
                  value={(cardConfig.backgroundUrl as string) || ""}
                  onChange={(e) => setCardConfig({ ...cardConfig, backgroundUrl: e.target.value || undefined })}
                  placeholder="https://... oder /local/..."
                />
              </div>
            )}
          </div>
        )}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Visual test**

Run: `cd frontend && pnpm dev`
Add an `area_v2` card via widget wizard → edit it → verify all config fields appear in Datenquellen tab.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/wizard/CardEditPopup.tsx
git commit -m "feat: add area_v2 config fields to CardEditPopup"
```

---

## Chunk 4: Area Popup V2

### Task 8: Create Area Popup V2

**Files:**
- Create: `frontend/src/components/popups/AreaPopupV2.tsx`
- Create: `frontend/src/components/popups/AreaPopupV2.css`

- [ ] **Step 1: Create AreaPopupV2.css**

```css
/* frontend/src/components/popups/AreaPopupV2.css */
.apv2__text-overview {
  background: var(--dh-gray300);
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--dh-gray100);
}

.apv2__highlight {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--dh-gray400);
  border-radius: 20px;
  padding: 2px 10px;
  font-weight: 600;
  color: var(--dh-gray100);
  font-size: 13px;
}

.apv2__highlight--warm {
  border: 1px solid var(--dh-orange);
}

.apv2__highlight--good {
  border: 1px solid var(--dh-green);
}

.apv2__highlight--info {
  border: 1px solid var(--dh-blue);
}

/* Scenes */
.apv2__scenes {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.apv2__scenes::-webkit-scrollbar {
  display: none;
}

.apv2__scene-btn {
  background: var(--dh-gray300);
  border-radius: 16px;
  padding: 12px 16px;
  text-align: center;
  min-width: 80px;
  flex-shrink: 0;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.apv2__scene-btn:active {
  background: var(--dh-gray200);
}

.apv2__scene-icon {
  font-size: 24px;
  margin-bottom: 6px;
}

.apv2__scene-name {
  font-size: 11px;
  color: var(--dh-gray100);
  opacity: 0.6;
}

/* Media */
.apv2__media {
  background: var(--dh-gray300);
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.apv2__media-art {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--dh-gray400);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
  overflow: hidden;
}

.apv2__media-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.apv2__media-info {
  flex: 1;
  min-width: 0;
}

.apv2__media-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dh-gray100);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.apv2__media-artist {
  font-size: 11px;
  color: var(--dh-gray100);
  opacity: 0.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.apv2__media-play {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--dh-green);
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Category tabs */
.apv2__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.apv2__tab {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(250, 251, 252, 0.1);
  color: var(--dh-gray100);
  opacity: 0.5;
  background: transparent;
  transition: all 0.15s ease;
}

.apv2__tab--active {
  background: #fef3c7;
  color: #92400e;
  border-color: #fef3c7;
  font-weight: 600;
  opacity: 1;
}

/* Entity list */
.apv2__entity-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
```

- [ ] **Step 2: Create AreaPopupV2.tsx**

```tsx
// frontend/src/components/popups/AreaPopupV2.tsx
import { useState, useMemo, useCallback } from "react";
import { PopupModal } from "@/components/layout/PopupModal";
import { LightSliderCard } from "@/components/cards/LightSliderCard";
import { useEntity, useEntitiesByDomain, useEntitiesByArea } from "@/hooks/useEntity";
import { useEntityStore } from "@/stores/entityStore";
import { apiUrl } from "@/utils/basePath";
import type { PopupProps } from "./PopupRegistry";
import "./AreaPopupV2.css";

type TabKey = "light" | "cover" | "climate";

export function AreaPopupV2({ onClose, callService, onOpenPopup, props }: PopupProps) {
  const areaId = props?.areaId as string | undefined;
  const area = useEntityStore((s) => areaId ? s.areas.get(areaId) : undefined);
  const areaEntities = useEntitiesByArea(areaId || "");
  const entityAreaMap = useEntityStore((s) => s.entityAreaMap);

  // Temperature entity from card config or area entities
  const configTempEntity = props?.temperature_entity as string | undefined;
  const tempEntity = useEntity(configTempEntity || "");
  const areaTempSensor = useMemo(() => {
    if (configTempEntity && tempEntity) return tempEntity;
    return areaEntities.find((e) =>
      e.entity_id.startsWith("sensor.") &&
      (e.attributes?.device_class === "temperature" || e.attributes?.unit_of_measurement === "°C")
    );
  }, [configTempEntity, tempEntity, areaEntities]);

  // Humidity sensor
  const humiditySensor = useMemo(() =>
    areaEntities.find((e) =>
      e.entity_id.startsWith("sensor.") &&
      e.attributes?.device_class === "humidity"
    ), [areaEntities]);

  // Media player
  const configMediaEntity = props?.media_player_entity as string | undefined;
  const mediaEntity = useEntity(configMediaEntity || "");
  const areaMediaPlayer = useMemo(() => {
    if (configMediaEntity && mediaEntity) return mediaEntity;
    return areaEntities.find((e) => e.entity_id.startsWith("media_player."));
  }, [configMediaEntity, mediaEntity, areaEntities]);

  // Filter entities by domain
  const lights = useMemo(() => areaEntities.filter((e) => e.entity_id.startsWith("light.")), [areaEntities]);
  const covers = useMemo(() => areaEntities.filter((e) => e.entity_id.startsWith("cover.")), [areaEntities]);
  const climates = useMemo(() => areaEntities.filter((e) => e.entity_id.startsWith("climate.")), [areaEntities]);

  // Scenes in this area
  const allScenes = useEntitiesByDomain("scene");
  const areaScenes = useMemo(() =>
    allScenes.filter((s) => entityAreaMap.get(s.entity_id) === areaId),
    [allScenes, entityAreaMap, areaId]
  );

  // Tab state
  const availableTabs = useMemo(() => {
    const tabs: { key: TabKey; label: string; icon: string }[] = [];
    if (lights.length > 0) tabs.push({ key: "light", label: "Licht", icon: "💡" });
    if (covers.length > 0) tabs.push({ key: "cover", label: "Rollos", icon: "🪟" });
    if (climates.length > 0) tabs.push({ key: "climate", label: "Klima", icon: "❄️" });
    return tabs;
  }, [lights, covers, climates]);

  const [activeTab, setActiveTab] = useState<TabKey>("light");

  // Text overview
  const tempValue = areaTempSensor?.state ? parseFloat(areaTempSensor.state) : undefined;
  const humidityValue = humiditySensor?.state ? parseFloat(humiditySensor.state) : undefined;

  const areaName = area?.name || areaId || "Bereich";

  // Handlers
  const handleSceneActivate = useCallback((entityId: string) => {
    callService("scene", "turn_on", {}, { entity_id: entityId });
  }, [callService]);

  const handleMediaToggle = useCallback(() => {
    if (!areaMediaPlayer) return;
    const isPlaying = areaMediaPlayer.state === "playing";
    callService("media_player", isPlaying ? "media_pause" : "media_play", {}, { entity_id: areaMediaPlayer.entity_id });
  }, [callService, areaMediaPlayer]);

  const handleCardAction = useCallback((popupId: string, actionProps?: Record<string, unknown>) => {
    onOpenPopup?.(popupId, actionProps);
  }, [onOpenPopup]);

  const mediaTitle = areaMediaPlayer?.attributes?.media_title as string | undefined;
  const mediaArtist = areaMediaPlayer?.attributes?.media_artist as string | undefined;
  const mediaPlaying = areaMediaPlayer?.state === "playing";
  const mediaPicture = areaMediaPlayer?.attributes?.entity_picture as string | undefined;

  return (
    <PopupModal open title={areaName} icon="home" onClose={onClose}>
      {/* Text overview */}
      <div className="apv2__text-overview">
        {tempValue !== undefined && (
          <>Es ist <span className="apv2__highlight apv2__highlight--warm">{tempValue.toFixed(1)}°</span> im {areaName}</>
        )}
        {tempValue !== undefined && humidityValue !== undefined && " und die Luftfeuchtigkeit betraegt "}
        {humidityValue !== undefined && (
          <span className="apv2__highlight apv2__highlight--info">{humidityValue}%</span>
        )}
        {(tempValue !== undefined || humidityValue !== undefined) && "."}
      </div>

      {/* Scenes */}
      {areaScenes.length > 0 && (
        <div className="apv2__scenes">
          {areaScenes.map((scene) => {
            const name = (scene.attributes?.friendly_name as string) || scene.entity_id.split(".")[1];
            const icon = (scene.attributes?.icon as string) || "🎬";
            return (
              <button
                key={scene.entity_id}
                className="apv2__scene-btn"
                onClick={() => handleSceneActivate(scene.entity_id)}
              >
                <div className="apv2__scene-icon">{icon.startsWith("mdi:") ? "🎬" : icon}</div>
                <div className="apv2__scene-name">{name}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Media player */}
      {areaMediaPlayer && (
        <div className="apv2__media">
          <div className="apv2__media-art">
            {mediaPicture ? (
              <img
                src={apiUrl(`/api/media/artwork?entity_id=${encodeURIComponent(areaMediaPlayer.entity_id)}`)}
                alt=""
                loading="lazy"
              />
            ) : "🎵"}
          </div>
          <div className="apv2__media-info">
            <div className="apv2__media-title">{mediaTitle || (areaMediaPlayer.attributes?.friendly_name as string) || "Media Player"}</div>
            <div className="apv2__media-artist">{mediaArtist || areaMediaPlayer.state}</div>
          </div>
          <button className="apv2__media-play" onClick={handleMediaToggle}>
            {mediaPlaying ? "⏸" : "▶"}
          </button>
        </div>
      )}

      {/* Category tabs */}
      {availableTabs.length > 0 && (
        <div className="apv2__tabs">
          {availableTabs.map((t) => (
            <button
              key={t.key}
              className={`apv2__tab ${activeTab === t.key ? "apv2__tab--active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Entity controls */}
      <div className="apv2__entity-list">
        {activeTab === "light" && lights.map((light) => (
          <LightSliderCard
            key={light.entity_id}
            card={{ id: light.entity_id, type: "light", entity: light.entity_id, size: "1x1", config: {} }}
            callService={callService}
            onCardAction={handleCardAction}
          />
        ))}

        {activeTab === "cover" && covers.map((cover) => {
          const name = (cover.attributes?.friendly_name as string) || cover.entity_id.split(".")[1];
          const isOpen = cover.state === "open";
          const position = cover.attributes?.current_position as number | undefined;
          return (
            <div key={cover.entity_id} style={{
              background: "var(--dh-gray300)",
              borderRadius: "var(--dh-card-radius)",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--dh-gray100)" }}>{name}</div>
                <div style={{ fontSize: 11, color: "var(--dh-gray100)", opacity: 0.5, marginTop: 2 }}>
                  {isOpen ? `Offen${position !== undefined ? ` (${position}%)` : ""}` : "Geschlossen"}
                </div>
              </div>
              <button
                style={{
                  background: isOpen ? "rgba(86,204,242,0.15)" : "rgba(255,255,255,0.08)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  color: isOpen ? "var(--dh-blue)" : "var(--dh-gray100)",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => callService("cover", isOpen ? "close_cover" : "open_cover", {}, { entity_id: cover.entity_id })}
              >
                {isOpen ? "▼" : "▲"}
              </button>
            </div>
          );
        })}

        {activeTab === "climate" && climates.map((climate) => {
          const name = (climate.attributes?.friendly_name as string) || climate.entity_id.split(".")[1];
          const currentTemp = climate.attributes?.current_temperature as number | undefined;
          const targetTemp = climate.attributes?.temperature as number | undefined;
          const mode = climate.state;
          return (
            <div key={climate.entity_id} style={{
              background: "var(--dh-gray300)",
              borderRadius: "var(--dh-card-radius)",
              padding: "12px 16px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--dh-gray100)" }}>{name}</div>
              <div style={{ fontSize: 11, color: "var(--dh-gray100)", opacity: 0.5, marginTop: 4 }}>
                {mode} · Aktuell: {currentTemp !== undefined ? `${currentTemp}°` : "--"}
                {targetTemp !== undefined && ` · Ziel: ${targetTemp}°`}
              </div>
            </div>
          );
        })}
      </div>
    </PopupModal>
  );
}
```

- [ ] **Step 3: Register AreaPopupV2**

Modify `frontend/src/components/popups/index.ts`:

Add import after line 4 (`import { AreaPopup } from "./AreaPopup";`):

```typescript
import { AreaPopupV2 } from "./AreaPopupV2";
```

Add registration after line 15 (`registerPopup("area", AreaPopup);`):

```typescript
registerPopup("area-v2", AreaPopupV2);
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/popups/AreaPopupV2.tsx frontend/src/components/popups/AreaPopupV2.css frontend/src/components/popups/index.ts
git commit -m "feat: add AreaPopupV2 with text overview, scenes, media, and light controls"
```

---

## Chunk 5: Integration & Testing

### Task 9: Full Integration Test

- [ ] **Step 1: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS with 0 errors

- [ ] **Step 2: Verify production build**

Run: `cd frontend && pnpm build`
Expected: Build completes successfully

- [ ] **Step 3: Verify backend tests still pass**

Run: `cd backend && python -m pytest tests/ -v`
Expected: All 11 tests pass

- [ ] **Step 4: Manual testing checklist**

Run: `cd frontend && pnpm dev` and `cd backend && python -m uvicorn app.main:app --port 5050 --reload`

Test each feature:

1. **Weather Badges:** StatusBar shows 3 hourly + 3 daily badges after lights chip. Same height as other chips. Animated weather icons visible.
2. **Weather Popup:** Click any weather badge → popup opens with current weather (big temp + icon), hourly scroll row, daily cards.
3. **Area Card V2:** Add via widget wizard (search "Bereich V2") → appears in grid as 1×1. Edit → Datenquellen tab shows all config fields (area, temp, light, special, media, background).
4. **Area Card V2 Display:** Card shows area name, temperature, entity buttons. Buttons change color based on state. Play button works for media.
5. **Area Popup V2:** Click area card → popup opens with text overview, scenes (if any), media player, light sliders.

- [ ] **Step 5: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: integration fixes for area card and weather features"
```
