# Strip Sections & Sonos Group Card — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Kartenleiste" (strip) section type that renders cards in a flex row with configurable weights, plus a new Sonos Group card with grouping controls.

**Architecture:** Extend Section with `layout: "grid" | "strip"` and CardItem with `flexWeight`. GridView/DraggableGrid render strips as flexbox. New SonosGroupCard + SonosGroupPopup for media grouping.

**Tech Stack:** React 19, TypeScript, Zustand, @dnd-kit, UI5 Web Components, FastAPI/Pydantic

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `frontend/src/types/index.ts` | Modify | Add `layout` to Section, `flexWeight` to CardItem |
| `backend/app/config/models.py` | Modify | Add `layout` to Section, `flex_weight` to CardItem |
| `frontend/src/components/views/GridView.tsx` | Modify | Render strip sections as flex row |
| `frontend/src/components/views/GridView.css` | Modify | Add `.grid-view__strip` styles |
| `frontend/src/components/views/DraggableGrid.tsx` | Modify | Add strip edit mode (horizontal drag, no resize) |
| `frontend/src/components/views/DraggableGrid.css` | Modify | Add `.draggable-grid--strip` styles |
| `frontend/src/stores/dashboardStore.ts` | Modify | Strip-aware `addCardToSection`, `updateCardWeight` |
| `frontend/src/components/wizard/CardEditPopup.tsx` | Modify | Add weight selector tab for strip cards |
| `frontend/src/components/cards/SonosGroupCard.tsx` | Create | Sonos group card component |
| `frontend/src/components/cards/SonosGroupCard.css` | Create | Sonos card styles |
| `frontend/src/components/cards/index.ts` | Modify | Register `sonos_group` |
| `frontend/src/components/popups/SonosGroupPopup.tsx` | Create | Sonos grouping popup |
| `frontend/src/components/popups/SonosGroupPopup.css` | Create | Popup styles |
| `frontend/src/components/popups/index.ts` | Modify | Register `sonos-group` popup |

---

## Chunk 1: Data Model & Backend

### Task 1: Extend TypeScript types

**Files:**
- Modify: `frontend/src/types/index.ts:29-58`

- [ ] **Step 1: Add `flexWeight` to CardItem interface**

In `frontend/src/types/index.ts`, add after `rowSpan?: number;` (line 43):

```typescript
  flexWeight?: number;
```

- [ ] **Step 2: Add `layout` to Section interface**

In `frontend/src/types/index.ts`, add after `icon: string;` (line 55):

```typescript
  layout?: "grid" | "strip";
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat: add layout and flexWeight to Section/CardItem types"
```

---

### Task 2: Extend Pydantic backend models

**Files:**
- Modify: `backend/app/config/models.py:32-55`

- [ ] **Step 1: Add `flex_weight` to CardItem model**

In `backend/app/config/models.py`, add after `row_span: int | None = None` (line 41):

```python
    flex_weight: int | None = None
```

- [ ] **Step 2: Add `layout` to Section model**

In `backend/app/config/models.py`, add after `icon: str = ""` (line 53):

```python
    layout: str = "grid"
```

- [ ] **Step 3: Run backend tests**

Run: `cd backend && python -m pytest tests/ -v`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add backend/app/config/models.py
git commit -m "feat: add layout and flex_weight to backend models"
```

---

## Chunk 2: Strip Rendering (View Mode)

### Task 3: Add strip CSS styles to GridView

**Files:**
- Modify: `frontend/src/components/views/GridView.css`

- [ ] **Step 1: Add strip container and card styles**

Append to `frontend/src/components/views/GridView.css`:

```css
/* Strip section layout */
.grid-view__strip {
  display: flex;
  gap: var(--dh-grid-gap);
  height: 120px;
}

.grid-view__strip-card {
  min-width: 0;
  overflow: hidden;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/views/GridView.css
git commit -m "feat: add strip section CSS styles"
```

---

### Task 4: Render strip sections in GridView

**Files:**
- Modify: `frontend/src/components/views/GridView.tsx:30-83`

- [ ] **Step 1: Add strip rendering branch in section map**

In `frontend/src/components/views/GridView.tsx`, replace the section rendering logic inside `view.sections.map(...)`. The key change: when `section.layout === "strip"`, render a flex row instead of the CSS grid.

Replace the block starting at line 30 (`{view.sections.map((section) => {`) through line 83 (`})}`):

```tsx
      {view.sections.map((section) => {
        const visibleItems = editMode
          ? section.items
          : section.items.filter((c) => c.visible !== false);

        if (visibleItems.length === 0 && !editMode) return null;

        // Strip layout
        if (section.layout === "strip") {
          if (editMode) {
            return (
              <div key={section.id} className="grid-view__section">
                {section.title && <div className="grid-view__section-title">{section.title}</div>}
                <DraggableGrid
                  section={section}
                  callService={callService}
                  onOpenPopup={onOpenPopup}
                />
              </div>
            );
          }

          return (
            <div key={section.id} className="grid-view__section">
              {section.title && <div className="grid-view__section-title">{section.title}</div>}
              <div className="grid-view__strip">
                {visibleItems.map((card) => {
                  const CardComp = getCardComponent(card.type);
                  if (!CardComp) return null;
                  return (
                    <div
                      key={card.id}
                      className="grid-view__strip-card"
                      style={{ flex: card.flexWeight || 1 }}
                    >
                      <CardComp
                        card={card}
                        callService={callService}
                        onCardAction={onOpenPopup}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // Grid layout (existing)
        const allSmall = visibleItems.every((c) => SMALL_CARD_TYPES.has(c.type));

        if (editMode) {
          return (
            <div key={section.id} className="grid-view__section">
              <div className="grid-view__section-title">{section.title}</div>
              <DraggableGrid
                section={section}
                callService={callService}
                onOpenPopup={onOpenPopup}
              />
            </div>
          );
        }

        const hasPositions = visibleItems.some((c) => c.gridCol != null && c.gridRow != null);

        return (
          <div key={section.id} className="grid-view__section">
            <div className="grid-view__section-title">{section.title}</div>
            <div className={`grid-view__grid ${allSmall ? "grid-view__grid--single-col" : ""} ${hasPositions ? "grid-view__grid--positioned" : ""}`}>
              {visibleItems.map((card) => {
                const CardComp = getCardComponent(card.type);
                if (!CardComp) return null;

                const pos = getCardPosition(card);
                const span = getCardSpan(card);
                const gridStyle = pos ? {
                  gridColumn: `${pos.gridCol} / span ${span.colSpan}`,
                  gridRow: `${pos.gridRow} / span ${span.rowSpan}`,
                } : undefined;

                return (
                  <div key={card.id} style={gridStyle}>
                    <CardComp
                      card={card}
                      callService={callService}
                      onCardAction={onOpenPopup}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/views/GridView.tsx
git commit -m "feat: render strip sections as flexbox in GridView"
```

---

## Chunk 3: Strip Edit Mode

### Task 5: Add strip styles to DraggableGrid CSS

**Files:**
- Modify: `frontend/src/components/views/DraggableGrid.css`

- [ ] **Step 1: Add strip-mode styles**

Append to `frontend/src/components/views/DraggableGrid.css`:

```css
/* Strip mode */
.draggable-grid--strip {
  display: flex;
  gap: var(--dh-grid-gap);
  height: 120px;
  min-height: 120px;
  position: relative;
}

.draggable-grid--strip .draggable-grid__item {
  min-width: 0;
  height: 100%;
}

.draggable-grid--strip .draggable-grid__overlay {
  display: none;
}

.draggable-grid--strip .draggable-grid__resize-handle {
  display: none;
}

.draggable-grid--strip .draggable-grid__size-badge {
  display: none;
}

/* Weight badge for strip cards */
.draggable-grid__weight-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: var(--dh-gray100);
  font-size: 10px;
  font-weight: 600;
  font-family: monospace;
  pointer-events: none;
  z-index: 5;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.draggable-grid__item:hover .draggable-grid__weight-badge {
  opacity: 1;
}

/* Add button for strip sections */
.draggable-grid__strip-add {
  width: 48px;
  flex-shrink: 0;
  border-radius: var(--dh-card-radius);
  border: 2px dashed rgba(250, 251, 252, 0.15);
  background: none;
  color: rgba(250, 251, 252, 0.3);
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.draggable-grid__strip-add:hover {
  border-color: var(--dh-blue);
  color: var(--dh-blue);
  background: rgba(86, 204, 242, 0.05);
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/views/DraggableGrid.css
git commit -m "feat: add strip edit mode CSS styles"
```

---

### Task 6: Update DraggableGrid for strip mode

**Files:**
- Modify: `frontend/src/components/views/DraggableGrid.tsx`

- [ ] **Step 1: Add strip awareness to DraggableCard**

In `DraggableCard`, add a `isStrip` prop and conditionally show weight badge instead of size badge, hide resize handle. Add after the `gridMetrics` prop in the DraggableCard function signature (line 38-43):

```typescript
  isStrip?: boolean;
```

In the DraggableCard component, adjust the style computation. Replace the `style` const (lines 59-66):

```typescript
  const style: React.CSSProperties = isStrip
    ? {
        flex: card.flexWeight || 1,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
        transform: transform ? `translate(${transform.x}px, 0)` : undefined,
        transition: isDragging ? undefined : "box-shadow 0.2s ease",
        height: "100%",
        minWidth: 0,
      }
    : {
        gridColumn: pos ? `${pos.gridCol} / span ${displaySpan.colSpan}` : undefined,
        gridRow: pos ? `${pos.gridRow} / span ${displaySpan.rowSpan}` : undefined,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : isResizing ? 40 : "auto",
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        transition: isDragging ? undefined : "box-shadow 0.2s ease",
      };
```

Replace the size badge div (line 182-184) with a conditional:

```tsx
        {isStrip ? (
          <div className="draggable-grid__weight-badge">
            {card.flexWeight || 1}x
          </div>
        ) : (
          <div className="draggable-grid__size-badge">
            {displaySpan.colSpan}x{displaySpan.rowSpan}
          </div>
        )}
```

- [ ] **Step 2: Update DraggableGrid to detect strip mode**

In the `DraggableGrid` component (line 199), add strip detection and change the container class. Replace the return block (lines 262-279):

```tsx
  const isStrip = section.layout === "strip";

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        ref={gridRef}
        className={`draggable-grid ${isStrip ? "draggable-grid--strip" : "draggable-grid--edit"}`}
      >
        {!isStrip && <div className="draggable-grid__overlay" />}
        {section.items.map((card) => (
          <DraggableCard
            key={card.id}
            card={card}
            sectionId={section.id}
            callService={callService}
            onOpenPopup={onOpenPopup}
            gridMetrics={gridMetrics}
            isStrip={isStrip}
          />
        ))}
        {isStrip && (
          <button
            className="draggable-grid__strip-add"
            title="Karte hinzufuegen"
            onClick={() => onOpenPopup?.("widget-wizard", { sectionId: section.id })}
          >
            +
          </button>
        )}
      </div>
    </DndContext>
  );
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/views/DraggableGrid.tsx
git commit -m "feat: strip mode support in DraggableGrid"
```

---

## Chunk 4: Store & Wizard Changes

### Task 7: Add strip-aware store mutations

**Files:**
- Modify: `frontend/src/stores/dashboardStore.ts`

- [ ] **Step 1: Add `updateCardWeight` to store interface**

Add to the `DashboardStore` interface (after line 22):

```typescript
  updateCardWeight: (sectionId: string, cardId: string, weight: number) => void;
```

- [ ] **Step 2: Make `addCardToSection` strip-aware**

Replace the `addCardToSection` implementation (lines 69-79):

```typescript
  addCardToSection: (sectionId, card) => {
    const { dashboard, activeViewId } = get();
    if (!dashboard) return;
    const newDashboard = structuredClone(dashboard);
    const section = findSection(newDashboard, activeViewId, sectionId);
    if (!section) return;
    const newCard = { ...card, order: section.items.length } as CardItem;
    if (section.layout === "strip") {
      newCard.flexWeight = 1;
    }
    section.items.push(newCard);
    if (section.layout !== "strip") {
      section.items = autoAssignPositions(section.items, 4);
    }
    set({ dashboard: newDashboard });
  },
```

- [ ] **Step 3: Implement `updateCardWeight`**

Add after `autoLayoutSection` (before the closing `}));`):

```typescript
  updateCardWeight: (sectionId, cardId, weight) => {
    const { dashboard, activeViewId } = get();
    if (!dashboard) return;
    const newDashboard = structuredClone(dashboard);
    const section = findSection(newDashboard, activeViewId, sectionId);
    if (!section) return;
    const card = section.items.find((item) => item.id === cardId);
    if (!card) return;
    card.flexWeight = weight;
    set({ dashboard: newDashboard });
  },
```

- [ ] **Step 4: Also make `migrateCards` skip strip sections**

In `migrateCards` (line 37-39), wrap the autoAssign in a layout check:

```typescript
    for (const section of view.sections) {
      if (section.layout !== "strip") {
        section.items = autoAssignPositions(section.items, colCount);
      }
    }
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add frontend/src/stores/dashboardStore.ts
git commit -m "feat: strip-aware store mutations and updateCardWeight"
```

---

### Task 8: Add weight selector to CardEditPopup

**Files:**
- Modify: `frontend/src/components/wizard/CardEditPopup.tsx`

- [ ] **Step 1: Add weight state and section layout detection**

Add import for `Section` type at line 7:

```typescript
import type { CardItem, Section } from "@/types";
```

Update the `CardEditPopupProps` interface (line 9-14) to include section layout:

```typescript
interface CardEditPopupProps {
  open: boolean;
  onClose: () => void;
  sectionId: string;
  card: CardItem;
  sectionLayout?: "grid" | "strip";
}
```

In the component function, destructure `sectionLayout` and add weight state:

```typescript
export function CardEditPopup({ open, onClose, sectionId, card, sectionLayout }: CardEditPopupProps) {
```

Add after `const [customColor, setCustomColor] = useState(...)` (line 35):

```typescript
  const [flexWeight, setFlexWeight] = useState(card.flexWeight ?? 1);
```

- [ ] **Step 2: Add weight tab for strip cards**

Update the tabs array (lines 59-64). Replace with:

```typescript
  const isStrip = sectionLayout === "strip";

  const tabs = [
    { key: "type" as const, label: "Widget" },
    ...(isStrip
      ? [{ key: "weight" as const, label: "Gewichtung" }]
      : [{ key: "size" as const, label: "Groesse" }]),
    { key: "styling" as const, label: "Styling" },
    { key: "entity" as const, label: "Entity" },
  ];
```

Update the tab state type (line 30):

```typescript
  const [tab, setTab] = useState<"type" | "size" | "weight" | "styling" | "entity">("type");
```

- [ ] **Step 3: Add weight tab content**

Add after the size tab content block (after line 118):

```tsx
        {/* Weight tab (strip only) */}
        {tab === "weight" && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[1, 2, 3].map((w) => (
              <button
                key={w}
                className={`sz__option ${w === flexWeight ? "sz__option--active" : ""}`}
                onClick={() => setFlexWeight(w)}
                style={{ padding: "16px 24px" }}
              >
                <span className="sz__label">{w}x</span>
              </button>
            ))}
          </div>
        )}
```

- [ ] **Step 4: Include flexWeight in handleSave**

Update `handleSave` (lines 40-57) to include flexWeight for strip cards:

```typescript
  const handleSave = useCallback(() => {
    const { colSpan, rowSpan } = parseSizeString(cardSize);
    const updates: Partial<CardItem> = {
      type: cardType,
      size: cardSize,
      colSpan,
      rowSpan,
      customLabel: customLabel || undefined,
      customIcon: customIcon || undefined,
      customColor: customColor || undefined,
    };
    if (sectionLayout === "strip") {
      updates.flexWeight = flexWeight;
    }
    updateCardConfig(sectionId, card.id, updates);
    const current = useDashboardStore.getState().dashboard;
    if (current) {
      api.putDashboard(current).catch(console.error);
    }
    onClose();
  }, [sectionId, card.id, cardType, cardSize, customLabel, customIcon, customColor, flexWeight, sectionLayout, updateCardConfig, onClose]);
```

- [ ] **Step 5: Pass `sectionLayout` from DraggableCard**

In `frontend/src/components/views/DraggableGrid.tsx`, update the `CardEditPopup` usage in `DraggableCard` (around line 188):

```tsx
      {showEdit && (
        <CardEditPopup
          open={showEdit}
          onClose={() => setShowEdit(false)}
          sectionId={sectionId}
          card={card}
          sectionLayout={isStrip ? "strip" : "grid"}
        />
      )}
```

This requires `isStrip` to be available in `DraggableCard`. Add it as a prop (already done in Task 6).

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/wizard/CardEditPopup.tsx frontend/src/components/views/DraggableGrid.tsx
git commit -m "feat: weight selector in CardEditPopup for strip cards"
```

---

## Chunk 5: Sonos Group Card & Popup

### Task 9: Create SonosGroupCard component

**Files:**
- Create: `frontend/src/components/cards/SonosGroupCard.tsx`
- Create: `frontend/src/components/cards/SonosGroupCard.css`

- [ ] **Step 1: Create SonosGroupCard.css**

Create `frontend/src/components/cards/SonosGroupCard.css`:

```css
.sonos-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  height: 100%;
  border-radius: var(--dh-card-radius);
  background: var(--dh-gray400);
  cursor: pointer;
  overflow: hidden;
  transition: background 0.15s ease;
}

.sonos-card:hover {
  background: var(--dh-gray300);
}

.sonos-card__icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(86, 204, 242, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sonos-card__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.sonos-card__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--dh-gray100);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sonos-card__now-playing {
  font-size: 11px;
  color: var(--dh-gray100);
  opacity: 0.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sonos-card__count {
  font-size: 11px;
  color: var(--dh-blue);
  font-weight: 600;
  flex-shrink: 0;
}
```

- [ ] **Step 2: Create SonosGroupCard.tsx**

Create `frontend/src/components/cards/SonosGroupCard.tsx`:

```tsx
import { Icon } from "@ui5/webcomponents-react";
import { useEntitiesByDomain } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";
import "./SonosGroupCard.css";

export function SonosGroupCard({ card, onCardAction }: CardComponentProps) {
  const allPlayers = useEntitiesByDomain("media_player");
  const sonosPlayers = allPlayers.filter(
    (e) => e.entity_id.includes("sonos") || (e.attributes.friendly_name as string || "").toLowerCase().includes("sonos")
  );

  const activePlayers = sonosPlayers.filter((e) => e.state === "playing" || e.state === "paused");
  const activePlayer = activePlayers[0];
  const mediaTitle = activePlayer ? (activePlayer.attributes.media_title as string) || "" : "";
  const mediaArtist = activePlayer ? (activePlayer.attributes.media_artist as string) || "" : "";
  const nowPlaying = mediaTitle ? `${mediaTitle}${mediaArtist ? ` - ${mediaArtist}` : ""}` : "";

  const handleClick = () => {
    onCardAction?.("sonos-group", { entityId: card.entity });
  };

  return (
    <div className="sonos-card" onClick={handleClick}>
      <div className="sonos-card__icon">
        <Icon name="media-play" style={{ width: 18, height: 18, color: "var(--dh-blue)" }} />
      </div>
      <div className="sonos-card__info">
        <span className="sonos-card__label">{card.customLabel || "Sonos"}</span>
        {nowPlaying ? (
          <span className="sonos-card__now-playing">{nowPlaying}</span>
        ) : (
          <span className="sonos-card__now-playing">{sonosPlayers.length} Player</span>
        )}
      </div>
      {activePlayers.length > 0 && (
        <span className="sonos-card__count">{activePlayers.length} aktiv</span>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/cards/SonosGroupCard.tsx frontend/src/components/cards/SonosGroupCard.css
git commit -m "feat: create SonosGroupCard component"
```

---

### Task 10: Register SonosGroupCard in CardRegistry

**Files:**
- Modify: `frontend/src/components/cards/index.ts`

- [ ] **Step 1: Import and register**

Add import after the VehicleCard import (line 33):

```typescript
import { SonosGroupCard } from "./SonosGroupCard";
```

Add registration after the vehicle registration (before the exports, after line 325):

```typescript
registerCard("sonos_group", SonosGroupCard, {
  displayName: "Sonos Gruppe",
  description: "Sonos Player gruppieren und gemeinsam steuern",
  category: "spezial",
  compatibleDomains: ["media_player"],
  defaultSize: "1x1",
  iconName: "media-play",
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/cards/index.ts
git commit -m "feat: register sonos_group card type"
```

---

### Task 11: Create SonosGroupPopup

**Files:**
- Create: `frontend/src/components/popups/SonosGroupPopup.tsx`
- Create: `frontend/src/components/popups/SonosGroupPopup.css`

- [ ] **Step 1: Create SonosGroupPopup.css**

Create `frontend/src/components/popups/SonosGroupPopup.css`:

```css
.sonos-popup__players {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.sonos-popup__player {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--dh-card-radius-sm);
  background: rgba(250, 251, 252, 0.05);
}

.sonos-popup__player--active {
  background: rgba(86, 204, 242, 0.1);
}

.sonos-popup__player-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(250, 251, 252, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sonos-popup__player-info {
  flex: 1;
  min-width: 0;
}

.sonos-popup__player-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--dh-gray100);
}

.sonos-popup__player-state {
  font-size: 11px;
  color: var(--dh-gray100);
  opacity: 0.5;
}

.sonos-popup__actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.sonos-popup__btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: var(--dh-card-radius-sm);
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.sonos-popup__btn--primary {
  background: var(--dh-blue);
  color: #fff;
}

.sonos-popup__btn--primary:hover {
  background: #3dbde8;
}

.sonos-popup__btn--secondary {
  background: rgba(250, 251, 252, 0.08);
  color: var(--dh-gray100);
}

.sonos-popup__btn--secondary:hover {
  background: rgba(250, 251, 252, 0.12);
}

.sonos-popup__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px 0;
}

.sonos-popup__control-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(250, 251, 252, 0.08);
  color: var(--dh-gray100);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

.sonos-popup__control-btn:hover {
  background: rgba(250, 251, 252, 0.15);
}

.sonos-popup__control-btn--play {
  width: 56px;
  height: 56px;
  background: var(--dh-blue);
  color: #fff;
}

.sonos-popup__control-btn--play:hover {
  background: #3dbde8;
}

.sonos-popup__volume {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.sonos-popup__volume-slider {
  flex: 1;
  accent-color: var(--dh-blue);
}

.sonos-popup__volume-label {
  font-size: 12px;
  color: var(--dh-gray100);
  opacity: 0.6;
  width: 32px;
  text-align: right;
}

.sonos-popup__section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--dh-gray100);
  opacity: 0.4;
  padding: 8px 0 4px 0;
}

.sonos-popup__source-select {
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--dh-card-radius-sm);
  border: 1px solid rgba(250, 251, 252, 0.1);
  background: rgba(250, 251, 252, 0.05);
  color: var(--dh-gray100);
  font-size: 13px;
}
```

- [ ] **Step 2: Create SonosGroupPopup.tsx**

Create `frontend/src/components/popups/SonosGroupPopup.tsx`:

```tsx
import { useMemo, useState } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { PopupModal } from "@/components/layout/PopupModal";
import { useEntitiesByDomain } from "@/hooks/useEntity";
import type { PopupProps } from "./PopupRegistry";
import "./SonosGroupPopup.css";

export function SonosGroupPopup({ onClose, callService, props }: PopupProps) {
  const masterEntityId = (props?.entityId as string) || "";
  const allPlayers = useEntitiesByDomain("media_player");

  const sonosPlayers = useMemo(
    () => allPlayers.filter(
      (e) => e.entity_id.includes("sonos") || (e.attributes.friendly_name as string || "").toLowerCase().includes("sonos")
    ),
    [allPlayers]
  );

  const master = sonosPlayers.find((e) => e.entity_id === masterEntityId) || sonosPlayers[0];
  const masterAttrs = master?.attributes || {};
  const isPlaying = master?.state === "playing";

  // Check if grouped: master has group_members with more than itself
  const groupMembers = (masterAttrs.group_members as string[]) || [];
  const isGrouped = groupMembers.length > 1;

  const volume = (masterAttrs.volume_level as number) ?? 0;
  const volumePercent = Math.round(volume * 100);

  const sourceList = (masterAttrs.source_list as string[]) || [];
  const currentSource = (masterAttrs.source as string) || "";
  const mediaTitle = (masterAttrs.media_title as string) || "";
  const mediaArtist = (masterAttrs.media_artist as string) || "";

  const [selectedSource, setSelectedSource] = useState(currentSource);

  const handleGroupAll = () => {
    if (!master) return;
    const otherIds = sonosPlayers
      .filter((e) => e.entity_id !== master.entity_id)
      .map((e) => e.entity_id);
    if (otherIds.length === 0) return;
    callService("media_player", "join", { group_members: otherIds }, { entity_id: master.entity_id });
  };

  const handleUngroupAll = () => {
    if (!master) return;
    const otherIds = sonosPlayers
      .filter((e) => e.entity_id !== master.entity_id)
      .map((e) => e.entity_id);
    for (const id of otherIds) {
      callService("media_player", "unjoin", {}, { entity_id: id });
    }
  };

  const handlePlayPause = () => {
    if (!master) return;
    callService("media_player", "media_play_pause", {}, { entity_id: master.entity_id });
  };

  const handleNext = () => {
    if (!master) return;
    callService("media_player", "media_next_track", {}, { entity_id: master.entity_id });
  };

  const handlePrev = () => {
    if (!master) return;
    callService("media_player", "media_previous_track", {}, { entity_id: master.entity_id });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!master) return;
    const val = parseInt(e.target.value, 10) / 100;
    callService("media_player", "volume_set", { volume_level: val }, { entity_id: master.entity_id });
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!master) return;
    setSelectedSource(e.target.value);
    callService("media_player", "select_source", { source: e.target.value }, { entity_id: master.entity_id });
  };

  return (
    <PopupModal open title="Sonos Gruppe" icon="media-play" onClose={onClose}>
      {/* Player list */}
      <div className="sonos-popup__section-title">Player</div>
      <div className="sonos-popup__players">
        {sonosPlayers.map((player) => {
          const name = (player.attributes.friendly_name as string) || player.entity_id;
          const isActive = player.state === "playing" || player.state === "paused";
          const inGroup = groupMembers.includes(player.entity_id);
          return (
            <div key={player.entity_id} className={`sonos-popup__player ${isActive ? "sonos-popup__player--active" : ""}`}>
              <div className="sonos-popup__player-icon">
                <Icon
                  name={inGroup ? "chain-link" : "media-play"}
                  style={{ width: 16, height: 16, color: inGroup ? "var(--dh-blue)" : "rgba(250,251,252,0.4)" }}
                />
              </div>
              <div className="sonos-popup__player-info">
                <div className="sonos-popup__player-name">{name}</div>
                <div className="sonos-popup__player-state">{player.state}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Group actions */}
      <div className="sonos-popup__actions">
        {isGrouped ? (
          <button className="sonos-popup__btn sonos-popup__btn--secondary" onClick={handleUngroupAll}>
            Gruppe aufloesen
          </button>
        ) : (
          <button className="sonos-popup__btn sonos-popup__btn--primary" onClick={handleGroupAll}>
            Alle gruppieren
          </button>
        )}
      </div>

      {/* Now playing */}
      {mediaTitle && (
        <>
          <div className="sonos-popup__section-title">Wiedergabe</div>
          <div style={{ padding: "4px 0 8px 0", color: "var(--dh-gray100)", fontSize: 13 }}>
            <strong>{mediaTitle}</strong>
            {mediaArtist && <span style={{ opacity: 0.5 }}> — {mediaArtist}</span>}
          </div>
        </>
      )}

      {/* Playback controls */}
      <div className="sonos-popup__controls">
        <button className="sonos-popup__control-btn" onClick={handlePrev}>
          <Icon name="media-rewind" style={{ width: 20, height: 20 }} />
        </button>
        <button className="sonos-popup__control-btn sonos-popup__control-btn--play" onClick={handlePlayPause}>
          <Icon name={isPlaying ? "media-pause" : "media-play"} style={{ width: 24, height: 24 }} />
        </button>
        <button className="sonos-popup__control-btn" onClick={handleNext}>
          <Icon name="media-forward" style={{ width: 20, height: 20 }} />
        </button>
      </div>

      {/* Volume */}
      <div className="sonos-popup__section-title">Lautstaerke</div>
      <div className="sonos-popup__volume">
        <Icon name="sound" style={{ width: 16, height: 16, color: "rgba(250,251,252,0.4)" }} />
        <input
          type="range"
          className="sonos-popup__volume-slider"
          min={0}
          max={100}
          value={volumePercent}
          onChange={handleVolumeChange}
        />
        <span className="sonos-popup__volume-label">{volumePercent}%</span>
      </div>

      {/* Source selection */}
      {sourceList.length > 0 && (
        <>
          <div className="sonos-popup__section-title">Quelle</div>
          <select
            className="sonos-popup__source-select"
            value={selectedSource}
            onChange={handleSourceChange}
          >
            {sourceList.map((src) => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </>
      )}
    </PopupModal>
  );
}
```

- [ ] **Step 3: Register popup**

In `frontend/src/components/popups/index.ts`, add import:

```typescript
import { SonosGroupPopup } from "./SonosGroupPopup";
```

Add registration:

```typescript
registerPopup("sonos-group", SonosGroupPopup);
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/popups/SonosGroupPopup.tsx frontend/src/components/popups/SonosGroupPopup.css frontend/src/components/popups/index.ts
git commit -m "feat: create SonosGroupPopup with grouping and media controls"
```

---

## Chunk 6: Integration & Testing

### Task 12: Build verification and final commit

**Files:**
- All modified/created files

- [ ] **Step 1: Run TypeScript check**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run frontend build**

Run: `cd frontend && pnpm build`
Expected: Build succeeds

- [ ] **Step 3: Run backend tests**

Run: `cd backend && python -m pytest tests/ -v`
Expected: All tests pass

- [ ] **Step 4: Manual smoke test**

Start dev servers:
```bash
cd backend && python -m uvicorn app.main:app --port 5050 --reload &
cd frontend && pnpm dev
```

Verify:
1. Open dashboard at http://localhost:3000
2. Enter edit mode
3. Existing grid sections work as before
4. If a strip section exists in config, it renders as a horizontal flex row
5. Cards in strip show weight badges in edit mode
6. Sonos card opens popup when clicked

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: integration fixes for strip sections"
```

---

## Follow-Up (Out of Scope)

These items from the spec are deferred as the codebase currently has no section creation wizard (sections are created in the setup wizard or via YAML config):

- **Section creation wizard with layout type selection**: Currently no UI exists to create sections interactively. When this is built, it should include a "Grid" vs "Kartenleiste" choice. For now, strip sections are created by setting `layout: "strip"` in the dashboard config.
- **Horizontal drag reorder within strips**: The DnD infrastructure is in place but the drag handler currently calculates grid positions. A strip-specific handler that reorders items array by horizontal delta would be a natural enhancement.
