import { beforeEach, describe, expect, it } from "vitest";
import { useDashboardStore } from "@/stores/dashboardStore";
import type { DashboardConfig, CardItem } from "@/types";

function card(id: string, config: Record<string, unknown> = {}): CardItem {
  return { id, type: "light", entity: `light.${id}`, size: "1x1", config };
}

function makeDashboard(): DashboardConfig {
  return {
    version: 1,
    theme: "dark",
    accent_color: "#56CCF2",
    auto_theme: false,
    sidebar_visible: true,
    default_view: "home",
    views: [
      {
        id: "home",
        name: "Home",
        icon: "home",
        type: "grid",
        area: "",
        header: { show_badges: false, badges: [] },
        layout: {},
        sections: [
          {
            id: "s1",
            title: "Sec 1",
            icon: "home",
            items: [card("a", { foo: 1 }), card("b")],
            subsections: [],
          },
          {
            id: "s2",
            title: "Sec 2",
            icon: "home",
            items: [card("c", { popup_hidden_entities: ["light.x"] })],
            subsections: [],
          },
        ],
      },
      {
        id: "other",
        name: "Other",
        icon: "home",
        type: "grid",
        area: "",
        header: { show_badges: false, badges: [] },
        layout: {},
        sections: [
          {
            id: "s3",
            title: "Sec 3",
            icon: "home",
            items: [card("d")],
            subsections: [],
          },
        ],
      },
    ],
  };
}

describe("updateCardConfigById", () => {
  beforeEach(() => {
    // setDashboard runs the migration (dedup/positions); ids here are unique.
    useDashboardStore.getState().setDashboard(makeDashboard());
  });

  function findCard(id: string): CardItem | undefined {
    const dash = useDashboardStore.getState().dashboard;
    for (const v of dash?.views ?? []) {
      for (const s of v.sections) {
        const c = s.items.find((it) => it.id === id);
        if (c) return c;
      }
    }
    return undefined;
  }

  it("merges a config patch into the matching card by id (flat merge)", () => {
    useDashboardStore.getState().updateCardConfigById("a", { popup_extra_entities: ["light.y"] });
    const c = findCard("a");
    // Existing key preserved, new key added.
    expect(c?.config).toEqual({ foo: 1, popup_extra_entities: ["light.y"] });
  });

  it("finds cards in any view and any section", () => {
    useDashboardStore.getState().updateCardConfigById("d", { popup_hidden_entities: ["light.z"] });
    const c = findCard("d");
    expect(c?.config).toEqual({ popup_hidden_entities: ["light.z"] });
  });

  it("overwrites overlapping keys but keeps others", () => {
    useDashboardStore.getState().updateCardConfigById("c", { popup_hidden_entities: ["light.new"] });
    const c = findCard("c");
    expect(c?.config).toEqual({ popup_hidden_entities: ["light.new"] });
  });

  it("is a no-op for an unknown card id", () => {
    const before = useDashboardStore.getState().dashboard;
    useDashboardStore.getState().updateCardConfigById("does-not-exist", { foo: 1 });
    const after = useDashboardStore.getState().dashboard;
    // No mutation occurred → reference unchanged.
    expect(after).toBe(before);
  });

  it("does not mutate sibling cards", () => {
    useDashboardStore.getState().updateCardConfigById("a", { foo: 99 });
    expect(findCard("b")?.config).toEqual({});
  });
});
