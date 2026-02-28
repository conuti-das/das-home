import { useReducer, useEffect, useCallback } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { WizardStepEntryPoint } from "./WizardStepEntryPoint";
import { WidgetGallery } from "./WidgetGallery";
import { EntityExplorer } from "./EntityExplorer";
import { EntityWidgetPairing } from "./EntityWidgetPairing";
import { SizeSelector } from "./SizeSelector";
import { StylingPanel } from "./StylingPanel";
import { PlacementPreview } from "./PlacementPreview";
import type { CardMetadata } from "@/components/cards/CardRegistry";
import type { EntityState } from "@/types";
import "./WidgetWizard.css";

export interface WidgetWizardProps {
  open: boolean;
  onClose: () => void;
  mode?: "add" | "edit";
  editingCard?: { sectionId: string; cardId: string } | null;
}

export interface EntityWidgetPair {
  entity: EntityState;
  widgetType: string;
  size: string;
  customLabel: string;
  customIcon: string;
  customColor: string;
}

type WizardStep = "entry" | "gallery" | "explorer" | "pairing" | "size" | "styling" | "placement";

interface WizardState {
  step: WizardStep;
  selectedWidget: CardMetadata | null;
  selectedEntities: EntityState[];
  pairings: EntityWidgetPair[];
  activePairingIndex: number;
}

type WizardAction =
  | { type: "RESET" }
  | { type: "SET_STEP"; step: WizardStep }
  | { type: "SELECT_WIDGET"; widget: CardMetadata }
  | { type: "SELECT_ENTITIES"; entities: EntityState[] }
  | { type: "SET_PAIRINGS"; pairings: EntityWidgetPair[] }
  | { type: "UPDATE_PAIRING"; index: number; updates: Partial<EntityWidgetPair> }
  | { type: "SET_ACTIVE_PAIRING"; index: number }
  | { type: "SET_ALL_WIDGET_TYPE"; widgetType: string };

const initialState: WizardState = {
  step: "entry",
  selectedWidget: null,
  selectedEntities: [],
  pairings: [],
  activePairingIndex: 0,
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "RESET":
      return { ...initialState };
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SELECT_WIDGET":
      return { ...state, selectedWidget: action.widget };
    case "SELECT_ENTITIES":
      return { ...state, selectedEntities: action.entities };
    case "SET_PAIRINGS":
      return { ...state, pairings: action.pairings };
    case "UPDATE_PAIRING": {
      const pairings = [...state.pairings];
      pairings[action.index] = { ...pairings[action.index], ...action.updates };
      return { ...state, pairings };
    }
    case "SET_ACTIVE_PAIRING":
      return { ...state, activePairingIndex: action.index };
    case "SET_ALL_WIDGET_TYPE": {
      const pairings = state.pairings.map((p) => ({ ...p, widgetType: action.widgetType }));
      return { ...state, pairings };
    }
    default:
      return state;
  }
}

function getStepNumber(step: WizardStep): number {
  // Map to logical steps (1-based) for display
  switch (step) {
    case "entry": return 1;
    case "gallery":
    case "explorer": return 2;
    case "pairing": return 3;
    case "size": return 4;
    case "styling": return 5;
    case "placement": return 6;
  }
}

function getProgressSteps(step: WizardStep): { label: string; active: boolean; done: boolean }[] {
  const num = getStepNumber(step);
  const labels = ["Einstieg", "Auswahl", "Zuordnung", "Groesse", "Styling", "Platzierung"];
  return labels.map((label, i) => ({
    label,
    active: i + 1 === num,
    done: i + 1 < num,
  }));
}

export function WidgetWizard({ open, onClose, mode = "add", editingCard }: WidgetWizardProps) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (open) {
      dispatch({ type: "RESET" });
      if (mode === "edit" && editingCard) {
        dispatch({ type: "SET_STEP", step: "pairing" });
      }
    }
  }, [open, mode, editingCard]);

  const handleBack = useCallback(() => {
    const { step } = state;
    switch (step) {
      case "gallery":
      case "explorer":
        dispatch({ type: "SET_STEP", step: "entry" });
        break;
      case "pairing":
        dispatch({
          type: "SET_STEP",
          step: state.selectedWidget ? "gallery" : "explorer",
        });
        break;
      case "size":
        dispatch({ type: "SET_STEP", step: "pairing" });
        break;
      case "styling":
        dispatch({ type: "SET_STEP", step: "size" });
        break;
      case "placement":
        dispatch({ type: "SET_STEP", step: "styling" });
        break;
    }
  }, [state]);

  if (!open) return null;

  const progressSteps = getProgressSteps(state.step);
  const canGoBack = state.step !== "entry";

  return (
    <div className="widget-wizard__backdrop" onClick={onClose}>
      <div className="widget-wizard__sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="widget-wizard__header">
          <span className="widget-wizard__title">
            {mode === "edit" ? "Karte bearbeiten" : "Karte hinzufuegen"}
          </span>
          <button className="widget-wizard__close" onClick={onClose}>
            <Icon name="decline" style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Stepper */}
        <div className="widget-wizard__stepper">
          {progressSteps.map((s, i) => (
            <div
              key={i}
              className={`widget-wizard__step-dot ${s.active ? "widget-wizard__step-dot--active" : ""} ${s.done ? "widget-wizard__step-dot--done" : ""}`}
            >
              <div className="widget-wizard__dot" />
              <span className="widget-wizard__step-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="widget-wizard__body">
          {state.step === "entry" && (
            <WizardStepEntryPoint
              onChooseWidgets={() => dispatch({ type: "SET_STEP", step: "gallery" })}
              onChooseEntities={() => dispatch({ type: "SET_STEP", step: "explorer" })}
            />
          )}

          {state.step === "gallery" && (
            <WidgetGallery
              onSelect={(widget, entities) => {
                dispatch({ type: "SELECT_WIDGET", widget });
                if (entities.length > 0) {
                  dispatch({ type: "SELECT_ENTITIES", entities });
                }
                dispatch({ type: "SET_STEP", step: "pairing" });
              }}
            />
          )}

          {state.step === "explorer" && (
            <EntityExplorer
              onSelect={(entities) => {
                dispatch({ type: "SELECT_ENTITIES", entities });
                dispatch({ type: "SET_STEP", step: "pairing" });
              }}
            />
          )}

          {state.step === "pairing" && (
            <EntityWidgetPairing
              selectedWidget={state.selectedWidget}
              selectedEntities={state.selectedEntities}
              pairings={state.pairings}
              onPairingsChange={(pairings) => dispatch({ type: "SET_PAIRINGS", pairings })}
              onNext={() => dispatch({ type: "SET_STEP", step: "size" })}
            />
          )}

          {state.step === "size" && (
            <SizeSelector
              pairings={state.pairings}
              activePairingIndex={state.activePairingIndex}
              onPairingUpdate={(index, updates) => dispatch({ type: "UPDATE_PAIRING", index, updates })}
              onActivePairingChange={(index) => dispatch({ type: "SET_ACTIVE_PAIRING", index })}
              onNext={() => dispatch({ type: "SET_STEP", step: "styling" })}
            />
          )}

          {state.step === "styling" && (
            <StylingPanel
              pairings={state.pairings}
              activePairingIndex={state.activePairingIndex}
              onPairingUpdate={(index, updates) => dispatch({ type: "UPDATE_PAIRING", index, updates })}
              onActivePairingChange={(index) => dispatch({ type: "SET_ACTIVE_PAIRING", index })}
              onNext={() => dispatch({ type: "SET_STEP", step: "placement" })}
            />
          )}

          {state.step === "placement" && (
            <PlacementPreview
              pairings={state.pairings}
              onClose={onClose}
            />
          )}
        </div>

        {/* Footer */}
        {canGoBack && state.step !== "placement" && (
          <div className="widget-wizard__footer">
            <button className="widget-wizard__btn widget-wizard__btn--secondary" onClick={handleBack}>
              Zurueck
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
