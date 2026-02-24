import { create } from "zustand";
import type { DashboardConfig, ViewConfig } from "@/types";

interface DashboardStore {
  dashboard: DashboardConfig | null;
  activeViewId: string;
  editMode: boolean;
  setDashboard: (dashboard: DashboardConfig) => void;
  setActiveViewId: (id: string) => void;
  setEditMode: (editMode: boolean) => void;
  getActiveView: () => ViewConfig | undefined;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  dashboard: null,
  activeViewId: "",
  editMode: false,
  setDashboard: (dashboard) =>
    set({ dashboard, activeViewId: dashboard.default_view || dashboard.views[0]?.id || "" }),
  setActiveViewId: (activeViewId) => set({ activeViewId }),
  setEditMode: (editMode) => set({ editMode }),
  getActiveView: () => {
    const { dashboard, activeViewId } = get();
    return dashboard?.views.find((v) => v.id === activeViewId);
  },
}));
