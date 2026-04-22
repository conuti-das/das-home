import { beforeEach, describe, expect, it } from "vitest";
import { useUndoStore } from "@/stores/undoStore";
import type { DashboardConfig } from "@/types";

function makeConfig(version: number): DashboardConfig {
  return {
    version,
    theme: "light",
    accent_color: "#1976d2",
    auto_theme: false,
    sidebar_visible: true,
    default_view: "home",
    views: [],
  };
}

describe("undoStore", () => {
  beforeEach(() => {
    useUndoStore.setState({ past: [], future: [] });
  });

  it("pushState adds state to past and clears future", () => {
    const a = makeConfig(1);
    const b = makeConfig(2);

    useUndoStore.getState().pushState(a);
    // Seed future so we can verify it gets cleared on pushState
    useUndoStore.setState({ future: [makeConfig(99)] });

    useUndoStore.getState().pushState(b);

    const { past, future } = useUndoStore.getState();
    expect(past).toEqual([a, b]);
    expect(future).toEqual([]);
  });

  it("undo returns null when past is empty", () => {
    const result = useUndoStore.getState().undo();
    expect(result).toBeNull();
  });

  it("undo returns previous state when past has 2+ entries", () => {
    const a = makeConfig(1);
    const b = makeConfig(2);

    useUndoStore.getState().pushState(a);
    useUndoStore.getState().pushState(b);

    const result = useUndoStore.getState().undo();
    expect(result).toEqual(a);
  });

  it("undo moves current state to future", () => {
    const a = makeConfig(1);
    const b = makeConfig(2);

    useUndoStore.getState().pushState(a);
    useUndoStore.getState().pushState(b);

    useUndoStore.getState().undo();

    const { past, future } = useUndoStore.getState();
    expect(past).toEqual([a]);
    expect(future).toEqual([b]);
  });

  it("redo returns state from future and pushes to past", () => {
    const a = makeConfig(1);
    const b = makeConfig(2);

    useUndoStore.getState().pushState(a);
    useUndoStore.getState().pushState(b);
    useUndoStore.getState().undo();

    const result = useUndoStore.getState().redo();
    expect(result).toEqual(b);

    const { past, future } = useUndoStore.getState();
    expect(past).toEqual([a, b]);
    expect(future).toEqual([]);
  });

  it("redo returns null when future is empty", () => {
    const a = makeConfig(1);
    useUndoStore.getState().pushState(a);

    const result = useUndoStore.getState().redo();
    expect(result).toBeNull();
  });

  it("canUndo and canRedo reflect state correctly", () => {
    expect(useUndoStore.getState().canUndo()).toBe(false);
    expect(useUndoStore.getState().canRedo()).toBe(false);

    const a = makeConfig(1);
    const b = makeConfig(2);
    useUndoStore.getState().pushState(a);
    useUndoStore.getState().pushState(b);

    expect(useUndoStore.getState().canUndo()).toBe(true);
    expect(useUndoStore.getState().canRedo()).toBe(false);

    useUndoStore.getState().undo();

    expect(useUndoStore.getState().canUndo()).toBe(true);
    expect(useUndoStore.getState().canRedo()).toBe(true);
  });

  it("clear empties both past and future", () => {
    const a = makeConfig(1);
    const b = makeConfig(2);
    useUndoStore.getState().pushState(a);
    useUndoStore.getState().pushState(b);
    useUndoStore.getState().undo();

    // Sanity check: we have entries in both
    expect(useUndoStore.getState().past.length).toBeGreaterThan(0);
    expect(useUndoStore.getState().future.length).toBeGreaterThan(0);

    useUndoStore.getState().clear();

    const { past, future } = useUndoStore.getState();
    expect(past).toEqual([]);
    expect(future).toEqual([]);
  });

  it("retains only the last 50 states (MAX_HISTORY)", () => {
    for (let i = 0; i < 60; i++) {
      useUndoStore.getState().pushState(makeConfig(i));
    }

    const { past } = useUndoStore.getState();
    expect(past.length).toBe(50);
    // Oldest retained should be version 10 (0..9 dropped)
    expect(past[0].version).toBe(10);
    // Newest should be version 59
    expect(past[past.length - 1].version).toBe(59);
  });
});
