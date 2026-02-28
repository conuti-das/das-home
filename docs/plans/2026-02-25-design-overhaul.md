# Design Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the generic SAP UI5 dashboard into a premium, mobile-first dark dashboard inspired by the 2026 premium HA dashboard design (pill-shaped cards, color-coded domains, popup modals, bottom navigation).

**Architecture:** Replace SAP UI5 Card/ShellBar/SideNavigation components with custom-styled React components using CSS custom properties for the design system. Keep Zustand stores, hooks, and service layer untouched. The card registry pattern stays, but each card gets a new visual wrapper. Layout shifts from sidebar+grid to a mobile-first single-column with bottom toolbar and popup modals for detail views.

**Tech Stack:** React 19, CSS custom properties (no Tailwind), Zustand, existing WebSocket/API layer. No new dependencies needed.

---

## Design System Reference

From the premium 2026 dashboard (YAML + YouTube screenshots):

### Color Tokens
```css
:root {
  --gray100: #FAFBFC;    /* primary text */
  --gray200: #2A2D35;    /* card backgrounds */
  --gray300: #23262E;    /* section backgrounds */
  --gray400: #1E2028;    /* page background */
  --gray500: #1A1C23;    /* darker surfaces */
  --gray1000: #0D0E12;   /* darkest / thumb color */

  --yellow: #F2C94C;       /* lights domain */
  --yellow-tint: rgba(242, 201, 76, 0.15);
  --red: #EB5757;          /* alerts, low battery */
  --red-tint: rgba(235, 87, 87, 0.15);
  --green: #6FCF97;        /* climate, ok states */
  --green-tint: rgba(111, 207, 151, 0.15);
  --blue: #56CCF2;         /* info, water, media */
  --blue-tint: rgba(86, 204, 242, 0.15);
  --blue-dark: #2D9CDB;
  --orange: #F2994A;       /* warnings, medium states */
  --orange-tint: rgba(242, 153, 74, 0.15);
  --purple: #BB6BD9;       /* automations, scripts */
  --purple-tint: rgba(187, 107, 217, 0.15);
  --pink: #F2A0B7;         /* settings, special */
  --pink-tint: rgba(242, 160, 183, 0.15);
}
```

### Domain-to-Color Mapping
| Domain | Color | Tint |
|--------|-------|------|
| light | --yellow | --yellow-tint |
| switch, input_boolean | --yellow | --yellow-tint |
| climate, fan, humidifier | --green | --green-tint |
| sensor, binary_sensor | --blue | --blue-tint |
| media_player | --blue | --blue-tint |
| cover | --blue | --blue-tint |
| automation, script | --purple | --purple-tint |
| alarm, lock | --red | --red-tint |
| person | --green | --green-tint |
| weather | --blue | --blue-tint |
| camera | --gray200 | n/a |
| scene, button | --orange | --orange-tint |
| vacuum | --green | --green-tint |
| timer | --orange | --orange-tint |
| update | --pink | --pink-tint |
| number, select | --blue | --blue-tint |

### Card Dimensions
- **Big card:** 160px height, 30px border-radius (pill shape)
- **Small card:** 65px height, 30px border-radius
- **Icon circle:** 58px diameter, semi-transparent background `rgba(250,251,252,0.1)`
- **Icon size:** 22px
- **Slider track:** 75px height, 30px border-radius
- **Card padding:** `0 0 12px 20px` (big), `0` (small)
- **Grid gap:** 8px
- **Progress bar:** 30px height inside card bottom

### Typography
- **Card value:** 28px bold (big card), inherit (small card)
- **Card label/name:** 14px, 400 weight, opacity 0.7
- **Section title:** not shown (cards are self-describing)
- **Greeting:** "Hallo [Name]" at top of home view
- **Summary text:** Natural language with inline entity badges

### Layout Patterns
- **Home view:** Greeting header + summary text + floor tabs (Hjem, 1. etg, 2. etg) + card grid
- **Room popup:** Modal overlay with title + icon, pill-shaped tab bar, card list inside
- **Bottom toolbar:** Floating pill-shaped bar with 6-7 icon buttons for quick-access popups
- **No sidebar:** Navigation via bottom toolbar icons, not side panel
- **Mobile-first:** Single column, cards stack vertically, 8px gap

---

## Tasks

### Task 1: Design Tokens CSS File

**Files:**
- Create: `frontend/src/styles/design-tokens.css`
- Modify: `frontend/index.html` (import CSS)

**Step 1: Create the design tokens CSS file**

```css
/* frontend/src/styles/design-tokens.css */
:root {
  /* Grays */
  --dh-gray100: #FAFBFC;
  --dh-gray200: #2A2D35;
  --dh-gray300: #23262E;
  --dh-gray400: #1E2028;
  --dh-gray500: #1A1C23;
  --dh-gray600: #16181E;
  --dh-gray1000: #0D0E12;

  /* Domain colors */
  --dh-yellow: #F2C94C;
  --dh-yellow-tint: rgba(242, 201, 76, 0.15);
  --dh-red: #EB5757;
  --dh-red-tint: rgba(235, 87, 87, 0.15);
  --dh-green: #6FCF97;
  --dh-green-tint: rgba(111, 207, 151, 0.15);
  --dh-blue: #56CCF2;
  --dh-blue-tint: rgba(86, 204, 242, 0.15);
  --dh-blue-dark: #2D9CDB;
  --dh-orange: #F2994A;
  --dh-orange-tint: rgba(242, 153, 74, 0.15);
  --dh-purple: #BB6BD9;
  --dh-purple-tint: rgba(187, 107, 217, 0.15);
  --dh-pink: #F2A0B7;
  --dh-pink-tint: rgba(242, 160, 183, 0.15);

  /* Dimensions */
  --dh-card-radius: 30px;
  --dh-card-height-big: 160px;
  --dh-card-height-small: 65px;
  --dh-icon-size-circle: 58px;
  --dh-icon-size: 22px;
  --dh-grid-gap: 8px;
  --dh-slider-height: 75px;
  --dh-toolbar-height: 56px;

  /* Typography */
  --dh-font-value: 28px;
  --dh-font-label: 14px;
  --dh-font-weight-value: 700;
  --dh-font-weight-label: 400;
}

body {
  background: var(--dh-gray500);
  color: var(--dh-gray100);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
```

**Step 2: Import in index.html**

Add `<link rel="stylesheet" href="/src/styles/design-tokens.css">` to `frontend/index.html` `<head>` section, or import it in `main.tsx` via `import "@/styles/design-tokens.css"`.

**Step 3: Verify the build compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```
feat: add design token CSS with premium color system
```

---

### Task 2: Domain Color Utility

**Files:**
- Create: `frontend/src/utils/domainColors.ts`

**Step 1: Create the domain color mapping utility**

```typescript
// frontend/src/utils/domainColors.ts

export interface DomainStyle {
  color: string;     // CSS variable name for the solid color
  tint: string;      // CSS variable name for the tint/background
  iconBg: string;    // computed rgba for icon circle
}

const DOMAIN_COLORS: Record<string, DomainStyle> = {
  light:               { color: "var(--dh-yellow)",  tint: "var(--dh-yellow-tint)",  iconBg: "rgba(242,201,76,0.15)" },
  switch:              { color: "var(--dh-yellow)",  tint: "var(--dh-yellow-tint)",  iconBg: "rgba(242,201,76,0.15)" },
  input_boolean:       { color: "var(--dh-yellow)",  tint: "var(--dh-yellow-tint)",  iconBg: "rgba(242,201,76,0.15)" },
  climate:             { color: "var(--dh-green)",   tint: "var(--dh-green-tint)",   iconBg: "rgba(111,207,151,0.15)" },
  fan:                 { color: "var(--dh-green)",   tint: "var(--dh-green-tint)",   iconBg: "rgba(111,207,151,0.15)" },
  humidifier:          { color: "var(--dh-green)",   tint: "var(--dh-green-tint)",   iconBg: "rgba(111,207,151,0.15)" },
  sensor:              { color: "var(--dh-blue)",    tint: "var(--dh-blue-tint)",    iconBg: "rgba(86,204,242,0.15)" },
  binary_sensor:       { color: "var(--dh-blue)",    tint: "var(--dh-blue-tint)",    iconBg: "rgba(86,204,242,0.15)" },
  media_player:        { color: "var(--dh-blue)",    tint: "var(--dh-blue-tint)",    iconBg: "rgba(86,204,242,0.15)" },
  cover:               { color: "var(--dh-blue)",    tint: "var(--dh-blue-tint)",    iconBg: "rgba(86,204,242,0.15)" },
  automation:          { color: "var(--dh-purple)",  tint: "var(--dh-purple-tint)",  iconBg: "rgba(187,107,217,0.15)" },
  script:              { color: "var(--dh-purple)",  tint: "var(--dh-purple-tint)",  iconBg: "rgba(187,107,217,0.15)" },
  alarm:               { color: "var(--dh-red)",     tint: "var(--dh-red-tint)",     iconBg: "rgba(235,87,87,0.15)" },
  alarm_control_panel: { color: "var(--dh-red)",     tint: "var(--dh-red-tint)",     iconBg: "rgba(235,87,87,0.15)" },
  lock:                { color: "var(--dh-red)",     tint: "var(--dh-red-tint)",     iconBg: "rgba(235,87,87,0.15)" },
  person:              { color: "var(--dh-green)",   tint: "var(--dh-green-tint)",   iconBg: "rgba(111,207,151,0.15)" },
  weather:             { color: "var(--dh-blue)",    tint: "var(--dh-blue-tint)",    iconBg: "rgba(86,204,242,0.15)" },
  scene:               { color: "var(--dh-orange)",  tint: "var(--dh-orange-tint)",  iconBg: "rgba(242,153,74,0.15)" },
  button:              { color: "var(--dh-orange)",  tint: "var(--dh-orange-tint)",  iconBg: "rgba(242,153,74,0.15)" },
  vacuum:              { color: "var(--dh-green)",   tint: "var(--dh-green-tint)",   iconBg: "rgba(111,207,151,0.15)" },
  camera:              { color: "var(--dh-gray100)", tint: "var(--dh-gray200)",      iconBg: "rgba(250,251,252,0.1)" },
  timer:               { color: "var(--dh-orange)",  tint: "var(--dh-orange-tint)",  iconBg: "rgba(242,153,74,0.15)" },
  update:              { color: "var(--dh-pink)",    tint: "var(--dh-pink-tint)",    iconBg: "rgba(242,160,183,0.15)" },
  number:              { color: "var(--dh-blue)",    tint: "var(--dh-blue-tint)",    iconBg: "rgba(86,204,242,0.15)" },
  select:              { color: "var(--dh-blue)",    tint: "var(--dh-blue-tint)",    iconBg: "rgba(86,204,242,0.15)" },
};

const DEFAULT_STYLE: DomainStyle = {
  color: "var(--dh-gray100)",
  tint: "var(--dh-gray200)",
  iconBg: "rgba(250,251,252,0.1)",
};

export function getDomainStyle(entityIdOrDomain: string): DomainStyle {
  const domain = entityIdOrDomain.includes(".") ? entityIdOrDomain.split(".")[0] : entityIdOrDomain;
  return DOMAIN_COLORS[domain] || DEFAULT_STYLE;
}

export function getDomainFromEntity(entityId: string): string {
  return entityId.split(".")[0];
}
```

**Step 2: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```
feat: add domain color mapping utility
```

---

### Task 3: PillCard Base Component (replaces BaseCard)

**Files:**
- Create: `frontend/src/components/cards/PillCard.tsx`
- Create: `frontend/src/components/cards/PillCard.css`

This is the core visual building block. Replaces the SAP UI5 `<Card>` with a custom pill-shaped card.

**Step 1: Create PillCard CSS**

```css
/* frontend/src/components/cards/PillCard.css */
.pill-card {
  position: relative;
  border-radius: var(--dh-card-radius);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.pill-card:active {
  transform: scale(0.97);
}

.pill-card--big {
  height: var(--dh-card-height-big);
  padding: 16px 20px 12px 20px;
}

.pill-card--small {
  height: var(--dh-card-height-small);
  padding: 0 16px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.pill-card--slider {
  height: var(--dh-slider-height);
  padding: 0;
}

.pill-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.pill-card__label {
  font-size: var(--dh-font-label);
  font-weight: var(--dh-font-weight-label);
  opacity: 0.7;
  line-height: 1.3;
}

.pill-card__value {
  font-size: var(--dh-font-value);
  font-weight: var(--dh-font-weight-value);
  line-height: 1.1;
}

.pill-card__value--small {
  font-size: 16px;
  font-weight: 600;
}

.pill-card__icon-circle {
  width: var(--dh-icon-size-circle);
  height: var(--dh-icon-size-circle);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pill-card__icon-circle svg,
.pill-card__icon-circle ui5-icon {
  width: var(--dh-icon-size);
  height: var(--dh-icon-size);
}

.pill-card__bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 30px;
  border-radius: 0 0 var(--dh-card-radius) var(--dh-card-radius);
  transition: width 0.3s ease;
}

.pill-card__bar-track {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
  border-radius: 0 0 var(--dh-card-radius) var(--dh-card-radius);
  background: rgba(0,0,0,0.15);
}

/* Edit mode overlay */
.pill-card__edit-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  border: 2px dashed var(--dh-gray100);
  border-radius: var(--dh-card-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  cursor: move;
  font-size: 12px;
  opacity: 0.7;
}
```

**Step 2: Create PillCard component**

```tsx
// frontend/src/components/cards/PillCard.tsx
import type { ReactNode } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { getDomainStyle } from "@/utils/domainColors";
import { CardErrorBoundary } from "./CardErrorBoundary";
import "./PillCard.css";

interface PillCardProps {
  entityId: string;          // used for domain color lookup
  label?: string;            // small text (friendly name)
  value?: string | number;   // big text (state value)
  symbol?: string;           // unit suffix
  icon?: string;             // UI5 icon name
  variant?: "big" | "small"; // card size variant
  isOn?: boolean;            // if true, uses solid domain color
  barValue?: number;         // 0-100, shows progress bar
  barColor?: string;         // override bar color
  onClick?: () => void;
  children?: ReactNode;      // for custom content inside card
  cardType: string;          // for edit mode label
}

export function PillCard({
  entityId,
  label,
  value,
  symbol,
  icon,
  variant = "big",
  isOn = false,
  barValue,
  barColor,
  onClick,
  children,
  cardType,
}: PillCardProps) {
  const editMode = useDashboardStore((s) => s.editMode);
  const style = getDomainStyle(entityId);

  const bg = isOn ? style.color : style.tint;
  const textColor = isOn ? "var(--dh-gray1000)" : "var(--dh-gray100)";
  const iconColor = isOn ? "var(--dh-gray1000)" : style.color;
  const actualBarColor = barColor || style.color;

  if (variant === "small") {
    return (
      <CardErrorBoundary cardType={cardType}>
        <div
          className="pill-card pill-card--small"
          style={{ background: bg, color: textColor }}
          onClick={onClick}
        >
          {icon && (
            <div className="pill-card__icon-circle" style={{ background: style.iconBg }}>
              <Icon name={icon} style={{ color: iconColor, width: "var(--dh-icon-size)", height: "var(--dh-icon-size)" }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pill-card__value--small" style={{ color: textColor }}>
              {value}{symbol && <span style={{ opacity: 0.7, marginLeft: 2 }}>{symbol}</span>}
            </div>
            {label && <div className="pill-card__label" style={{ color: textColor }}>{label}</div>}
          </div>
          {children}
          {editMode && <div className="pill-card__edit-overlay">{cardType}</div>}
        </div>
      </CardErrorBoundary>
    );
  }

  return (
    <CardErrorBoundary cardType={cardType}>
      <div
        className="pill-card pill-card--big"
        style={{ background: bg, color: textColor }}
        onClick={onClick}
      >
        <div className="pill-card__top">
          <div className="pill-card__label" style={{ color: textColor }}>{label}</div>
          {icon && (
            <div className="pill-card__icon-circle" style={{ background: style.iconBg }}>
              <Icon name={icon} style={{ color: iconColor, width: "var(--dh-icon-size)", height: "var(--dh-icon-size)" }} />
            </div>
          )}
        </div>
        <div>
          {value !== undefined && (
            <div className="pill-card__value" style={{ color: textColor }}>
              {value}
              {symbol && <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.7, marginLeft: 2 }}>{symbol}</span>}
            </div>
          )}
        </div>
        {children}
        {barValue !== undefined && (
          <>
            <div className="pill-card__bar-track" />
            <div className="pill-card__bar" style={{ width: `${Math.min(100, Math.max(0, barValue))}%`, background: actualBarColor }} />
          </>
        )}
        {editMode && <div className="pill-card__edit-overlay">{cardType}</div>}
      </div>
    </CardErrorBoundary>
  );
}
```

**Step 3: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```
feat: add PillCard component with premium design system
```

---

### Task 4: Rewrite Core Card Components with PillCard

**Files to modify:**
- `frontend/src/components/cards/SensorCard.tsx`
- `frontend/src/components/cards/LightCard.tsx`
- `frontend/src/components/cards/SwitchCard.tsx`
- `frontend/src/components/cards/ClimateCard.tsx`
- `frontend/src/components/cards/BinarySensorCard.tsx`

These are the 5 most-used card types. Each one gets rewritten to use PillCard instead of BaseCard.

**Step 1: Rewrite SensorCard**

```tsx
// frontend/src/components/cards/SensorCard.tsx
import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

const DEVICE_CLASS_ICONS: Record<string, string> = {
  temperature: "temperature",
  humidity: "blur",
  battery: "battery-full",
  power: "electricity",
  energy: "electricity",
  pressure: "measure",
  illuminance: "lightbulb",
  motion: "person-placeholder",
  gas: "weather-proofing",
  co2: "cloud",
};

export function SensorCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const unit = (entity?.attributes?.unit_of_measurement as string) || "";
  const value = entity?.state || "\u2014";
  const deviceClass = (entity?.attributes?.device_class as string) || "";
  const icon = DEVICE_CLASS_ICONS[deviceClass] || "measurement-document";

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={value}
      symbol={unit}
      icon={icon}
      cardType="sensor"
    />
  );
}
```

**Step 2: Rewrite LightCard**

```tsx
// frontend/src/components/cards/LightCard.tsx
import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function LightCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const isOn = entity?.state === "on";
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const brightness = entity?.attributes?.brightness as number | undefined;
  const brightnessPct = brightness !== undefined ? Math.round((brightness / 255) * 100) : 0;

  const toggle = () => {
    callService("light", isOn ? "turn_off" : "turn_on", {}, { entity_id: card.entity });
  };

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={isOn ? `${brightnessPct}%` : "Off"}
      icon="lightbulb"
      isOn={isOn}
      barValue={isOn ? brightnessPct : undefined}
      onClick={toggle}
      cardType="light"
    />
  );
}
```

**Step 3: Rewrite SwitchCard**

```tsx
// frontend/src/components/cards/SwitchCard.tsx
import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function SwitchCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const isOn = entity?.state === "on";
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const domain = card.entity.split(".")[0];

  const toggle = () => {
    callService(domain, "toggle", {}, { entity_id: card.entity });
  };

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={isOn ? "On" : "Off"}
      icon="switch-classes"
      isOn={isOn}
      onClick={toggle}
      variant="small"
      cardType="switch"
    />
  );
}
```

**Step 4: Rewrite BinarySensorCard**

```tsx
// frontend/src/components/cards/BinarySensorCard.tsx
import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function BinarySensorCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const isOn = entity?.state === "on";
  const deviceClass = (entity?.attributes?.device_class as string) || "";
  const icon = deviceClass === "motion" ? "person-placeholder"
    : deviceClass === "door" ? "door"
    : deviceClass === "window" ? "open-command-field"
    : "status-positive";

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={isOn ? "Detected" : "Clear"}
      icon={icon}
      isOn={isOn}
      variant="small"
      cardType="binary_sensor"
    />
  );
}
```

**Step 5: Rewrite ClimateCard**

```tsx
// frontend/src/components/cards/ClimateCard.tsx
import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function ClimateCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const currentTemp = entity?.attributes?.current_temperature as number | undefined;
  const hvacMode = entity?.state || "off";
  const isActive = hvacMode !== "off" && hvacMode !== "unavailable";

  const toggle = () => {
    callService("climate", "set_hvac_mode",
      { hvac_mode: isActive ? "off" : "heat" },
      { entity_id: card.entity }
    );
  };

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={currentTemp !== undefined ? `${currentTemp}` : hvacMode}
      symbol={currentTemp !== undefined ? "\u00B0" : undefined}
      icon="temperature"
      isOn={isActive}
      onClick={toggle}
      cardType="climate"
    />
  );
}
```

**Step 6: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```
feat: rewrite 5 core cards (sensor, light, switch, binary_sensor, climate) with PillCard
```

---

### Task 5: Rewrite Remaining Card Components

**Files to modify:** All remaining card components in `frontend/src/components/cards/`

Each card is rewritten to use PillCard. The pattern is consistent:
- Use `useEntity()` to get state
- Pick an icon, label, value, and whether it's "on"
- Render `<PillCard>` with appropriate props
- Simple cards use `variant="small"`, data-rich cards use `variant="big"`

**Cards and their specs:**

| Card | Variant | Icon | Value | onClick |
|------|---------|------|-------|---------|
| MediaPlayerCard | big | `media-play` | media title or state | play/pause |
| WeatherCard | big | `weather-proofing` | temperature | - |
| PersonCard | small | `person-placeholder` | state (home/away) | - |
| CoverCard | big | `screen` | position % | open/close |
| FanCard | big | `weather-proofing` | speed % | toggle |
| LockCard | small | `locked`/`unlocked` | state | lock/unlock |
| SceneCard | small | `palette` | "Activate" | activate |
| ScriptCard | small | `process` | state | run |
| AutomationCard | small | `process` | on/off | toggle |
| ButtonCard | small | `action` | "Press" | press |
| VacuumCard | big | `inventory` | state | start/stop |
| AlarmCard | big | `alert` | state | - |
| CameraCard | big | `camera` | state | - |
| HumidifierCard | big | `blur` | humidity % | toggle |
| NumberCard | small | `number-sign` | value | - |
| SelectCard | small | `dropdown` | selected | - |
| UpdateCard | small | `download` | state | install |
| TimerCard | big | `fob-watch` | remaining | - |
| CalendarCard | big | `calendar` | next event | - |

**Step 1: Rewrite all remaining cards** following the same pattern as Task 4.

**Step 2: Keep special cards (IframeCard, MarkdownCard, GroupCard, HacsCardBridge) with minimal PillCard wrapping** - these are special content cards that need custom children rendering.

**Step 3: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```
feat: rewrite all remaining cards with PillCard design
```

---

### Task 6: New Layout - Replace Sidebar with Bottom Toolbar

**Files:**
- Create: `frontend/src/components/layout/BottomToolbar.tsx`
- Create: `frontend/src/components/layout/BottomToolbar.css`
- Modify: `frontend/src/App.tsx` (replace Sidebar with BottomToolbar)
- Modify: `frontend/src/components/layout/AppShell.tsx` (remove ShellBar, simplify)

The reference design uses a floating pill-shaped bottom toolbar with icons. Tapping an icon opens a popup modal for that section (energy, music, car, calendar, settings, etc.).

**Step 1: Create BottomToolbar CSS**

```css
/* frontend/src/components/layout/BottomToolbar.css */
.bottom-toolbar {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--dh-gray200);
  border-radius: 28px;
  z-index: 100;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}

.bottom-toolbar__btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--dh-gray100);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

.bottom-toolbar__btn:hover {
  background: rgba(250,251,252,0.1);
}

.bottom-toolbar__btn--active {
  background: rgba(250,251,252,0.15);
}
```

**Step 2: Create BottomToolbar component**

```tsx
// frontend/src/components/layout/BottomToolbar.tsx
import { Icon } from "@ui5/webcomponents-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import "./BottomToolbar.css";

const VIEW_ICONS: Record<string, string> = {
  overview: "home",
  default: "building",
};

export function BottomToolbar() {
  const { dashboard, activeViewId, setActiveViewId } = useDashboardStore();

  if (!dashboard) return null;

  // Show first 7 views max in toolbar
  const visibleViews = dashboard.views.slice(0, 7);

  return (
    <nav className="bottom-toolbar">
      {visibleViews.map((view) => (
        <button
          key={view.id}
          className={`bottom-toolbar__btn ${view.id === activeViewId ? "bottom-toolbar__btn--active" : ""}`}
          onClick={() => setActiveViewId(view.id)}
          title={view.name}
        >
          <Icon
            name={view.icon || VIEW_ICONS[view.id] || VIEW_ICONS.default}
            style={{ width: 20, height: 20 }}
          />
        </button>
      ))}
    </nav>
  );
}
```

**Step 3: Simplify AppShell** - remove ShellBar, keep just a minimal wrapper

```tsx
// frontend/src/components/layout/AppShell.tsx
interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--dh-gray500)",
    }}>
      {children}
    </div>
  );
}
```

**Step 4: Update App.tsx** - replace Sidebar with BottomToolbar, remove AppShell onSettingsClick prop

```tsx
// In App.tsx, the layout becomes:
<AppShell>
  <ConnectionStatus />
  <div style={{ flex: 1, overflow: "auto", paddingBottom: 80 }}>
    <ViewRenderer />
  </div>
  <BottomToolbar />
</AppShell>
```

**Step 5: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```
feat: replace sidebar with floating bottom toolbar navigation
```

---

### Task 7: Greeting Header Component

**Files:**
- Create: `frontend/src/components/layout/GreetingHeader.tsx`
- Modify: `frontend/src/components/views/GridView.tsx` (add greeting to overview)

The reference design shows "Hallo [Name]" with a natural language summary: "Ute er det [weather] og [temp]. Strommed koster [price] og vi bruker [power] med [lights] lys pa."

**Step 1: Create GreetingHeader**

```tsx
// frontend/src/components/layout/GreetingHeader.tsx
import { useEntitiesByDomain, useEntity } from "@/hooks/useEntity";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Gute Nacht";
  if (hour < 12) return "Guten Morgen";
  if (hour < 18) return "Hallo";
  return "Guten Abend";
}

export function GreetingHeader() {
  const weather = useEntity("weather.forecast_home");
  const lights = useEntitiesByDomain("light");
  const lightsOn = lights.filter((e) => e.state === "on").length;

  const temp = weather?.attributes?.temperature as number | undefined;
  const condition = weather?.state || "";

  return (
    <div style={{ padding: "24px 20px 8px 20px" }}>
      <h1 style={{
        fontSize: 28,
        fontWeight: 700,
        color: "var(--dh-gray100)",
        margin: 0,
      }}>
        {getGreeting()}
      </h1>
      <p style={{
        fontSize: 14,
        color: "var(--dh-gray100)",
        opacity: 0.6,
        margin: "8px 0 0 0",
        lineHeight: 1.6,
      }}>
        {temp !== undefined && (
          <>Draussen ist es {condition} und {temp}°. </>
        )}
        {lightsOn > 0 && (
          <>{lightsOn} {lightsOn === 1 ? "Licht" : "Lichter"} eingeschaltet.</>
        )}
      </p>
    </div>
  );
}
```

**Step 2: Add GreetingHeader to GridView for the overview view**

In `GridView.tsx`, add `<GreetingHeader />` at the top when `view.id === "overview"`.

**Step 3: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```
feat: add greeting header with live weather and light summary
```

---

### Task 8: Restyle GridView with Premium Layout

**Files:**
- Modify: `frontend/src/components/views/GridView.tsx`
- Create: `frontend/src/components/views/GridView.css`

The grid should use the 8px gap, 2-column layout for big cards, and single column for small cards. Remove SAP UI5 Title components.

**Step 1: Create GridView CSS**

```css
/* frontend/src/components/views/GridView.css */
.grid-view {
  padding: 0 12px 80px 12px;
  overflow-y: auto;
  flex: 1;
}

.grid-view__section {
  margin-bottom: 16px;
}

.grid-view__section-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--dh-gray100);
  opacity: 0.4;
  padding: 8px 8px 4px 8px;
}

.grid-view__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--dh-grid-gap);
}

.grid-view__grid--single-col {
  grid-template-columns: 1fr;
}
```

**Step 2: Rewrite GridView**

```tsx
// frontend/src/components/views/GridView.tsx
import { getCardComponent } from "@/components/cards";
import { GreetingHeader } from "@/components/layout/GreetingHeader";
import type { ViewConfig } from "@/types";
import "./GridView.css";

interface GridViewProps {
  view: ViewConfig;
  callService: (domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>) => void;
}

// Cards that use small variant render in single-column lists
const SMALL_CARD_TYPES = new Set(["switch", "input_boolean", "button", "automation", "lock", "script", "scene", "binary_sensor", "update", "number", "select", "person"]);

export function GridView({ view, callService }: GridViewProps) {
  const isOverview = view.id === "overview";

  return (
    <div className="grid-view">
      {isOverview && <GreetingHeader />}
      {view.sections.map((section) => {
        const allSmall = section.items.every((c) => SMALL_CARD_TYPES.has(c.type));
        return (
          <div key={section.id} className="grid-view__section">
            <div className="grid-view__section-title">{section.title}</div>
            <div className={`grid-view__grid ${allSmall ? "grid-view__grid--single-col" : ""}`}>
              {section.items.map((card) => {
                const CardComp = getCardComponent(card.type);
                if (!CardComp) return null;
                return <CardComp key={card.id} card={card} callService={callService} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 3: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```
feat: restyle grid view with 2-column pill card layout
```

---

### Task 9: Floor/Area Tab Bar

**Files:**
- Create: `frontend/src/components/layout/TabBar.tsx`
- Create: `frontend/src/components/layout/TabBar.css`

The reference design shows pill-shaped tab buttons (Hjem, 1. etg, 2. etg, Aktuelt, Batterier) for filtering the home view by floor/category.

**Step 1: Create TabBar CSS**

```css
/* frontend/src/components/layout/TabBar.css */
.tab-bar {
  display: flex;
  gap: 6px;
  padding: 8px 20px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tab-bar::-webkit-scrollbar {
  display: none;
}

.tab-bar__tab {
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid rgba(250,251,252,0.15);
  background: transparent;
  color: var(--dh-gray100);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease;
}

.tab-bar__tab:hover {
  background: rgba(250,251,252,0.05);
}

.tab-bar__tab--active {
  background: var(--dh-pink);
  color: var(--dh-gray1000);
  border-color: transparent;
}
```

**Step 2: Create TabBar component**

```tsx
// frontend/src/components/layout/TabBar.tsx
import "./TabBar.css";

interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeId: string;
  onTabChange: (id: string) => void;
}

export function TabBar({ tabs, activeId, onTabChange }: TabBarProps) {
  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-bar__tab ${tab.id === activeId ? "tab-bar__tab--active" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

**Step 3: Wire TabBar into GridView for overview** - show area/floor tabs above the card grid when on the overview view.

**Step 4: Verify build and commit**

```
feat: add pill-shaped tab bar for floor/area filtering
```

---

### Task 10: Popup Modal for Room/Detail Views

**Files:**
- Create: `frontend/src/components/layout/PopupModal.tsx`
- Create: `frontend/src/components/layout/PopupModal.css`

The reference design uses overlay modals (triggered from bottom toolbar) instead of full page navigation. Each modal has a title with icon, tab bar, and scrollable card list.

**Step 1: Create PopupModal CSS**

```css
/* frontend/src/components/layout/PopupModal.css */
.popup-modal__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.popup-modal__sheet {
  width: 100%;
  max-width: 420px;
  max-height: 85vh;
  background: var(--dh-gray400);
  border-radius: 24px 24px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.popup-modal__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 12px 20px;
}

.popup-modal__title {
  font-size: 22px;
  font-weight: 700;
  color: var(--dh-gray100);
}

.popup-modal__close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(250,251,252,0.1);
  color: var(--dh-gray100);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

.popup-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 24px 12px;
}
```

**Step 2: Create PopupModal component**

```tsx
// frontend/src/components/layout/PopupModal.tsx
import { useEffect } from "react";
import { Icon } from "@ui5/webcomponents-react";
import "./PopupModal.css";

interface PopupModalProps {
  open: boolean;
  title: string;
  icon?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function PopupModal({ open, title, icon, onClose, children }: PopupModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="popup-modal__backdrop" onClick={onClose}>
      <div className="popup-modal__sheet" onClick={(e) => e.stopPropagation()}>
        <div className="popup-modal__header">
          {icon && (
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(250,251,252,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={icon} style={{ width: 18, height: 18, color: "var(--dh-gray100)" }} />
            </div>
          )}
          <span className="popup-modal__title">{title}</span>
          <button className="popup-modal__close" onClick={onClose}>
            <Icon name="decline" style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div className="popup-modal__body">{children}</div>
      </div>
    </div>
  );
}
```

**Step 3: Verify build and commit**

```
feat: add popup modal sheet component for room detail views
```

---

### Task 11: Wire Up Popup Navigation from Bottom Toolbar

**Files:**
- Modify: `frontend/src/App.tsx` (add popup state)
- Modify: `frontend/src/components/layout/BottomToolbar.tsx` (trigger popups)
- Modify: `frontend/src/components/views/GridView.tsx` (render inside popup for non-overview views)

**Step 1:** Add state management for which popup is open. When a non-overview view's toolbar icon is tapped, instead of changing `activeViewId`, open a popup showing that view's cards.

The overview view still shows full-page. Room/area views show as popups.

**Step 2: Verify build and commit**

```
feat: wire popup modals to bottom toolbar for room navigation
```

---

### Task 12: Light Slider Card Variant

**Files:**
- Create: `frontend/src/components/cards/LightSliderCard.tsx`
- Create: `frontend/src/components/cards/LightSliderCard.css`

The reference design has a special slider card for dimmable lights: a pill-shaped track where you drag horizontally to set brightness. The fill color is `--yellow`, the track is `--yellow-tint`.

**Step 1: Create the slider card component** with a draggable brightness control inside a pill-shaped container.

**Step 2: Update LightCard** to detect `supported_color_modes` and use the slider variant when brightness is supported.

**Step 3: Verify build and commit**

```
feat: add horizontal light slider card for dimmable lights
```

---

### Task 13: Edit Mode & Settings Access

**Files:**
- Modify: `frontend/src/components/layout/BottomToolbar.tsx` (add settings/edit icons)
- Modify: `frontend/src/App.tsx` (wire settings dialog)

Since we removed the ShellBar, add edit and settings buttons to the bottom toolbar (as the last 2 icons, matching the reference's "..." overflow pattern).

**Step 1:** Add settings gear icon and edit pencil icon to the toolbar.

**Step 2: Verify build and commit**

```
feat: add edit and settings access to bottom toolbar
```

---

### Task 14: Connection Status Restyle

**Files:**
- Modify: `frontend/src/components/layout/ConnectionStatus.tsx`

Change from the SAP UI5 MessageStrip to a subtle dot indicator in the top-right corner.

**Step 1:** Restyle to a small colored dot (green=connected, red=disconnected) positioned absolutely in the top-right.

**Step 2: Verify build and commit**

```
feat: restyle connection status as subtle dot indicator
```

---

### Task 15: Remove SAP UI5 Dependency from Layout Components

**Files:**
- Modify: `frontend/src/components/layout/AppShell.tsx` (already done in Task 6)
- Modify: `frontend/src/components/layout/ViewRenderer.tsx` (remove UI5 FlexBox)
- Delete: `frontend/src/components/layout/Sidebar.tsx` (replaced by BottomToolbar)

Cards still use UI5 `<Icon>`, `<Switch>`, `<Slider>`, `<SegmentedButton>` etc. for interactive controls - that's fine, the library stays for those. But layout should be pure CSS.

**Step 1:** Replace UI5 `FlexBox` and `Title` in ViewRenderer with plain `<div>`.

**Step 2:** Remove Sidebar.tsx import from App.tsx.

**Step 3: Verify build and commit**

```
refactor: remove SAP UI5 from layout components, keep for controls
```

---

### Task 16: Visual Polish & Final Testing

**Files:**
- Modify: Various card and layout files as needed

**Step 1:** Run the full app (`pnpm dev` + backend) and visually inspect:
- Overview with greeting header
- All card types rendering as pill cards
- Bottom toolbar navigation
- Popup modals for rooms
- Light slider interaction
- Edit mode overlay
- Connection status dot

**Step 2:** Fix any visual issues (spacing, colors, icon sizing, overflow).

**Step 3:** Run TypeScript check: `cd frontend && npx tsc --noEmit`

**Step 4:** Run backend tests: `cd backend && python -m pytest tests/ -v`

**Step 5:** Build for production: `cd frontend && pnpm build`

**Step 6: Final commit**

```
style: visual polish and final adjustments for premium design
```

---

## Summary of Changes

| Before | After |
|--------|-------|
| SAP UI5 ShellBar header | No header (clean) |
| 280px sidebar navigation | Floating pill bottom toolbar |
| SAP UI5 Card components | Custom PillCard (160px/65px, 30px radius) |
| Flat dark rectangles | Color-coded domain cards with icon circles |
| Grid with section titles | 2-column grid, small section labels |
| Full-page room views | Popup modal sheets |
| No greeting | "Hallo" with weather + light summary |
| SAP UI5 theming | Custom CSS custom properties |

## Files Created (New)
1. `frontend/src/styles/design-tokens.css`
2. `frontend/src/utils/domainColors.ts`
3. `frontend/src/components/cards/PillCard.tsx`
4. `frontend/src/components/cards/PillCard.css`
5. `frontend/src/components/layout/BottomToolbar.tsx`
6. `frontend/src/components/layout/BottomToolbar.css`
7. `frontend/src/components/layout/GreetingHeader.tsx`
8. `frontend/src/components/layout/TabBar.tsx`
9. `frontend/src/components/layout/TabBar.css`
10. `frontend/src/components/layout/PopupModal.tsx`
11. `frontend/src/components/layout/PopupModal.css`
12. `frontend/src/components/cards/LightSliderCard.tsx`
13. `frontend/src/components/cards/LightSliderCard.css`
14. `frontend/src/components/views/GridView.css`

## Files Modified
1. `frontend/src/main.tsx` (import design-tokens.css)
2. `frontend/src/App.tsx` (new layout structure)
3. `frontend/src/components/layout/AppShell.tsx` (simplified)
4. `frontend/src/components/layout/ViewRenderer.tsx` (remove UI5)
5. `frontend/src/components/layout/ConnectionStatus.tsx` (restyled)
6. `frontend/src/components/views/GridView.tsx` (new layout)
7. All 24+ card components (BaseCard -> PillCard)

## Files Removed
1. `frontend/src/components/layout/Sidebar.tsx` (replaced by BottomToolbar)
