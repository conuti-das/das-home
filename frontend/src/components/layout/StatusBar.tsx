import { Icon } from "@ui5/webcomponents-react";
import { useEntitiesByDomain } from "@/hooks/useEntity";
import "./StatusBar.css";

interface StatusBarProps {
  onWeatherClick?: () => void;
  onTrashClick?: () => void;
  onLightsClick?: () => void;
}

/** Filter out sub-entities like WLED segments */
function isMainLight(e: { entity_id: string; attributes: Record<string, unknown> }): boolean {
  if (e.entity_id.includes("_segment_") || e.entity_id.includes("_channel_")) return false;
  if (e.attributes?.entity_category === "config" || e.attributes?.entity_category === "diagnostic") return false;
  return true;
}

export function StatusBar({ onTrashClick, onLightsClick }: StatusBarProps) {
  const allLights = useEntitiesByDomain("light");
  const lightsOn = allLights.filter((e) => e.state === "on" && isMainLight(e)).length;

  // Find trash sensor (common patterns)
  const allSensors = useEntitiesByDomain("sensor");
  const trashSensor = allSensors.find(
    (e) => e.entity_id.includes("waste") || e.entity_id.includes("trash") || e.entity_id.includes("muell") || e.entity_id.includes("abfall")
  );
  const trashDays = trashSensor ? parseInt(trashSensor.state) : undefined;

  // Active special devices
  const vacuums = useEntitiesByDomain("vacuum");
  const activeVacuum = vacuums.find((e) => e.state === "cleaning");

  return (
    <div className="status-bar">
      {/* Trash Chip */}
      {trashSensor && trashDays !== undefined && !isNaN(trashDays) && (
        <div className="status-chip" onClick={onTrashClick}>
          <div className="status-chip__icon">
            <Icon name="delete" style={{ width: 18, height: 18, color: trashDays <= 1 ? "var(--dh-red)" : trashDays <= 3 ? "var(--dh-yellow)" : "var(--dh-green)" }} />
          </div>
          <span className="status-chip__text">
            {trashDays === 0 ? "Heute" : trashDays === 1 ? "Morgen" : `${trashDays}d`} Müll
          </span>
        </div>
      )}

      {/* Lights Chip */}
      {lightsOn > 0 && (
        <div className="status-chip" onClick={onLightsClick}>
          <div className="status-chip__icon">
            <Icon name="lightbulb" style={{ width: 18, height: 18, color: "var(--dh-yellow)" }} />
          </div>
          <span className="status-chip__text">{lightsOn} an</span>
        </div>
      )}

      {/* Vacuum active */}
      {activeVacuum && (
        <div className="status-chip">
          <div className="status-chip__icon">
            <Icon name="washing-machine" style={{ width: 18, height: 18, color: "var(--dh-green)" }} />
          </div>
          <span className="status-chip__text">Sauger aktiv</span>
        </div>
      )}
    </div>
  );
}
