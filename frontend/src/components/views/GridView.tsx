import { getCardComponent } from "@/components/cards";
import { StatusBar } from "@/components/layout/StatusBar";
import { DraggableGrid } from "@/components/views/DraggableGrid";
import { useDashboardStore } from "@/stores/dashboardStore";
import { getCardSpan, getCardPosition } from "@/utils/gridLayout";
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

  return (
    <div className="grid-view">
      {isOverview && (
        <StatusBar
          onWeatherClick={() => onOpenPopup?.("weather")}
          onTrashClick={() => onOpenPopup?.("trash")}
          onLightsClick={() => onOpenPopup?.("lights")}
          onOpenPopup={onOpenPopup}
        />
      )}
      {view.sections.map((section) => {
        const visibleItems = editMode
          ? section.items
          : section.items.filter((c) => c.visible !== false);

        if (visibleItems.length === 0 && !editMode) return null;

        // Strip layout
        if (section.layout === "strip") {
          if (editMode) {
            return (
              <div key={section.id} className="grid-view__section">
                {section.title && <div className="grid-view__section-title">{section.title}</div>}
                <DraggableGrid
                  section={section}
                  callService={callService}
                  onOpenPopup={onOpenPopup}
                />
              </div>
            );
          }

          return (
            <div key={section.id} className="grid-view__section">
              {section.title && <div className="grid-view__section-title">{section.title}</div>}
              <div className="grid-view__strip">
                {visibleItems.map((card) => {
                  const CardComp = getCardComponent(card.type);
                  if (!CardComp) return null;
                  return (
                    <div
                      key={card.id}
                      className="grid-view__strip-card"
                      style={{ flex: card.flexWeight || 1 }}
                    >
                      <CardComp
                        card={card}
                        callService={callService}
                        onCardAction={onOpenPopup}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // Grid layout (existing)
        const allSmall = visibleItems.every((c) => SMALL_CARD_TYPES.has(c.type));

        if (editMode) {
          return (
            <div key={section.id} className="grid-view__section">
              <div className="grid-view__section-title">{section.title}</div>
              <DraggableGrid
                section={section}
                callService={callService}
                onOpenPopup={onOpenPopup}
              />
            </div>
          );
        }

        const hasPositions = visibleItems.some((c) => c.gridCol != null && c.gridRow != null);

        return (
          <div key={section.id} className="grid-view__section">
            <div className="grid-view__section-title">{section.title}</div>
            <div className={`grid-view__grid ${allSmall ? "grid-view__grid--single-col" : ""} ${hasPositions ? "grid-view__grid--positioned" : ""}`}>
              {visibleItems.map((card) => {
                const CardComp = getCardComponent(card.type);
                if (!CardComp) return null;

                const pos = getCardPosition(card);
                const span = getCardSpan(card);
                const gridStyle = pos ? {
                  gridColumn: `${pos.gridCol} / span ${span.colSpan}`,
                  gridRow: `${pos.gridRow} / span ${span.rowSpan}`,
                } : undefined;

                return (
                  <div key={card.id} style={gridStyle}>
                    <CardComp
                      card={card}
                      callService={callService}
                      onCardAction={onOpenPopup}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
