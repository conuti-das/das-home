import { useState, useMemo, useCallback } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { api } from "@/services/api";
import type { EntityWidgetPair } from "./WidgetWizard";

interface PlacementPreviewProps {
  pairings: EntityWidgetPair[];
  onClose: () => void;
}

export function PlacementPreview({ pairings, onClose }: PlacementPreviewProps) {
  const dashboard = useDashboardStore((s) => s.dashboard);
  const activeViewId = useDashboardStore((s) => s.activeViewId);
  const addMultipleCards = useDashboardStore((s) => s.addMultipleCards);
  const [position, setPosition] = useState<"end" | "start">("end");

  const view = useMemo(() => {
    return dashboard?.views.find((v) => v.id === activeViewId);
  }, [dashboard, activeViewId]);

  const sections = view?.sections ?? [];
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id ?? "");

  const handleSave = useCallback(() => {
    if (!selectedSectionId || pairings.length === 0) return;

    const cards = pairings.map((pair) => ({
      id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: pair.widgetType,
      entity: pair.entity.entity_id,
      size: pair.size,
      config: {} as Record<string, unknown>,
      customLabel: pair.customLabel || undefined,
      customIcon: pair.customIcon || undefined,
      customColor: pair.customColor || undefined,
    }));

    addMultipleCards(selectedSectionId, cards);

    // Persist
    const current = useDashboardStore.getState().dashboard;
    if (current) {
      api.putDashboard(current).catch(console.error);
    }
    onClose();
  }, [selectedSectionId, pairings, addMultipleCards, onClose]);

  return (
    <div>
      <div style={{ fontSize: 14, opacity: 0.6, color: "var(--dh-gray100)", marginBottom: 12 }}>
        {pairings.length} {pairings.length === 1 ? "Karte" : "Karten"} platzieren
      </div>

      {/* Section selection */}
      <div className="widget-wizard__section-label">Sektion</div>
      <select
        className="pp__select"
        value={selectedSectionId}
        onChange={(e) => setSelectedSectionId(e.target.value)}
      >
        {sections.map((s) => (
          <option key={s.id} value={s.id}>{s.title || s.id}</option>
        ))}
      </select>

      {/* Position */}
      <div className="widget-wizard__section-label">Position</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className={`widget-wizard__chip ${position === "end" ? "widget-wizard__chip--active" : ""}`}
          onClick={() => setPosition("end")}
        >
          Am Ende
        </button>
        <button
          className={`widget-wizard__chip ${position === "start" ? "widget-wizard__chip--active" : ""}`}
          onClick={() => setPosition("start")}
        >
          Am Anfang
        </button>
      </div>

      {/* Preview */}
      <div className="widget-wizard__section-label">Vorschau</div>
      <div className="pp__preview">
        {/* Existing cards (gray) */}
        {position === "start" && pairings.map((pair) => (
          <div key={pair.entity.entity_id} className="pp__card pp__card--new">
            <div className="pp__card-name">{pair.customLabel || pair.entity.entity_id}</div>
            <div className="pp__card-meta">{pair.widgetType} · {pair.size}</div>
          </div>
        ))}
        {sections.find((s) => s.id === selectedSectionId)?.items.map((card) => (
          <div key={card.id} className="pp__card pp__card--existing">
            <div className="pp__card-name">{card.customLabel || card.entity || card.id}</div>
            <div className="pp__card-meta">{card.type} · {card.size}</div>
          </div>
        ))}
        {position === "end" && pairings.map((pair) => (
          <div key={pair.entity.entity_id} className="pp__card pp__card--new">
            <div className="pp__card-name">{pair.customLabel || pair.entity.entity_id}</div>
            <div className="pp__card-meta">{pair.widgetType} · {pair.size}</div>
          </div>
        ))}
      </div>

      {/* Save */}
      <div style={{ marginTop: 16 }}>
        <button
          className="widget-wizard__btn widget-wizard__btn--primary"
          style={{ width: "100%" }}
          onClick={handleSave}
          disabled={!selectedSectionId}
        >
          {pairings.length} {pairings.length === 1 ? "Karte" : "Karten"} speichern
        </button>
      </div>

      <style>{`
        .pp__select {
          width: 100%;
          padding: 8px 12px;
          border-radius: var(--dh-card-radius);
          border: var(--dh-surface-border);
          background: var(--dh-gray300);
          color: var(--dh-gray100);
          font-size: 14px;
          outline: none;
          cursor: pointer;
          margin-bottom: 4px;
        }
        .pp__preview {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 200px;
          overflow-y: auto;
        }
        .pp__card {
          padding: 10px 14px;
          border-radius: var(--dh-card-radius);
          border: var(--dh-surface-border);
        }
        .pp__card--existing {
          background: var(--dh-gray300);
          opacity: 0.5;
        }
        .pp__card--new {
          background: rgba(86, 204, 242, 0.1);
          border-color: rgba(86, 204, 242, 0.3);
        }
        .pp__card-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--dh-gray100);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pp__card-meta {
          font-size: 11px;
          color: var(--dh-gray100);
          opacity: 0.4;
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}
