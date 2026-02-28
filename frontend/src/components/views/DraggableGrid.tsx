import { useCallback, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Icon } from "@ui5/webcomponents-react";
import { getCardComponent } from "@/components/cards";
import { useDashboardStore } from "@/stores/dashboardStore";
import { api } from "@/services/api";
import { CardEditPopup } from "@/components/wizard/CardEditPopup";
import type { CardItem, Section } from "@/types";
import "./DraggableGrid.css";

interface DraggableGridProps {
  section: Section;
  callService: (domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>) => void;
  onReorder: (sectionId: string, oldIndex: number, newIndex: number) => void;
  onOpenPopup?: (popupId: string, props?: Record<string, unknown>) => void;
}

function SortableCard({
  card,
  sectionId,
  callService,
  onOpenPopup,
}: {
  card: CardItem;
  sectionId: string;
  callService: DraggableGridProps["callService"];
  onOpenPopup?: DraggableGridProps["onOpenPopup"];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const [showEdit, setShowEdit] = useState(false);
  const toggleCardVisibility = useDashboardStore((s) => s.toggleCardVisibility);
  const removeCard = useDashboardStore((s) => s.removeCard);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  const isHidden = card.visible === false;

  const CardComp = getCardComponent(card.type);
  if (!CardComp) return null;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeCard(sectionId, card.id);
    const current = useDashboardStore.getState().dashboard;
    if (current) {
      api.putDashboard(current).catch(console.error);
    }
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCardVisibility(sectionId, card.id);
    const current = useDashboardStore.getState().dashboard;
    if (current) {
      api.putDashboard(current).catch(console.error);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`draggable-grid__item ${isHidden ? "draggable-grid__item--hidden" : ""}`}
      >
        <CardComp card={card} callService={callService} onCardAction={onOpenPopup} />

        {/* Edit overlay controls */}
        <div className="draggable-grid__edit-controls">
          <button
            className="draggable-grid__edit-btn"
            title="Bearbeiten"
            onClick={(e) => { e.stopPropagation(); setShowEdit(true); }}
          >
            <Icon name="edit" style={{ width: 14, height: 14 }} />
          </button>
          <button
            className="draggable-grid__edit-btn"
            title={isHidden ? "Einblenden" : "Ausblenden"}
            onClick={handleToggleVisibility}
          >
            <Icon name={isHidden ? "show" : "hide"} style={{ width: 14, height: 14 }} />
          </button>
          <button
            className="draggable-grid__edit-btn draggable-grid__edit-btn--danger"
            title="Loeschen"
            onClick={handleDelete}
          >
            <Icon name="delete" style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {isHidden && (
          <div className="draggable-grid__hidden-badge">Ausgeblendet</div>
        )}
      </div>

      {showEdit && (
        <CardEditPopup
          open={showEdit}
          onClose={() => setShowEdit(false)}
          sectionId={sectionId}
          card={card}
        />
      )}
    </>
  );
}

export function DraggableGrid({ section, callService, onReorder, onOpenPopup }: DraggableGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = section.items.findIndex((item) => item.id === active.id);
      const newIndex = section.items.findIndex((item) => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(section.id, oldIndex, newIndex);
      }
    },
    [section.id, section.items, onReorder]
  );

  const itemIds = section.items.map((item) => item.id);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div className="draggable-grid">
          {section.items.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              sectionId={section.id}
              callService={callService}
              onOpenPopup={onOpenPopup}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
