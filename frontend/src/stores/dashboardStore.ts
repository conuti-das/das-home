import { create } from "zustand";
import type { DashboardConfig, ViewConfig, CardItem } from "@/types";
import { autoAssignPositions } from "@/utils/gridLayout";

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
  moveCard: (sectionId: string, cardId: string, gridCol: number, gridRow: number) => void;
  resizeCard: (sectionId: string, cardId: string, colSpan: number, rowSpan: number) => void;
  autoLayoutSection: (sectionId: string, columnCount: number) => void;
  updateCardWeight: (sectionId: string, cardId: string, weight: number) => void;
  moveCardToSection: (fromSectionId: string, cardId: string, toSectionId: string) => void;
  toggleFavorite: (sectionId: string, cardId: string) => void;
}

function findSection(dashboard: DashboardConfig, activeViewId: string, sectionId: string) {
  const view = dashboard.views.find((v) => v.id === activeViewId);
  if (!view) return null;
  return view.sections.find((s) => s.id === sectionId) ?? null;
}

/** Convert snake_case API fields to camelCase for CardItem */
function normalizeCard(card: CardItem): CardItem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = card as any;
  return {
    ...card,
    gridCol: card.gridCol ?? raw.grid_col,
    gridRow: card.gridRow ?? raw.grid_row,
    colSpan: card.colSpan ?? raw.col_span,
    rowSpan: card.rowSpan ?? raw.row_span,
    flexWeight: card.flexWeight ?? raw.flex_weight,
    customLabel: card.customLabel ?? raw.custom_label,
    customIcon: card.customIcon ?? raw.custom_icon,
    customColor: card.customColor ?? raw.custom_color,
  };
}

/** Migrate cards: normalize keys, assign grid positions if missing */
function migrateCards(dashboard: DashboardConfig): DashboardConfig {
  const migrated = structuredClone(dashboard);
  for (const view of migrated.views) {
    const colCount = 4;
    for (const section of view.sections) {
      section.items = section.items.map(normalizeCard);
      if (section.layout !== "strip") {
        section.items = autoAssignPositions(section.items, colCount);
      }
    }
  }
  return migrated;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  dashboard: null,
  activeViewId: "",
  editMode: false,
  setDashboard: (dashboard) => {
    const migrated = migrateCards(dashboard);
    set({ dashboard: migrated, activeViewId: migrated.default_view || migrated.views[0]?.id || "" });
  },
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
    const newCard = { ...card, order: section.items.length } as CardItem;
    if (section.layout === "strip") {
      newCard.flexWeight = 1;
    }
    section.items.push(newCard);
    if (section.layout !== "strip") {
      section.items = autoAssignPositions(section.items, 4);
    }
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
    // Clear position so it auto-assigns
    clone.gridCol = undefined;
    clone.gridRow = undefined;
    section.items.push(clone);
    section.items = autoAssignPositions(section.items, 4);
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
    section.items = autoAssignPositions(section.items, 4);
    set({ dashboard: newDashboard });
  },
  moveCard: (sectionId, cardId, gridCol, gridRow) => {
    const { dashboard, activeViewId } = get();
    if (!dashboard) return;
    const newDashboard = structuredClone(dashboard);
    const section = findSection(newDashboard, activeViewId, sectionId);
    if (!section) return;
    const card = section.items.find((item) => item.id === cardId);
    if (!card) return;
    card.gridCol = gridCol;
    card.gridRow = gridRow;
    set({ dashboard: newDashboard });
  },
  resizeCard: (sectionId, cardId, colSpan, rowSpan) => {
    const { dashboard, activeViewId } = get();
    if (!dashboard) return;
    const newDashboard = structuredClone(dashboard);
    const section = findSection(newDashboard, activeViewId, sectionId);
    if (!section) return;
    const card = section.items.find((item) => item.id === cardId);
    if (!card) return;
    card.colSpan = colSpan;
    card.rowSpan = rowSpan;
    // Also update the size string for backward compat
    card.size = `${colSpan}x${rowSpan}`;
    set({ dashboard: newDashboard });
  },
  updateCardWeight: (sectionId, cardId, weight) => {
    const { dashboard, activeViewId } = get();
    if (!dashboard) return;
    const newDashboard = structuredClone(dashboard);
    const section = findSection(newDashboard, activeViewId, sectionId);
    if (!section) return;
    const card = section.items.find((item) => item.id === cardId);
    if (!card) return;
    card.flexWeight = weight;
    set({ dashboard: newDashboard });
  },
  toggleFavorite: (sectionId, cardId) => {
    const { dashboard, activeViewId } = get();
    if (!dashboard) return;
    const newDashboard = structuredClone(dashboard);
    const section = findSection(newDashboard, activeViewId, sectionId);
    if (!section) return;
    const card = section.items.find((item) => item.id === cardId);
    if (!card) return;
    card.favorite = !card.favorite;
    set({ dashboard: newDashboard });
  },
  moveCardToSection: (fromSectionId, cardId, toSectionId) => {
    const { dashboard, activeViewId } = get();
    if (!dashboard || fromSectionId === toSectionId) return;
    const newDashboard = structuredClone(dashboard);
    const view = newDashboard.views.find((v) => v.id === activeViewId);
    if (!view) return;
    const fromSection = view.sections.find((s) => s.id === fromSectionId);
    const toSection = view.sections.find((s) => s.id === toSectionId);
    if (!fromSection || !toSection) return;
    const cardIndex = fromSection.items.findIndex((item) => item.id === cardId);
    if (cardIndex < 0) return;
    const [card] = fromSection.items.splice(cardIndex, 1);
    card.order = toSection.items.length;
    card.gridCol = undefined;
    card.gridRow = undefined;
    toSection.items.push(card);
    if (toSection.layout !== "strip") {
      toSection.items = autoAssignPositions(toSection.items, 4);
    }
    set({ dashboard: newDashboard });
  },
  autoLayoutSection: (sectionId, columnCount) => {
    const { dashboard, activeViewId } = get();
    if (!dashboard) return;
    const newDashboard = structuredClone(dashboard);
    const section = findSection(newDashboard, activeViewId, sectionId);
    if (!section) return;
    // Clear all positions and re-assign
    for (const card of section.items) {
      card.gridCol = undefined;
      card.gridRow = undefined;
    }
    section.items = autoAssignPositions(section.items, columnCount);
    set({ dashboard: newDashboard });
  },
}));
