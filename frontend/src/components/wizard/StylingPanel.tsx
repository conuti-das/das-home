import type { EntityWidgetPair } from "./WidgetWizard";

interface StylingPanelProps {
  pairings: EntityWidgetPair[];
  activePairingIndex: number;
  onPairingUpdate: (index: number, updates: Partial<EntityWidgetPair>) => void;
  onActivePairingChange: (index: number) => void;
  onNext: () => void;
}

const PRESET_COLORS = [
  { name: "Blau", value: "var(--dh-blue)" },
  { name: "Gelb", value: "var(--dh-yellow)" },
  { name: "Gruen", value: "var(--dh-green)" },
  { name: "Rot", value: "var(--dh-red)" },
  { name: "Orange", value: "var(--dh-orange)" },
  { name: "Lila", value: "var(--dh-purple)" },
  { name: "Pink", value: "var(--dh-pink)" },
  { name: "Grau", value: "var(--dh-gray100)" },
];

const PRESET_COLORS_HEX = [
  "#56CCF2", "#F2C94C", "#6FCF97", "#EB5757",
  "#F2994A", "#BB6BD9", "#F2A0B7", "#FAFBFC",
];

export function StylingPanel({
  pairings,
  activePairingIndex,
  onPairingUpdate,
  onActivePairingChange,
  onNext,
}: StylingPanelProps) {
  const activePair = pairings[activePairingIndex];
  if (!activePair) return null;

  return (
    <div>
      {/* Multi-entity tab selector */}
      {pairings.length > 1 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
          {pairings.map((pair, i) => {
            const label = pair.customLabel || pair.entity.entity_id.split(".")[1];
            return (
              <button
                key={pair.entity.entity_id}
                className={`widget-wizard__chip ${i === activePairingIndex ? "widget-wizard__chip--active" : ""}`}
                onClick={() => onActivePairingChange(i)}
                style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Label */}
      <div className="widget-wizard__section-label">Label</div>
      <input
        className="widget-wizard__input"
        value={activePair.customLabel}
        onChange={(e) => onPairingUpdate(activePairingIndex, { customLabel: e.target.value })}
        placeholder={activePair.entity.entity_id}
      />

      {/* Icon */}
      <div className="widget-wizard__section-label">Icon (UI5 Name)</div>
      <input
        className="widget-wizard__input"
        value={activePair.customIcon}
        onChange={(e) => onPairingUpdate(activePairingIndex, { customIcon: e.target.value })}
        placeholder="z.B. lightbulb, temperature, home"
      />

      {/* Color */}
      <div className="widget-wizard__section-label">Farbe</div>
      <div className="sp__color-grid">
        {PRESET_COLORS_HEX.map((hex, i) => (
          <button
            key={hex}
            className={`sp__color-btn ${activePair.customColor === PRESET_COLORS[i].value ? "sp__color-btn--active" : ""}`}
            style={{ background: hex }}
            title={PRESET_COLORS[i].name}
            onClick={() => onPairingUpdate(activePairingIndex, {
              customColor: activePair.customColor === PRESET_COLORS[i].value ? "" : PRESET_COLORS[i].value,
            })}
          />
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        <input
          className="widget-wizard__input"
          value={activePair.customColor.startsWith("#") ? activePair.customColor : ""}
          onChange={(e) => onPairingUpdate(activePairingIndex, { customColor: e.target.value })}
          placeholder="Eigene Farbe (#hex)"
          style={{ maxWidth: 180 }}
        />
      </div>

      {/* Preview */}
      <div className="widget-wizard__section-label">Vorschau</div>
      <div className="sp__preview">
        <div className="sp__preview-card">
          <div className="sp__preview-name">{activePair.customLabel || activePair.entity.entity_id}</div>
          <div className="sp__preview-meta">
            {activePair.widgetType} · {activePair.size} · {activePair.entity.state}
          </div>
          {activePair.customColor && (
            <div
              className="sp__preview-accent"
              style={{ background: activePair.customColor }}
            />
          )}
        </div>
      </div>

      {/* Next */}
      <div style={{ marginTop: 16 }}>
        <button
          className="widget-wizard__btn widget-wizard__btn--primary"
          style={{ width: "100%" }}
          onClick={onNext}
        >
          Weiter
        </button>
      </div>

      <style>{`
        .sp__color-grid {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sp__color-btn {
          width: 32px;
          height: 32px;
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
        .sp__preview {
          padding: 8px 0;
        }
        .sp__preview-card {
          position: relative;
          padding: 16px;
          border-radius: var(--dh-card-radius);
          background: var(--dh-gray300);
          border: var(--dh-surface-border);
          overflow: hidden;
        }
        .sp__preview-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--dh-gray100);
        }
        .sp__preview-meta {
          font-size: 12px;
          color: var(--dh-gray100);
          opacity: 0.4;
          margin-top: 4px;
        }
        .sp__preview-accent {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
        }
      `}</style>
    </div>
  );
}
