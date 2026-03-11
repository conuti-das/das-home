# Strip Sections & Sonos Group Card

**Date:** 2026-03-11
**Status:** Approved

## Problem

The dashboard currently renders all cards in a uniform CSS Grid. The user needs a horizontal "card strip" row where cards share the row with flexible width ratios (e.g., weather 20%, trash 40%, Sonos 40%). This strip must be configurable via the wizard with any card type, and a new Sonos Group card is needed.

## Design

### 1. Data Model Changes

**Section** gets a new optional `layout` field:

```typescript
interface Section {
  // ... existing fields (id, title, icon, items, subsections) ...
  layout?: "grid" | "strip";  // NEW - default "grid"
}
```

Note: The field containing cards is `items` (not `cards`) in both frontend and backend.

**CardItem** gets a new optional `flexWeight` field:

```typescript
interface CardItem {
  // ... existing fields ...
  flexWeight?: number;  // only used in strip layout, default 1
}
```

**Backend** (`backend/app/config/models.py`): Add corresponding Pydantic fields with defaults. Use snake_case (`flex_weight`, `layout`) matching existing pattern (`grid_col`/`gridCol` convention). Pydantic's `alias_generator` handles camelCase serialization for the frontend.

### 2. Strip Section Rendering

Strip sections render as a flexbox row instead of CSS Grid:

```
+--------+------------------+------------------+
| 1x     |       2x         |       2x         |
| Wetter |      Muell       |      Sonos       |
|  ~20%  |      ~40%        |      ~40%        |
+--------+------------------+------------------+
```

**Container:** `display: flex; gap: 12px; height: 120px;`
**Cards:** `flex: <flexWeight>` for automatic width distribution.

**GridView.tsx:** When `section.layout === "strip"`, render a flex container instead of the CSS grid. Cards use their `flexWeight` (default 1) for sizing.

**DraggableGrid.tsx:** In edit mode, strip sections support:
- Click to edit individual cards
- "+" button at the end to add cards
- Horizontal drag to reorder
- Edit/delete controls on hover
- No resize handles (width controlled by flexWeight)

### 3. Sonos Group Card (`sonos_group`)

**Registry entry:**
- Type: `sonos_group`
- Category: `spezial`
- Default size: `1x1`
- Compatible domains: `["media_player"]`
- Icon: `media-play`
- Display name: `Sonos Gruppe`
- Description: `Sonos Player gruppieren und steuern`

**Card display (in strip):**
- Speaker icon + "Sonos" label
- Shows current playback info (title/artist, truncated) when active
- Click opens popup

**Popup (`SonosGroupPopup.tsx`):**
- Lists all Sonos `media_player` entities with their current state (playing/paused/idle)
- **Master selection:** The card's configured `entity` is the master player. If not set, use the first Sonos player found.
- **Entity discovery:** Find all `media_player` entities whose `entity_id` contains "sonos" (convention-based). The card does NOT store a list of entities - it discovers them dynamically.
- "Alle gruppieren" button: calls `media_player.join` on the master with `group_members` containing all other Sonos entity_ids
- "Gruppe aufloesen" button (when grouped): calls `media_player.unjoin` on each non-master player
- Media controls: Play/Pause, Next/Previous, Volume (controls the master, which propagates to group)
- Source selection (favorites/playlists if available from master's `source_list` attribute)

### 4. Wizard Integration

**Section creation:**
- When adding a new section, user chooses between "Grid" and "Kartenleiste" (strip)
- Strip sections can contain any card type from the registry

**Card edit in strip (CardEditPopup.tsx):**
- Additional "Gewichtung" (weight) field: choices 1x, 2x, 3x
- Only visible when the card belongs to a strip section

**Edit mode for strips:**
- Cards show edit controls (edit, delete) on hover
- "+" button at end of strip to add new cards
- Horizontal drag-and-drop for reordering within the strip

### 5. Store Changes (dashboardStore.ts)

Existing mutations work for strips since they operate on sections/cards generically. Additional considerations:
- `addCardToSection()`: For strip sections, skip auto-layout (no grid positions needed), set default `flexWeight: 1`
- `resizeCard()`: Not used for strip cards (weight used instead)
- New mutation: `updateCardWeight(viewId, sectionId, cardId, weight)` to set flexWeight

### 6. Files Changed

| File | Change |
|---|---|
| `frontend/src/types/index.ts` | Add `Section.layout`, `CardItem.flexWeight` |
| `backend/app/config/models.py` | Add corresponding Pydantic fields |
| `frontend/src/components/views/GridView.tsx` | Render strip sections as flexbox |
| `frontend/src/components/views/GridView.css` | Strip container/card styles |
| `frontend/src/components/views/DraggableGrid.tsx` | Edit mode for strips |
| `frontend/src/components/views/DraggableGrid.css` | Strip edit styles |
| `frontend/src/components/wizard/CardEditPopup.tsx` | Weight selector for strip cards |
| `frontend/src/components/cards/SonosGroupCard.tsx` | New card component |
| `frontend/src/components/popups/SonosGroupPopup.tsx` | New popup component |
| `frontend/src/components/cards/CardRegistry.ts` | Register `sonos_group` |
| `frontend/src/components/cards/index.ts` | Export `sonos_group` |
| `frontend/src/stores/dashboardStore.ts` | `updateCardWeight` mutation, strip-aware add |

### 7. Non-Goals

- No changes to existing grid behavior (strips are additive)
- No responsive breakpoints for strips (cards shrink proportionally)
- No vertical strips
- No nested strips
- No converting existing grid sections to strip or vice versa (create new section instead)
