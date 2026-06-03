import { useState, useEffect, useCallback } from "react";
import { useEntity } from "@/hooks/useEntity";
import { PopupModal } from "@/components/layout/PopupModal";
import { entityFriendlyName, isUnavailable } from "@/utils/formatEntityState";
import type { PopupProps } from "./PopupRegistry";
import "./ClimateDetailPopup.css";

/** German labels for HA climate hvac_modes (text only — avoids invalid UI5 icon names). */
const HVAC_MODE_LABELS: Record<string, string> = {
  off: "Aus",
  heat: "Heizen",
  cool: "Kühlen",
  heat_cool: "Auto",
  auto: "Auto",
  dry: "Entfeuchten",
  fan_only: "Lüften",
};

const HVAC_ACTION_LABELS: Record<string, string> = {
  heating: "heizt",
  cooling: "kühlt",
  drying: "entfeuchtet",
  fan: "lüftet",
  idle: "bereit",
  off: "aus",
};

export function ClimateDetailPopup({ onClose, callService, props }: PopupProps) {
  const entityId = (props?.entityId as string) || "";
  const entity = useEntity(entityId);
  const attrs = entity?.attributes || {};
  const name = entityFriendlyName(entityId, entity);

  const available = !isUnavailable(entity?.state);
  const hvacMode = entity?.state || "off";
  const hvacAction = attrs.hvac_action as string | undefined;
  const currentTemp = attrs.current_temperature as number | undefined;
  const currentHumidity = attrs.current_humidity as number | undefined;
  const targetTemp = attrs.temperature as number | undefined;
  const minTemp = (attrs.min_temp as number) ?? 7;
  const maxTemp = (attrs.max_temp as number) ?? 35;
  const step = (attrs.target_temp_step as number) || 0.5;
  const hvacModes = (attrs.hvac_modes as string[]) || [];

  // Optimistic target temperature so +/- feels instant; cleared on HA update.
  const [optimisticTarget, setOptimisticTarget] = useState<number | null>(null);
  useEffect(() => {
    setOptimisticTarget(null);
  }, [targetTemp]);

  const displayTarget = optimisticTarget ?? targetTemp;
  const canSetTemp = typeof displayTarget === "number" && Number.isFinite(displayTarget);

  const setTarget = useCallback(
    (next: number) => {
      const clamped = Math.max(minTemp, Math.min(maxTemp, Math.round(next / step) * step));
      setOptimisticTarget(clamped);
      callService("climate", "set_temperature", { temperature: clamped }, { entity_id: entityId });
    },
    [callService, entityId, minTemp, maxTemp, step],
  );

  const setMode = useCallback(
    (mode: string) => {
      callService("climate", "set_hvac_mode", { hvac_mode: mode }, { entity_id: entityId });
    },
    [callService, entityId],
  );

  return (
    <PopupModal open title={name} icon="temperature" onClose={onClose}>
      <div className="climate-detail">
        <div className="climate-detail__current">
          <div className="climate-detail__current-temp">
            {typeof currentTemp === "number" ? `${currentTemp.toFixed(1)}°` : "—"}
          </div>
          <div className="climate-detail__current-sub">
            Aktuell
            {available && hvacAction && HVAC_ACTION_LABELS[hvacAction] ? ` · ${HVAC_ACTION_LABELS[hvacAction]}` : ""}
            {typeof currentHumidity === "number" ? ` · ${Math.round(currentHumidity)} %` : ""}
          </div>
        </div>

        {canSetTemp && (
          <div className="climate-detail__target">
            <button
              className="climate-detail__step-btn"
              onClick={() => setTarget((displayTarget as number) - step)}
              aria-label="Wärmer verringern"
            >
              −
            </button>
            <div className="climate-detail__target-value">
              {(displayTarget as number).toFixed(1)}°
              <span className="climate-detail__target-label">Ziel</span>
            </div>
            <button
              className="climate-detail__step-btn"
              onClick={() => setTarget((displayTarget as number) + step)}
              aria-label="Wärmer erhöhen"
            >
              +
            </button>
          </div>
        )}

        {hvacModes.length > 0 && (
          <div className="climate-detail__modes">
            {hvacModes.map((mode) => (
              <button
                key={mode}
                className={`climate-detail__mode${mode === hvacMode ? " active" : ""}`}
                onClick={() => setMode(mode)}
              >
                {HVAC_MODE_LABELS[mode] || mode}
              </button>
            ))}
          </div>
        )}
      </div>
    </PopupModal>
  );
}
