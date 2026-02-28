import { useState, useMemo, useCallback } from "react";
import { PopupModal } from "@/components/layout/PopupModal";
import { getRegisteredTypes, getCardMetadata } from "@/components/cards/CardRegistry";
import { useDashboardStore } from "@/stores/dashboardStore";
import { api } from "@/services/api";
import type { CardItem } from "@/types";

interface CardEditPopupProps {
  open: boolean;
  onClose: () => void;
  sectionId: string;
  card: CardItem;
}

const SIZES = ["1x1", "2x1", "1x2", "2x2"];

const PRESET_COLORS = [
  { label: "Blau", value: "var(--dh-blue)", hex: "#56CCF2" },
  { label: "Gelb", value: "var(--dh-yellow)", hex: "#F2C94C" },
  { label: "Gruen", value: "var(--dh-green)", hex: "#6FCF97" },
  { label: "Rot", value: "var(--dh-red)", hex: "#EB5757" },
  { label: "Orange", value: "var(--dh-orange)", hex: "#F2994A" },
  { label: "Lila", value: "var(--dh-purple)", hex: "#BB6BD9" },
  { label: "Pink", value: "var(--dh-pink)", hex: "#F2A0B7" },
  { label: "Standard", value: "", hex: "transparent" },
];

export function CardEditPopup({ open, onClose, sectionId, card }: CardEditPopupProps) {
  const [tab, setTab] = useState<"type" | "size" | "styling" | "entity">("type");
  const [cardType, setCardType] = useState(card.type);
  const [cardSize, setCardSize] = useState(card.size);
  const [customLabel, setCustomLabel] = useState(card.customLabel ?? "");
  const [customIcon, setCustomIcon] = useState(card.customIcon ?? "");
  const [customColor, setCustomColor] = useState(card.customColor ?? "");

  const updateCardConfig = useDashboardStore((s) => s.updateCardConfig);
  const registeredTypes = useMemo(() => getRegisteredTypes(), []);

  const handleSave = useCallback(() => {
    updateCardConfig(sectionId, card.id, {
      type: cardType,
      size: cardSize,
      customLabel: customLabel || undefined,
      customIcon: customIcon || undefined,
      customColor: customColor || undefined,
    });
    // Persist
    const current = useDashboardStore.getState().dashboard;
    if (current) {
      api.putDashboard(current).catch(console.error);
    }
    onClose();
  }, [sectionId, card.id, cardType, cardSize, customLabel, customIcon, customColor, updateCardConfig, onClose]);

  const tabs = [
    { key: "type" as const, label: "Widget" },
    { key: "size" as const, label: "Groesse" },
    { key: "styling" as const, label: "Styling" },
    { key: "entity" as const, label: "Entity" },
  ];

  return (
    <PopupModal open={open} title="Karte bearbeiten" icon="edit" onClose={onClose}>
      {/* Tab bar */}
      <div className="cep__tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`cep__tab ${tab === t.key ? "cep__tab--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "12px 0" }}>
        {/* Type tab */}
        {tab === "type" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 300, overflowY: "auto" }}>
            {registeredTypes
              .filter((t) => t !== "hacs")
              .map((type) => {
                const meta = getCardMetadata(type);
                return (
                  <button
                    key={type}
                    className={`cep__type-row ${type === cardType ? "cep__type-row--active" : ""}`}
                    onClick={() => setCardType(type)}
                  >
                    <span className="cep__type-name">{meta?.displayName ?? type}</span>
                    {meta?.description && (
                      <span className="cep__type-desc">{meta.description}</span>
                    )}
                  </button>
                );
              })}
          </div>
        )}

        {/* Size tab */}
        {tab === "size" && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {SIZES.map((size) => (
              <button
                key={size}
                className={`sz__option ${size === cardSize ? "sz__option--active" : ""}`}
                onClick={() => setCardSize(size)}
                style={{ padding: "16px 24px" }}
              >
                <span className="sz__label">{size}</span>
              </button>
            ))}
          </div>
        )}

        {/* Styling tab */}
        {tab === "styling" && (
          <div>
            <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)", marginBottom: 6 }}>Label</div>
            <input
              className="widget-wizard__input"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Standard-Name verwenden"
            />
            <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)", marginTop: 12, marginBottom: 6 }}>Icon</div>
            <input
              className="widget-wizard__input"
              value={customIcon}
              onChange={(e) => setCustomIcon(e.target.value)}
              placeholder="z.B. lightbulb, temperature"
            />
            <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)", marginTop: 12, marginBottom: 6 }}>Farbe</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  className={`sp__color-btn ${customColor === c.value ? "sp__color-btn--active" : ""}`}
                  style={{ background: c.hex, border: c.hex === "transparent" ? "2px dashed rgba(250,251,252,0.2)" : undefined }}
                  title={c.label}
                  onClick={() => setCustomColor(c.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Entity tab */}
        {tab === "entity" && (
          <div>
            <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)", marginBottom: 6 }}>Entity ID</div>
            <div style={{ fontSize: 14, color: "var(--dh-gray100)", padding: "8px 0" }}>{card.entity}</div>
            <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)", marginTop: 8, marginBottom: 6 }}>Card ID</div>
            <div style={{ fontSize: 12, color: "var(--dh-gray100)", opacity: 0.5, padding: "4px 0", fontFamily: "monospace" }}>{card.id}</div>
          </div>
        )}
      </div>

      {/* Save */}
      <button
        className="widget-wizard__btn widget-wizard__btn--primary"
        style={{ width: "100%", marginTop: 8 }}
        onClick={handleSave}
      >
        Speichern
      </button>

      <style>{`
        .cep__tabs {
          display: flex;
          gap: 2px;
          border-bottom: 1px solid rgba(250, 251, 252, 0.08);
          margin-bottom: 4px;
        }
        .cep__tab {
          flex: 1;
          padding: 8px 4px;
          background: none;
          border: none;
          color: var(--dh-gray100);
          opacity: 0.5;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s ease;
        }
        .cep__tab:hover {
          opacity: 0.7;
        }
        .cep__tab--active {
          opacity: 1;
          border-bottom-color: var(--dh-blue);
        }
        .cep__type-row {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 8px 12px;
          border-radius: var(--dh-card-radius-sm);
          border: none;
          background: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: background 0.1s ease;
        }
        .cep__type-row:hover {
          background: rgba(250, 251, 252, 0.05);
        }
        .cep__type-row--active {
          background: rgba(86, 204, 242, 0.12);
        }
        .cep__type-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--dh-gray100);
        }
        .cep__type-desc {
          font-size: 11px;
          color: var(--dh-gray100);
          opacity: 0.4;
          margin-top: 1px;
        }
        .sz__option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          border-radius: var(--dh-card-radius);
          border: 2px solid rgba(250, 251, 252, 0.1);
          background: var(--dh-gray300);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sz__option:hover {
          border-color: rgba(86, 204, 242, 0.3);
        }
        .sz__option--active {
          border-color: var(--dh-blue);
          background: rgba(86, 204, 242, 0.08);
        }
        .sz__label {
          font-size: 14px;
          font-weight: 600;
          color: var(--dh-gray100);
        }
        .sp__color-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sp__color-btn:hover {
          transform: scale(1.15);
        }
        .sp__color-btn--active {
          border-color: var(--dh-gray100);
          box-shadow: 0 0 0 2px var(--dh-gray400), 0 0 0 4px var(--dh-gray100);
        }
      `}</style>
    </PopupModal>
  );
}
