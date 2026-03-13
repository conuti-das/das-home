import { useEffect, useState, useMemo } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useEntitiesByDomain } from "@/hooks/useEntity";
import { useDashboardStore } from "@/stores/dashboardStore";
import { WeatherBadges } from "./WeatherBadges";
import type { BadgeConfig } from "@/types";
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

const DEFAULT_BADGES: BadgeConfig[] = [
  { type: "clock", enabled: true },
  { type: "lights", enabled: true },
  { type: "trash", enabled: true },
  { type: "weather_hourly", enabled: true, count: 3 },
  { type: "weather_daily", enabled: true, count: 3 },
  { type: "media", enabled: true },
  { type: "vacuum", enabled: true },
  { type: "washing", enabled: true },
  { type: "dryer", enabled: true },
];

function isBadgeEnabled(badges: BadgeConfig[], type: string): boolean {
  const badge = badges.find((b) => b.type === type);
  return badge ? badge.enabled : true;
}

function getBadgeCount(badges: BadgeConfig[], type: string, fallback: number): number {
  const badge = badges.find((b) => b.type === type);
  return badge?.count ?? fallback;
}

export function StatusBar({ onTrashClick, onLightsClick, onOpenPopup }: StatusBarProps) {
  const time = useCurrentTime();
  const editMode = useDashboardStore((s) => s.editMode);
  const dashboard = useDashboardStore((s) => s.dashboard);

  // Get badge config from overview view
  const badgeConfig = useMemo(() => {
    const overviewView = dashboard?.views.find((v) => v.id === "overview");
    const badges = overviewView?.header?.badges;
    if (!badges || badges.length === 0 || typeof badges[0] === "string") {
      return DEFAULT_BADGES;
    }
    return badges as BadgeConfig[];
  }, [dashboard]);

  // Ordered list of enabled badge types
  const enabledBadges = useMemo(() => badgeConfig.filter((b) => b.enabled), [badgeConfig]);

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

  // Weather badge config
  const showHourly = isBadgeEnabled(badgeConfig, "weather_hourly");
  const showDaily = isBadgeEnabled(badgeConfig, "weather_daily");
  const hourlyCount = getBadgeCount(badgeConfig, "weather_hourly", 3);
  const dailyCount = getBadgeCount(badgeConfig, "weather_daily", 3);

  /** Render a single badge by type */
  function renderBadge(type: string) {
    switch (type) {
      case "clock":
        return (
          <div key="clock" className="status-chip">
            <div className="status-chip__icon">
              <Icon name="history" style={{ width: 16, height: 16, color: "var(--dh-gray100)", opacity: 0.6 }} />
            </div>
            <span className="status-chip__value">{time}</span>
          </div>
        );

      case "trash":
        if (!trashSensor || trashDays === undefined || isNaN(trashDays)) return null;
        return (
          <div key="trash" className="status-chip" onClick={onTrashClick}>
            <div className="status-chip__icon">
              <Icon name="delete" style={{ width: 18, height: 18, color: trashDays <= 1 ? "var(--dh-red)" : trashDays <= 3 ? "var(--dh-yellow)" : "var(--dh-green)" }} />
            </div>
            <span className="status-chip__text">
              {trashDays === 0 ? "Heute" : trashDays === 1 ? "Morgen" : `${trashDays}d`} Müll
            </span>
          </div>
        );

      case "lights":
        if (lightsOn <= 0) return null;
        return (
          <div key="lights" className="status-chip" onClick={onLightsClick}>
            <div className="status-chip__icon">
              <Icon name="lightbulb" style={{ width: 18, height: 18, color: "var(--dh-yellow)" }} />
            </div>
            <span className="status-chip__text">{lightsOn} an</span>
          </div>
        );

      case "weather_hourly":
      case "weather_daily":
        // Handled as a group — only render once for the first weather badge encountered
        return null;

      case "media":
        if (playingMedia.length === 0) return null;
        if (playingMedia.length === 1) {
          const mp = playingMedia[0];
          const title = (mp.attributes?.media_title as string) || "";
          const name = (mp.attributes?.friendly_name as string) || mp.entity_id.split(".")[1];
          const label = title ? `${name}: ${title}` : name;
          return (
            <div key="media" className="status-chip status-chip--media" onClick={() => onOpenPopup?.("media-detail", { entityId: mp.entity_id })}>
              <div className="status-chip__icon">
                <Icon name="media-play" style={{ width: 16, height: 16, color: "var(--dh-blue)" }} />
              </div>
              <span className="status-chip__text">{label}</span>
            </div>
          );
        }
        return (
          <div key="media" className="status-chip status-chip--media" onClick={() => onOpenPopup?.("media-detail", { entityId: playingMedia[0].entity_id })}>
            <div className="status-chip__icon">
              <Icon name="media-play" style={{ width: 16, height: 16, color: "var(--dh-blue)" }} />
            </div>
            <span className="status-chip__text">{playingMedia.length} spielen</span>
          </div>
        );

      case "vacuum":
        if (!activeVacuum) return null;
        return (
          <div key="vacuum" className="status-chip status-chip--dynamic">
            <div className="status-chip__icon">
              <Icon name="washing-machine" style={{ width: 18, height: 18, color: "var(--dh-green)" }} />
            </div>
            <span className="status-chip__text">
              Sauger aktiv
              {formatRemaining(activeVacuum.attributes) && ` · ${formatRemaining(activeVacuum.attributes)}`}
            </span>
          </div>
        );

      case "washing":
        if (!washingMachine || washingMachine.state !== "on") return null;
        return (
          <div key="washing" className="status-chip status-chip--dynamic">
            <div className="status-chip__icon">
              <Icon name="washing-machine" style={{ width: 18, height: 18, color: "var(--dh-blue)" }} />
            </div>
            <span className="status-chip__text">
              Waschmaschine{formatRemaining(washingMachine.attributes) && ` · ${formatRemaining(washingMachine.attributes)}`}
            </span>
          </div>
        );

      case "dryer":
        if (!dryer || dryer.state !== "on") return null;
        return (
          <div key="dryer" className="status-chip status-chip--dynamic">
            <div className="status-chip__icon">
              <Icon name="temperature" style={{ width: 18, height: 18, color: "var(--dh-orange)" }} />
            </div>
            <span className="status-chip__text">
              Trockner{formatRemaining(dryer.attributes) && ` · ${formatRemaining(dryer.attributes)}`}
            </span>
          </div>
        );

      default:
        return null;
    }
  }

  // Find where weather badges should be inserted (at the position of the first weather badge in the order)
  const weatherInsertIndex = enabledBadges.findIndex((b) => b.type === "weather_hourly" || b.type === "weather_daily");

  return (
    <div className="status-bar">
      {enabledBadges.map((badge, index) => {
        // Insert weather badges at the right position
        if (index === weatherInsertIndex) {
          return (
            <WeatherBadges
              key="weather"
              onOpenPopup={onOpenPopup}
              showHourly={showHourly}
              showDaily={showDaily}
              hourlyCount={hourlyCount}
              dailyCount={dailyCount}
            />
          );
        }
        // Skip the second weather badge type (already rendered above)
        if (badge.type === "weather_hourly" || badge.type === "weather_daily") return null;
        return renderBadge(badge.type);
      })}

      {/* If no weather badge in config, still check if we need to render it for backwards compat */}
      {weatherInsertIndex === -1 && (showHourly || showDaily) && (
        <WeatherBadges
          onOpenPopup={onOpenPopup}
          showHourly={showHourly}
          showDaily={showDaily}
          hourlyCount={hourlyCount}
          dailyCount={dailyCount}
        />
      )}

      {/* Edit button - only in edit mode */}
      {editMode && (
        <button
          className="status-bar__edit-btn"
          onClick={() => onOpenPopup?.("badge-editor")}
          title="Badges konfigurieren"
        >
          <Icon name="edit" style={{ width: 14, height: 14 }} />
        </button>
      )}
    </div>
  );
}
