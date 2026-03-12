import { useCallback, useState, useRef, useEffect } from "react";
import {
  DndContext,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Icon } from "@ui5/webcomponents-react";
import { getCardComponent } from "@/components/cards";
import { useDashboardStore } from "@/stores/dashboardStore";
import { api } from "@/services/api";
import { CardEditPopup } from "@/components/wizard/CardEditPopup";
import { getCardSpan, getCardPosition } from "@/utils/gridLayout";
import type { CardItem, Section } from "@/types";
import "./DraggableGrid.css";

interface DraggableGridProps {
  section: Section;
  callService: (domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>) => void;
  onOpenPopup?: (popupId: string, props?: Record<string, unknown>) => void;
}

interface GridMetrics {
  cols: number;
  cellW: number;
  rowH: number;
  gap: number;
}

function DraggableCard({
  card,
  sectionId,
  callService,
  onOpenPopup,
  gridMetrics,
  isStrip,
}: {
  card: CardItem;
  sectionId: string;
  callService: DraggableGridProps["callService"];
  onOpenPopup?: DraggableGridProps["onOpenPopup"];
  gridMetrics: GridMetrics;
  isStrip?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  const [showEdit, setShowEdit] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizePreview, setResizePreview] = useState<{ colSpan: number; rowSpan: number } | null>(null);
  const toggleCardVisibility = useDashboardStore((s) => s.toggleCardVisibility);
  const toggleFavorite = useDashboardStore((s) => s.toggleFavorite);
  const removeCard = useDashboardStore((s) => s.removeCard);
  const resizeCard = useDashboardStore((s) => s.resizeCard);
  const resizeStartRef = useRef<{ x: number; y: number; colSpan: number; rowSpan: number } | null>(null);

  const span = getCardSpan(card);
  const pos = getCardPosition(card);

  const displaySpan = resizePreview || span;

  const style: React.CSSProperties = isStrip
    ? {
        flex: card.flexWeight || 1,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
        transform: transform ? `translate(${transform.x}px, 0)` : undefined,
        transition: isDragging ? undefined : "box-shadow 0.2s ease",
        height: "100%",
        minWidth: 0,
      }
    : {
        gridColumn: pos ? `${pos.gridCol} / span ${displaySpan.colSpan}` : undefined,
        gridRow: pos ? `${pos.gridRow} / span ${displaySpan.rowSpan}` : undefined,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : isResizing ? 40 : "auto",
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        transition: isDragging ? undefined : "box-shadow 0.2s ease",
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

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(sectionId, card.id);
    const current = useDashboardStore.getState().dashboard;
    if (current) {
      api.putDashboard(current).catch(console.error);
    }
  };

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = { x: e.clientX, y: e.clientY, colSpan: span.colSpan, rowSpan: span.rowSpan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!resizeStartRef.current) return;
    const dx = e.clientX - resizeStartRef.current.x;
    const dy = e.clientY - resizeStartRef.current.y;
    const { cellW, rowH, gap, cols } = gridMetrics;
    const dCols = Math.round(dx / (cellW + gap));
    const dRows = Math.round(dy / (rowH + gap));
    const newColSpan = Math.max(1, Math.min(cols, resizeStartRef.current.colSpan + dCols));
    const newRowSpan = Math.max(1, resizeStartRef.current.rowSpan + dRows);
    setResizePreview({ colSpan: newColSpan, rowSpan: newRowSpan });
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (!resizeStartRef.current) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setIsResizing(false);
    if (resizePreview) {
      resizeCard(sectionId, card.id, resizePreview.colSpan, resizePreview.rowSpan);
      const current = useDashboardStore.getState().dashboard;
      if (current) {
        api.putDashboard(current).catch(console.error);
      }
    }
    resizeStartRef.current = null;
    setResizePreview(null);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`draggable-grid__item ${isHidden ? "draggable-grid__item--hidden" : ""} ${isDragging ? "draggable-grid__item--dragging" : ""}`}
      >
        {/* Drag handle area */}
        <div className="draggable-grid__drag-zone" {...attributes} {...listeners} />

        <CardComp card={card} callService={callService} onCardAction={onOpenPopup} />

        {/* Edit overlay controls */}
        <div className="draggable-grid__edit-controls">
          <button
            className={`draggable-grid__edit-btn ${card.favorite ? "draggable-grid__edit-btn--favorite" : ""}`}
            title={card.favorite ? "Favorit entfernen" : "Als Favorit markieren"}
            onClick={handleToggleFavorite}
          >
            <Icon name={card.favorite ? "favorite" : "unfavorite"} style={{ width: 14, height: 14 }} />
          </button>
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

        {/* Resize handle */}
        <div
          className="draggable-grid__resize-handle"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="10" y1="6" x2="6" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="10" y1="10" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Size indicator */}
        {isStrip ? (
          <div className="draggable-grid__weight-badge">
            {card.flexWeight || 1}x
          </div>
        ) : (
          <div className="draggable-grid__size-badge">
            {displaySpan.colSpan}x{displaySpan.rowSpan}
          </div>
        )}
      </div>

      {showEdit && (
        <CardEditPopup
          open={showEdit}
          onClose={() => setShowEdit(false)}
          sectionId={sectionId}
          card={card}
          sectionLayout={isStrip ? "strip" : "grid"}
        />
      )}
    </>
  );
}

export function DraggableGrid({ section, callService, onOpenPopup }: DraggableGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridMetrics, setGridMetrics] = useState<GridMetrics>({ cols: 4, cellW: 200, rowH: 120, gap: 12 });
  const moveCard = useDashboardStore((s) => s.moveCard);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Measure grid metrics on resize
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const measure = () => {
      const style = getComputedStyle(el);
      const cols = style.gridTemplateColumns.split(" ").length;
      const gap = parseFloat(style.gap) || 12;
      const totalW = el.clientWidth;
      const cellW = (totalW - (cols - 1) * gap) / cols;
      const rowH = 120; // matches grid-auto-rows minmax
      setGridMetrics({ cols, cellW, rowH, gap });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      if (!delta || (delta.x === 0 && delta.y === 0)) return;

      const cardId = active.id as string;
      const card = section.items.find((c) => c.id === cardId);
      if (!card) return;

      const pos = getCardPosition(card);
      if (!pos) return;

      const { cellW, rowH, gap, cols } = gridMetrics;
      const span = getCardSpan(card);
      const dCols = Math.round(delta.x / (cellW + gap));
      const dRows = Math.round(delta.y / (rowH + gap));

      const newCol = Math.max(1, Math.min(cols - span.colSpan + 1, pos.gridCol + dCols));
      const newRow = Math.max(1, pos.gridRow + dRows);

      if (newCol !== pos.gridCol || newRow !== pos.gridRow) {
        moveCard(section.id, cardId, newCol, newRow);
        const current = useDashboardStore.getState().dashboard;
        if (current) {
          api.putDashboard(current).catch(console.error);
        }
      }
    },
    [section.id, section.items, gridMetrics, moveCard]
  );

  const isStrip = section.layout === "strip";

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        ref={gridRef}
        className={`draggable-grid ${isStrip ? "draggable-grid--strip" : "draggable-grid--edit"}`}
      >
        {!isStrip && <div className="draggable-grid__overlay" />}
        {section.items.map((card) => (
          <DraggableCard
            key={card.id}
            card={card}
            sectionId={section.id}
            callService={callService}
            onOpenPopup={onOpenPopup}
            gridMetrics={gridMetrics}
            isStrip={isStrip}
          />
        ))}
        {isStrip && (
          <button
            className="draggable-grid__strip-add"
            title="Karte hinzufuegen"
            onClick={() => onOpenPopup?.("widget-wizard", { sectionId: section.id })}
          >
            +
          </button>
        )}
      </div>
    </DndContext>
  );
}
