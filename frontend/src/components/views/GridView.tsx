import { useCallback } from "react";
import { getCardComponent } from "@/components/cards";
import { StatusBar } from "@/components/layout/StatusBar";
import { DraggableGrid } from "@/components/views/DraggableGrid";
import { useDashboardStore } from "@/stores/dashboardStore";
import { api } from "@/services/api";
import type { ViewConfig } from "@/types";
import "./GridView.css";

interface GridViewProps {
  view: ViewConfig;
  callService: (domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>) => void;
  onOpenPopup?: (popupId: string, props?: Record<string, unknown>) => void;
}

const SMALL_CARD_TYPES = new Set(["switch", "input_boolean", "button", "automation", "lock", "script", "scene", "binary_sensor", "update", "number", "select", "person", "area_small"]);

export function GridView({ view, callService, onOpenPopup }: GridViewProps) {
  const isOverview = view.id === "overview";
  const editMode = useDashboardStore((s) => s.editMode);
  const reorderCards = useDashboardStore((s) => s.reorderCards);

  const handleReorder = useCallback(
    (sectionId: string, oldIndex: number, newIndex: number) => {
      reorderCards(sectionId, oldIndex, newIndex);
      // Persist after reorder
      const current = useDashboardStore.getState().dashboard;
      if (current) {
        api.putDashboard(current).catch(console.error);
      }
    },
    [reorderCards]
  );

  return (
    <div className="grid-view">
      {isOverview && (
        <StatusBar
          onWeatherClick={() => onOpenPopup?.("weather")}
          onTrashClick={() => onOpenPopup?.("trash")}
          onLightsClick={() => onOpenPopup?.("lights")}
        />
      )}
      {view.sections.map((section) => {
        // In normal mode, filter out hidden cards
        const visibleItems = editMode
          ? section.items
          : section.items.filter((c) => c.visible !== false);

        if (visibleItems.length === 0 && !editMode) return null;

        const allSmall = visibleItems.every((c) => SMALL_CARD_TYPES.has(c.type));

        if (editMode) {
          // In edit mode, show all cards (including hidden ones) via DraggableGrid
          return (
            <div key={section.id} className="grid-view__section">
              <div className="grid-view__section-title">{section.title}</div>
              <DraggableGrid
                section={section}
                callService={callService}
                onReorder={handleReorder}
                onOpenPopup={onOpenPopup}
              />
            </div>
          );
        }

        return (
          <div key={section.id} className="grid-view__section">
            <div className="grid-view__section-title">{section.title}</div>
            <div className={`grid-view__grid ${allSmall ? "grid-view__grid--single-col" : ""}`}>
              {visibleItems.map((card) => {
                const CardComp = getCardComponent(card.type);
                if (!CardComp) return null;
                return (
                  <CardComp
                    key={card.id}
                    card={card}
                    callService={callService}
                    onCardAction={onOpenPopup}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
