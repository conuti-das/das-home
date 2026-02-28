import { create } from "zustand";
import type { DashboardConfig, ViewConfig, CardItem } from "@/types";

interface DashboardStore {
  dashboard: DashboardConfig | null;
  activeViewId: string;
  editMode: boolean;
  setDashboard: (dashboard: DashboardConfig) => void;
  setActiveViewId: (id: string) => void;
  setEditMode: (editMode: boolean) => void;
  getActiveView: () => ViewConfig | undefined;
  reorderCards: (sectionId: string, oldIndex: number, newIndex: number) => void;
  addCardToSection: (sectionId: string, card: { id: string; type: string; entity: string; size: string; config: Record<string, unknown> }) => void;
  removeCard: (sectionId: string, cardId: string) => void;
  updateCardConfig: (sectionId: string, cardId: string, updates: Partial<CardItem>) => void;
  toggleCardVisibility: (sectionId: string, cardId: string) => void;
  duplicateCard: (sectionId: string, cardId: string) => void;
  addMultipleCards: (sectionId: string, cards: Array<{ id: string; type: string; entity: string; size: string; config: Record<string, unknown>; customLabel?: string; customIcon?: string; customColor?: string }>) => void;
}

function findSection(dashboard: DashboardConfig, activeViewId: string, sectionId: string) {
  const view = dashboard.views.find((v) => v.id === activeViewId);
  if (!view) return null;
  return view.sections.find((s) => s.id === sectionId) ?? null;
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
  reorderCards: (sectionId, oldIndex, newIndex) => {
    const { dashboard, activeViewId } = get();
    if (!dashboard) return;
    const newDashboard = structuredClone(dashboard);
    const section = findSection(newDashboard, activeViewId, sectionId);
    if (!section) return;
    const [moved] = section.items.splice(oldIndex, 1);
    section.items.splice(newIndex, 0, moved);
    section.items.forEach((item, i) => { item.order = i; });
    set({ dashboard: newDashboard });
  },
  addCardToSection: (sectionId, card) => {
    const { dashboard, activeViewId } = get();
    if (!dashboard) return;
    const newDashboard = structuredClone(dashboard);
    const section = findSection(newDashboard, activeViewId, sectionId);
    if (!section) return;
    section.items.push({ ...card, order: section.items.length });
    set({ dashboard: newDashboard });
  },
  removeCard: (sectionId, cardId) => {
    const { dashboard, activeViewId } = get();
    if (!dashboard) return;
    const newDashboard = structuredClone(dashboard);
    const section = findSection(newDashboard, activeViewId, sectionId);
    if (!section) return;
    section.items = section.items.filter((item) => item.id !== cardId);
    section.items.forEach((item, i) => { item.order = i; });
    set({ dashboard: newDashboard });
  },
  updateCardConfig: (sectionId, cardId, updates) => {
    const { dashboard, activeViewId } = get();
    if (!dashboard) return;
    const newDashboard = structuredClone(dashboard);
    const section = findSection(newDashboard, activeViewId, sectionId);
    if (!section) return;
    const card = section.items.find((item) => item.id === cardId);
    if (!card) return;
    Object.assign(card, updates);
    set({ dashboard: newDashboard });
  },
  toggleCardVisibility: (sectionId, cardId) => {
    const { dashboard, activeViewId } = get();
    if (!dashboard) return;
    const newDashboard = structuredClone(dashboard);
    const section = findSection(newDashboard, activeViewId, sectionId);
    if (!section) return;
    const card = section.items.find((item) => item.id === cardId);
    if (!card) return;
    card.visible = card.visible === false ? true : false;
    set({ dashboard: newDashboard });
  },
  duplicateCard: (sectionId, cardId) => {
    const { dashboard, activeViewId } = get();
    if (!dashboard) return;
    const newDashboard = structuredClone(dashboard);
    const section = findSection(newDashboard, activeViewId, sectionId);
    if (!section) return;
    const card = section.items.find((item) => item.id === cardId);
    if (!card) return;
    const clone = structuredClone(card);
    clone.id = `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    clone.order = section.items.length;
    section.items.push(clone);
    set({ dashboard: newDashboard });
  },
  addMultipleCards: (sectionId, cards) => {
    const { dashboard, activeViewId } = get();
    if (!dashboard) return;
    const newDashboard = structuredClone(dashboard);
    const section = findSection(newDashboard, activeViewId, sectionId);
    if (!section) return;
    for (const card of cards) {
      section.items.push({ ...card, config: card.config, order: section.items.length });
    }
    set({ dashboard: newDashboard });
  },
}));
