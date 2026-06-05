import type { EntityState } from "@/types";

/**
 * Config slice for resolving the curated, visible entity list of an area popup.
 * Both fields are optional and persisted per area-card in `card.config`.
 */
export interface AreaEntityConfig {
  /** Room entities that should be hidden (auto-visible otherwise). */
  popup_hidden_entities?: string[];
  /** Extra entities to additionally show (may live in other areas). */
  popup_extra_entities?: string[];
}

/**
 * Filter out sub-entities / non-primary controls (WLED segments/channels,
 * config + diagnostic helper entities). Mirrors `isMainLight` in AreaPopupV2.
 */
function isMainControl(e: EntityState): boolean {
  if (e.entity_id.includes("_segment_") || e.entity_id.includes("_channel_")) return false;
  const cat = e.attributes?.entity_category;
  if (cat === "config" || cat === "diagnostic") return false;
  return true;
}

/** Domains that ControlTile knows how to render in the mixed popup list. */
function isControllableDomain(entityId: string): boolean {
  return entityId.startsWith("light.") || entityId.startsWith("switch.");
}

/**
 * Resolve the visible, ordered list of entities shown in a room popup.
 *
 * visible = (room `light.*` + room `switch.*` − popup_hidden_entities)
 *           + popup_extra_entities
 *
 * Ordering of the result is stable:
 *   1. room lights (in `areaEntities` order)
 *   2. room switches (in `areaEntities` order)
 *   3. extra entities (in `popup_extra_entities` order)
 *
 * Extra entities are resolved via `allEntities` (so foreign-area entities work).
 * If `allEntities` is omitted, extras are resolved only from `areaEntities`.
 * Sub-entities (WLED segments/channels) and config/diagnostic helpers are
 * always excluded, including for extras.
 *
 * @param areaEntities All entities belonging to the area (any domain).
 * @param config       The card config slice (hidden + extra lists).
 * @param allEntities  Optional global entity map to resolve foreign extras.
 */
export function resolveAreaEntities(
  areaEntities: EntityState[],
  config: AreaEntityConfig,
  allEntities?: Map<string, EntityState>,
): EntityState[] {
  const hidden = new Set(config.popup_hidden_entities ?? []);
  const extraIds = config.popup_extra_entities ?? [];

  // Room controllable entities, main-only, minus hidden.
  const roomControls = areaEntities.filter(
    (e) => isControllableDomain(e.entity_id) && isMainControl(e) && !hidden.has(e.entity_id),
  );

  const roomLights = roomControls.filter((e) => e.entity_id.startsWith("light."));
  const roomSwitches = roomControls.filter((e) => e.entity_id.startsWith("switch."));

  // Already-included ids so extras never duplicate a room entity.
  const included = new Set<string>([
    ...roomLights.map((e) => e.entity_id),
    ...roomSwitches.map((e) => e.entity_id),
  ]);

  // Fallback lookup from areaEntities when no global map is provided.
  const areaById = new Map<string, EntityState>();
  for (const e of areaEntities) areaById.set(e.entity_id, e);

  const extras: EntityState[] = [];
  for (const id of extraIds) {
    if (included.has(id)) continue; // de-dupe against room + earlier extras
    const ent = allEntities?.get(id) ?? areaById.get(id);
    if (!ent) continue; // unresolved id → skip
    if (!isControllableDomain(ent.entity_id)) continue;
    if (!isMainControl(ent)) continue;
    included.add(id);
    extras.push(ent);
  }

  return [...roomLights, ...roomSwitches, ...extras];
}
