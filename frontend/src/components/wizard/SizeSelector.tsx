import type { EntityWidgetPair } from "./WidgetWizard";

interface SizeSelectorProps {
  pairings: EntityWidgetPair[];
  activePairingIndex: number;
  onPairingUpdate: (index: number, updates: Partial<EntityWidgetPair>) => void;
  onActivePairingChange: (index: number) => void;
  onNext: () => void;
}

const SIZES = [
  { value: "1x1", label: "1x1", cols: 1, rows: 1 },
  { value: "2x1", label: "2x1", cols: 2, rows: 1 },
  { value: "1x2", label: "1x2", cols: 1, rows: 2 },
  { value: "2x2", label: "2x2", cols: 2, rows: 2 },
];

export function SizeSelector({
  pairings,
  activePairingIndex,
  onPairingUpdate,
  onActivePairingChange,
  onNext,
}: SizeSelectorProps) {
  const activePair = pairings[activePairingIndex];
  if (!activePair) return null;

  const handleApplyAll = (size: string) => {
    for (let i = 0; i < pairings.length; i++) {
      onPairingUpdate(i, { size });
    }
  };

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

      <div className="widget-wizard__section-label">
        Groesse fuer {activePair.customLabel || activePair.entity.entity_id}
      </div>

      {/* Size grid */}
      <div className="sz__grid">
        {SIZES.map((size) => (
          <button
            key={size.value}
            className={`sz__option ${activePair.size === size.value ? "sz__option--active" : ""}`}
            onClick={() => onPairingUpdate(activePairingIndex, { size: size.value })}
          >
            <div className="sz__preview" style={{ gridTemplateColumns: `repeat(${size.cols}, 1fr)`, gridTemplateRows: `repeat(${size.rows}, 1fr)` }}>
              <div className="sz__preview-block" style={{ gridColumn: `1 / ${size.cols + 1}`, gridRow: `1 / ${size.rows + 1}` }} />
            </div>
            <span className="sz__label">{size.label}</span>
          </button>
        ))}
      </div>

      {/* Apply to all */}
      {pairings.length > 1 && (
        <div style={{ marginTop: 12 }}>
          <button
            className="ee__link-btn"
            style={{ fontSize: 12, color: "var(--dh-blue)", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => handleApplyAll(activePair.size)}
          >
            Groesse auf alle anwenden ({activePair.size})
          </button>
        </div>
      )}

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
        .sz__grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .sz__option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 8px;
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
        .sz__preview {
          display: grid;
          gap: 3px;
          width: 48px;
          height: 48px;
        }
        .sz__preview-block {
          border-radius: 4px;
          background: rgba(86, 204, 242, 0.25);
        }
        .sz__option--active .sz__preview-block {
          background: var(--dh-blue);
        }
        .sz__label {
          font-size: 13px;
          font-weight: 600;
          color: var(--dh-gray100);
        }
      `}</style>
    </div>
  );
}
