import { Icon } from "@ui5/webcomponents-react";

interface WizardStepEntryPointProps {
  onChooseWidgets: () => void;
  onChooseEntities: () => void;
}

export function WizardStepEntryPoint({ onChooseWidgets, onChooseEntities }: WizardStepEntryPointProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 14, opacity: 0.6, color: "var(--dh-gray100)", marginBottom: 4 }}>
        Wie moechtest du starten?
      </div>

      <button
        className="wz-entry__card"
        onClick={onChooseWidgets}
      >
        <div className="wz-entry__icon" style={{ background: "rgba(86, 204, 242, 0.15)" }}>
          <Icon name="grid" style={{ width: 24, height: 24, color: "var(--dh-blue)" }} />
        </div>
        <div className="wz-entry__text">
          <div className="wz-entry__title">Widgets durchsuchen</div>
          <div className="wz-entry__desc">
            Alle verfuegbaren Widget-Typen in einer Galerie durchsuchen und das passende Widget waehlen
          </div>
        </div>
        <Icon name="navigation-right-arrow" style={{ width: 16, height: 16, color: "var(--dh-gray100)", opacity: 0.4 }} />
      </button>

      <button
        className="wz-entry__card"
        onClick={onChooseEntities}
      >
        <div className="wz-entry__icon" style={{ background: "rgba(111, 207, 151, 0.15)" }}>
          <Icon name="list" style={{ width: 24, height: 24, color: "var(--dh-green)" }} />
        </div>
        <div className="wz-entry__text">
          <div className="wz-entry__title">Entities durchsuchen</div>
          <div className="wz-entry__desc">
            Alle Home Assistant Entities filtern, sortieren und Details einsehen
          </div>
        </div>
        <Icon name="navigation-right-arrow" style={{ width: 16, height: 16, color: "var(--dh-gray100)", opacity: 0.4 }} />
      </button>

      <style>{`
        .wz-entry__card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: var(--dh-card-radius);
          border: var(--dh-surface-border);
          background: var(--dh-gray300);
          cursor: pointer;
          transition: background 0.15s ease;
          text-align: left;
          width: 100%;
        }
        .wz-entry__card:hover {
          background: rgba(250, 251, 252, 0.06);
        }
        .wz-entry__icon {
          width: 48px;
          height: 48px;
          border-radius: var(--dh-card-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .wz-entry__text {
          flex: 1;
          min-width: 0;
        }
        .wz-entry__title {
          font-size: 15px;
          font-weight: 600;
          color: var(--dh-gray100);
          margin-bottom: 2px;
        }
        .wz-entry__desc {
          font-size: 12px;
          color: var(--dh-gray100);
          opacity: 0.5;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
