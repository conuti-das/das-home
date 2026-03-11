import { Icon } from "@ui5/webcomponents-react";
import { useEntitiesByDomain } from "@/hooks/useEntity";
import "./StatusBar.css";

interface StatusBarProps {
  onWeatherClick?: () => void;
  onTrashClick?: () => void;
  onLightsClick?: () => void;
}

export function StatusBar({ onTrashClick, onLightsClick }: StatusBarProps) {
  const lights = useEntitiesByDomain("light");
  const lightsOn = lights.filter((e) => e.state === "on").length;

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
