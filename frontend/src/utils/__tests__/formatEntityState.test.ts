import { describe, it, expect } from "vitest";
import {
  formatStateValue,
  numericState,
  entityFriendlyName,
  isUnavailable,
  titleize,
  NO_VALUE,
} from "../formatEntityState";
import type { EntityState } from "@/types";

function ent(state: string, attributes: Record<string, unknown> = {}): EntityState {
  return {
    entity_id: "sensor.test",
    state,
    attributes,
    last_changed: "",
    last_updated: "",
  };
}

describe("isUnavailable", () => {
  it("treats unavailable/unknown/empty/null as unavailable", () => {
    expect(isUnavailable("unavailable")).toBe(true);
    expect(isUnavailable("unknown")).toBe(true);
    expect(isUnavailable("")).toBe(true);
    expect(isUnavailable(null)).toBe(true);
    expect(isUnavailable(undefined)).toBe(true);
  });
  it("treats real values as available", () => {
    expect(isUnavailable("21.3")).toBe(false);
    expect(isUnavailable("on")).toBe(false);
  });
});

describe("formatStateValue", () => {
  it("does NOT append a unit to an unavailable state (was 'unavailable°C')", () => {
    const r = formatStateValue(ent("unavailable", { unit_of_measurement: "°C" }));
    expect(r.value).toBe(NO_VALUE);
    expect(r.unit).toBe("");
    expect(r.available).toBe(false);
  });

  it("keeps value + unit for a normal numeric sensor", () => {
    const r = formatStateValue(ent("21.3", { unit_of_measurement: "°C" }));
    expect(r.value).toBe("21.3");
    expect(r.unit).toBe("°C");
    expect(r.available).toBe(true);
  });

  it("formats a timestamp device_class instead of showing a raw ISO string", () => {
    const r = formatStateValue(
      ent("2026-06-03T03:32:01+00:00", { device_class: "timestamp" }),
    );
    expect(r.value).not.toContain("T03:32:01");
    expect(r.unit).toBe("");
    expect(r.available).toBe(true);
  });

  it("returns placeholder for a missing entity", () => {
    const r = formatStateValue(undefined);
    expect(r.value).toBe(NO_VALUE);
    expect(r.available).toBe(false);
  });
});

describe("numericState", () => {
  it("returns undefined for unavailable (no NaN leaking into the UI)", () => {
    expect(numericState(ent("unavailable"))).toBeUndefined();
    expect(numericState(ent("unknown"))).toBeUndefined();
    expect(numericState(undefined)).toBeUndefined();
  });
  it("returns undefined for non-numeric text", () => {
    expect(numericState(ent("idle"))).toBeUndefined();
  });
  it("parses real numbers", () => {
    expect(numericState(ent("21.3"))).toBeCloseTo(21.3);
    expect(numericState(ent("0"))).toBe(0);
  });
});

describe("entityFriendlyName", () => {
  it("uses friendly_name when present", () => {
    expect(entityFriendlyName("media_player.wz", ent("on", { friendly_name: "Wohnzimmer Sonos" }))).toBe(
      "Wohnzimmer Sonos",
    );
  });
  it("prettifies the entity_id when no friendly_name (was raw 'media_player.wohnzimmer_2')", () => {
    expect(entityFriendlyName("media_player.wohnzimmer_2", ent("unavailable"))).toBe("Wohnzimmer 2");
    expect(entityFriendlyName("vacuum.rocktimus_prime", undefined)).toBe("Rocktimus Prime");
  });
});

describe("titleize", () => {
  it("title-cases area names (was lowercase 'wohnzimmer')", () => {
    expect(titleize("wohnzimmer")).toBe("Wohnzimmer");
    expect(titleize("kinder_zimmer")).toBe("Kinder Zimmer");
  });
});
