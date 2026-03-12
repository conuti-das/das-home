import { useEffect, useState } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useEntitiesByDomain } from "@/hooks/useEntity";
import "./StatusBar.css";

interface StatusBarProps {
  onWeatherClick?: () => void;
  onTrashClick?: () => void;
  onLightsClick?: () => void;
  onOpenPopup?: (popupId: string, props?: Record<string, unknown>) => void;
}

/** Filter out sub-entities like WLED segments */
function isMainLight(e: { entity_id: string; attributes: Record<string, unknown> }): boolean {
  if (e.entity_id.includes("_segment_") || e.entity_id.includes("_channel_")) return false;
  if (e.attributes?.entity_category === "config" || e.attributes?.entity_category === "diagnostic") return false;
  return true;
}

function useCurrentTime(): string {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

/** Format remaining time from attributes */
function formatRemaining(attrs: Record<string, unknown>): string {
  const remaining = attrs?.remaining as string | undefined;
  if (remaining) return remaining;
  const finishAt = attrs?.finish_at as string | undefined;
  if (finishAt) {
    try {
      const diff = Math.max(0, Math.round((new Date(finishAt).getTime() - Date.now()) / 60000));
      if (diff < 1) return "gleich fertig";
      return `${diff} Min`;
    } catch { /* ignore */ }
  }
  return "";
}

export function StatusBar({ onTrashClick, onLightsClick, onOpenPopup }: StatusBarProps) {
  const time = useCurrentTime();

  const allLights = useEntitiesByDomain("light");
  const lightsOn = allLights.filter((e) => e.state === "on" && isMainLight(e)).length;

  // Find trash sensor
  const allSensors = useEntitiesByDomain("sensor");
  const trashSensor = allSensors.find(
    (e) => e.entity_id.includes("waste") || e.entity_id.includes("trash") || e.entity_id.includes("muell") || e.entity_id.includes("abfall")
  );
  const trashDays = trashSensor ? parseInt(trashSensor.state) : undefined;

  // Media players playing
  const mediaPlayers = useEntitiesByDomain("media_player");
  const playingMedia = mediaPlayers.filter((e) => e.state === "playing");

  // Active special devices
  const vacuums = useEntitiesByDomain("vacuum");
  const activeVacuum = vacuums.find((e) => e.state === "cleaning");

  // Washing machine / dryer (look for common patterns)
  const allSwitches = useEntitiesByDomain("sensor");
  const washingMachine = allSwitches.find((e) =>
    (e.entity_id.includes("wasch") || e.entity_id.includes("washing")) &&
    e.attributes?.device_class === "running"
  );
  const dryer = allSwitches.find((e) =>
    (e.entity_id.includes("trockner") || e.entity_id.includes("dryer")) &&
    e.attributes?.device_class === "running"
  );

  return (
    <div className="status-bar">
      {/* Clock */}
      <div className="status-chip">
        <div className="status-chip__icon">
          <Icon name="history" style={{ width: 16, height: 16, color: "var(--dh-gray100)", opacity: 0.6 }} />
        </div>
        <span className="status-chip__value">{time}</span>
      </div>

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

      {/* Media players playing */}
      {playingMedia.map((mp) => {
        const title = (mp.attributes?.media_title as string) || "";
        const name = (mp.attributes?.friendly_name as string) || mp.entity_id.split(".")[1];
        const label = title ? `${name}: ${title}` : name;
        return (
          <div
            key={mp.entity_id}
            className="status-chip status-chip--media"
            onClick={() => onOpenPopup?.("media-detail", { entityId: mp.entity_id })}
          >
            <div className="status-chip__icon">
              <Icon name="media-play" style={{ width: 16, height: 16, color: "var(--dh-blue)" }} />
            </div>
            <span className="status-chip__text">{label}</span>
          </div>
        );
      })}

      {/* Vacuum active */}
      {activeVacuum && (
        <div className="status-chip status-chip--dynamic">
          <div className="status-chip__icon">
            <Icon name="washing-machine" style={{ width: 18, height: 18, color: "var(--dh-green)" }} />
          </div>
          <span className="status-chip__text">
            Sauger aktiv
            {formatRemaining(activeVacuum.attributes) && ` · ${formatRemaining(activeVacuum.attributes)}`}
          </span>
        </div>
      )}

      {/* Washing machine */}
      {washingMachine && washingMachine.state === "on" && (
        <div className="status-chip status-chip--dynamic">
          <div className="status-chip__icon">
            <Icon name="washing-machine" style={{ width: 18, height: 18, color: "var(--dh-blue)" }} />
          </div>
          <span className="status-chip__text">
            Waschmaschine{formatRemaining(washingMachine.attributes) && ` · ${formatRemaining(washingMachine.attributes)}`}
          </span>
        </div>
      )}

      {/* Dryer */}
      {dryer && dryer.state === "on" && (
        <div className="status-chip status-chip--dynamic">
          <div className="status-chip__icon">
            <Icon name="temperature" style={{ width: 18, height: 18, color: "var(--dh-orange)" }} />
          </div>
          <span className="status-chip__text">
            Trockner{formatRemaining(dryer.attributes) && ` · ${formatRemaining(dryer.attributes)}`}
          </span>
        </div>
      )}
    </div>
  );
}
