import { describe, it, expect } from "vitest";
import { resolveAreaEntities } from "../resolveAreaEntities";
import type { EntityState } from "@/types";

function ent(entity_id: string, attributes: Record<string, unknown> = {}): EntityState {
  return {
    entity_id,
    state: "on",
    attributes,
    last_changed: "",
    last_updated: "",
  };
}

function ids(list: EntityState[]): string[] {
  return list.map((e) => e.entity_id);
}

describe("resolveAreaEntities", () => {
  it("returns room lights then room switches with empty config", () => {
    const room = [
      ent("switch.fan"),
      ent("light.ceiling"),
      ent("light.lamp"),
      ent("switch.plug"),
    ];
    const result = resolveAreaEntities(room, {});
    // Lights first (in room order), then switches (in room order)
    expect(ids(result)).toEqual(["light.ceiling", "light.lamp", "switch.fan", "switch.plug"]);
  });

  it("excludes non light/switch domains (sensor, cover, climate, media_player)", () => {
    const room = [
      ent("light.lamp"),
      ent("sensor.temp"),
      ent("cover.blind"),
      ent("climate.thermostat"),
      ent("media_player.tv"),
      ent("switch.plug"),
      ent("binary_sensor.motion"),
    ];
    const result = resolveAreaEntities(room, {});
    expect(ids(result)).toEqual(["light.lamp", "switch.plug"]);
  });

  it("removes hidden entities from the visible set", () => {
    const room = [ent("light.ceiling"), ent("light.lamp"), ent("switch.plug")];
    const result = resolveAreaEntities(room, { popup_hidden_entities: ["light.lamp"] });
    expect(ids(result)).toEqual(["light.ceiling", "switch.plug"]);
  });

  it("appends extra entities from another area via allEntities, in config order", () => {
    const room = [ent("light.ceiling")];
    const all = new Map<string, EntityState>([
      ["light.ceiling", room[0]],
      ["switch.garden", ent("switch.garden")],
      ["light.hallway", ent("light.hallway")],
    ]);
    const result = resolveAreaEntities(
      room,
      { popup_extra_entities: ["light.hallway", "switch.garden"] },
      all,
    );
    // Room light first, then extras in their config order
    expect(ids(result)).toEqual(["light.ceiling", "light.hallway", "switch.garden"]);
  });

  it("falls back to areaEntities for extras when allEntities is omitted", () => {
    // Extra that only exists in areaEntities resolves; foreign one is dropped.
    const room = [ent("light.ceiling"), ent("switch.plug")];
    const result = resolveAreaEntities(room, {
      popup_extra_entities: ["switch.plug", "light.foreign"],
    });
    // switch.plug is already a room control → not duplicated as extra.
    // light.foreign cannot be resolved (no allEntities) → skipped.
    expect(ids(result)).toEqual(["light.ceiling", "switch.plug"]);
  });

  it("does not duplicate an entity that is both a room control and listed as extra", () => {
    const room = [ent("light.ceiling"), ent("switch.plug")];
    const all = new Map<string, EntityState>([
      ["light.ceiling", room[0]],
      ["switch.plug", room[1]],
    ]);
    const result = resolveAreaEntities(
      room,
      { popup_extra_entities: ["switch.plug"] },
      all,
    );
    expect(ids(result)).toEqual(["light.ceiling", "switch.plug"]);
  });

  it("filters WLED sub-entities (_segment_/_channel_) from room and extras", () => {
    const room = [
      ent("light.wled"),
      ent("light.wled_segment_1"),
      ent("light.wled_channel_2"),
    ];
    const all = new Map<string, EntityState>([
      ["light.wled", room[0]],
      ["light.other_segment_3", ent("light.other_segment_3")],
    ]);
    const result = resolveAreaEntities(
      room,
      { popup_extra_entities: ["light.other_segment_3"] },
      all,
    );
    expect(ids(result)).toEqual(["light.wled"]);
  });

  it("filters config/diagnostic entity_category from room and extras", () => {
    const room = [
      ent("light.lamp"),
      ent("switch.diag", { entity_category: "diagnostic" }),
      ent("switch.cfg", { entity_category: "config" }),
    ];
    const all = new Map<string, EntityState>([
      ["light.lamp", room[0]],
      ["switch.extra_cfg", ent("switch.extra_cfg", { entity_category: "config" })],
    ]);
    const result = resolveAreaEntities(
      room,
      { popup_extra_entities: ["switch.extra_cfg"] },
      all,
    );
    expect(ids(result)).toEqual(["light.lamp"]);
  });

  it("preserves full ordering: room lights, room switches, then extras", () => {
    const room = [
      ent("switch.a"),
      ent("light.b"),
      ent("switch.c"),
      ent("light.d"),
    ];
    const all = new Map<string, EntityState>([
      ...room.map((e) => [e.entity_id, e] as const),
      ["light.extra1", ent("light.extra1")],
      ["switch.extra2", ent("switch.extra2")],
    ]);
    const result = resolveAreaEntities(
      room,
      { popup_extra_entities: ["switch.extra2", "light.extra1"] },
      all,
    );
    expect(ids(result)).toEqual([
      "light.b",
      "light.d",
      "switch.a",
      "switch.c",
      "switch.extra2",
      "light.extra1",
    ]);
  });
});
