import { create } from "zustand";
import type { DashboardConfig } from "@/types";

const MAX_HISTORY = 50;

interface HistoryStore {
  past: DashboardConfig[];
  future: DashboardConfig[];
  pushState: (state: DashboardConfig) => void;
  undo: () => DashboardConfig | null;
  redo: () => DashboardConfig | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],

  pushState: (state) =>
    set((prev) => ({
      past: [...prev.past.slice(-MAX_HISTORY + 1), state],
      future: [],
    })),

  undo: () => {
    const { past } = get();
    if (past.length === 0) return null;
    const previous = past[past.length - 1];
    set((prev) => ({
      past: prev.past.slice(0, -1),
      future: [previous, ...prev.future],
    }));
    return past.length >= 2 ? past[past.length - 2] : null;
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return null;
    const next = future[0];
    set((prev) => ({
      past: [...prev.past, next],
      future: prev.future.slice(1),
    }));
    return next;
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
  clear: () => set({ past: [], future: [] }),
}));
