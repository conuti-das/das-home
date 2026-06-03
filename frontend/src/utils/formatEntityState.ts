import type { EntityState } from "@/types";

/** HA states that represent "no usable value". */
export const UNAVAILABLE_STATES = new Set(["unavailable", "unknown", "none", ""]);

/** Em dash used as the placeholder for missing/unavailable values. */
export const NO_VALUE = "—";

export function isUnavailable(state: string | undefined | null): boolean {
  return state == null || UNAVAILABLE_STATES.has(state.toLowerCase());
}

export interface FormattedState {
  /** Display string for the value (never the raw "unavailable"). */
  value: string;
  /** Unit to render next to the value — empty when there is no usable value. */
  unit: string;
  /** False when the entity is unavailable/unknown/missing. */
  available: boolean;
}

/**
 * Format an entity's state for display. Handles three cases the cards used to
 * get wrong:
 *  - unavailable/unknown/missing → "—" with NO unit (was "unavailable°C")
 *  - device_class timestamp/date → localized date (was a raw ISO string)
 *  - everything else → raw state + unit_of_measurement
 */
export function formatStateValue(entity: EntityState | undefined): FormattedState {
  const raw = entity?.state;
  if (isUnavailable(raw)) {
    return { value: NO_VALUE, unit: "", available: false };
  }

  const attrs = entity!.attributes ?? {};
  const deviceClass = (attrs.device_class as string) || "";
  const unit = (attrs.unit_of_measurement as string) || "";

  if (deviceClass === "timestamp" || deviceClass === "date") {
    const d = new Date(raw as string);
    if (!Number.isNaN(d.getTime())) {
      const value =
        deviceClass === "date"
          ? d.toLocaleDateString(undefined, { dateStyle: "medium" } as Intl.DateTimeFormatOptions)
          : d.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            } as Intl.DateTimeFormatOptions);
      return { value, unit: "", available: true };
    }
  }

  return { value: raw as string, unit, available: true };
}

/**
 * Parse a numeric state, returning undefined for unavailable/unknown or any
 * non-finite result. Prevents `parseFloat("unavailable")` → NaN leaking into
 * the UI (the AreaCardV2 "NaN°" bug).
 */
export function numericState(entity: EntityState | undefined): number | undefined {
  if (isUnavailable(entity?.state)) return undefined;
  const n = parseFloat(entity!.state);
  return Number.isFinite(n) ? n : undefined;
}

/** Title-case a snake/space separated string: "wohnzimmer_2" → "Wohnzimmer 2". */
export function titleize(text: string): string {
  return text
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Best available display name for an entity:
 * friendly_name (when present) → a prettified form of the entity_id object part
 * (e.g. "media_player.wohnzimmer_2" → "Wohnzimmer 2"). Avoids showing a raw
 * entity_id when an entity is unavailable and has no attributes.
 */
export function entityFriendlyName(entityId: string, entity?: EntityState): string {
  const fn = entity?.attributes?.friendly_name as string | undefined;
  if (fn && fn.trim()) return fn;
  const objectId = entityId.includes(".") ? entityId.split(".").slice(1).join(".") : entityId;
  return titleize(objectId) || entityId;
}
