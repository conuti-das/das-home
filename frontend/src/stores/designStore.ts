import { create } from "zustand";

/**
 * Design language switch — independent of the HA/UI5 color theme.
 *
 * - "fiori"  → the original SAP UI5 (Horizon) look. Nothing is re-skinned.
 * - "apple"  → native Apple / iOS-style look. Activated by setting
 *              `data-design="apple"` on <html>; all Apple styling lives scoped
 *              under `:root[data-design="apple"]` so toggling is non-destructive.
 *
 * The choice is persisted to localStorage and applied to the document root
 * immediately at module load (before React mounts) to avoid a flash of the
 * wrong skin.
 */
export type DesignMode = "fiori" | "apple";

const STORAGE_KEY = "dh-design-mode";
const DEFAULT_MODE: DesignMode = "apple";

function readStored(): DesignMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "fiori" || v === "apple" ? v : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

export function applyDesignMode(mode: DesignMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.design = mode;
}

interface DesignStore {
  mode: DesignMode;
  setMode: (mode: DesignMode) => void;
  toggleMode: () => void;
}

const initialMode = readStored();
applyDesignMode(initialMode);

export const useDesignStore = create<DesignStore>((set, get) => ({
  mode: initialMode,
  setMode: (mode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore quota / privacy-mode failures */
    }
    applyDesignMode(mode);
    set({ mode });
  },
  toggleMode: () => {
    get().setMode(get().mode === "apple" ? "fiori" : "apple");
  },
}));
