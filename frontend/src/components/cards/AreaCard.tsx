import { Icon } from "@ui5/webcomponents-react";
import { useEntityStore } from "@/stores/entityStore";
import { useEntitiesByArea } from "@/hooks/useEntity";
import { CardErrorBoundary } from "./CardErrorBoundary";
import type { CardComponentProps } from "./CardRegistry";
import "./AreaCard.css";

const AREA_ICONS: Record<string, string> = {
  living_room: "home",
  wohnzimmer: "home",
  bedroom: "bed",
  schlafzimmer: "bed",
  kitchen: "meal",
  kueche: "meal",
  küche: "meal",
  bathroom: "shower",
  badezimmer: "shower",
  bad: "shower",
  office: "laptop",
  buero: "laptop",
  büro: "laptop",
  garage: "car-rental",
  garden: "tree",
  garten: "tree",
  flur: "door",
  hallway: "door",
};

const AREA_COLORS: Record<string, string> = {
  living_room: "var(--dh-yellow)",
  wohnzimmer: "var(--dh-yellow)",
  bedroom: "var(--dh-purple)",
  schlafzimmer: "var(--dh-purple)",
  kitchen: "var(--dh-orange)",
  kueche: "var(--dh-orange)",
  küche: "var(--dh-orange)",
  bathroom: "var(--dh-blue)",
  badezimmer: "var(--dh-blue)",
  bad: "var(--dh-blue)",
  office: "var(--dh-green)",
  buero: "var(--dh-green)",
  büro: "var(--dh-green)",
  garage: "var(--dh-red)",
  garden: "var(--dh-green)",
  garten: "var(--dh-green)",
  flur: "var(--dh-pink)",
  hallway: "var(--dh-pink)",
};

function getAreaIcon(areaId: string): string {
  const lower = areaId.toLowerCase();
  for (const [key, icon] of Object.entries(AREA_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "building";
}

function getAreaColor(areaId: string): string {
  const lower = areaId.toLowerCase();
  for (const [key, color] of Object.entries(AREA_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "var(--dh-blue)";
}

export function AreaCard({ card, callService, onCardAction }: CardComponentProps) {
  const areaId = (card.config?.area_id as string) || "";
  const area = useEntityStore((s) => s.areas.get(areaId));
  const entities = useEntitiesByArea(areaId);

  const tempSensor = entities.find(
    (e) => e.entity_id.startsWith("sensor.") && e.entity_id.includes("temperature")
  );
  const temp = tempSensor?.state;

  const lights = entities.filter((e) => e.entity_id.startsWith("light."));
  const lightsOn = lights.filter((e) => e.state === "on").length;
  const domains = [...new Set(entities.map((e) => e.entity_id.split(".")[0]))];

  const handleClick = () => {
    onCardAction?.("area", { areaId });
  };


  return (
    <CardErrorBoundary cardType="area">
      <div className="area-card--big" onClick={handleClick}>
        <div className="area-card__header">
          <span className="area-card__name">{area?.name || areaId}</span>
          {temp && <span className="area-card__temp--big">{temp}°</span>}
        </div>
        {/* Device chips */}
        <div className="area-card__chips">
          {lights.length > 0 && (
            <button
              className={`area-card__chip ${lightsOn > 0 ? "area-card__chip--active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                // Toggle all lights
                const service = lightsOn > 0 ? "turn_off" : "turn_on";
                lights.forEach((l) => callService("light", service, {}, { entity_id: l.entity_id }));
              }}
            >
              <Icon name="lightbulb" style={{ width: 14, height: 14 }} />
              {lightsOn > 0 && <span>{lightsOn}</span>}
            </button>
          )}
          {domains.includes("media_player") && (
            <button className="area-card__chip">
              <Icon name="media-play" style={{ width: 14, height: 14 }} />
            </button>
          )}
          {domains.includes("climate") && (
            <button className="area-card__chip">
              <Icon name="temperature" style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>
    </CardErrorBoundary>
  );
}

export function AreaCardSmall({ card, onCardAction }: CardComponentProps) {
  const areaId = (card.config?.area_id as string) || "";
  const area = useEntityStore((s) => s.areas.get(areaId));
  const entities = useEntitiesByArea(areaId);

  const tempSensor = entities.find(
    (e) => e.entity_id.startsWith("sensor.") && e.entity_id.includes("temperature")
  );
  const humiditySensor = entities.find(
    (e) => e.entity_id.startsWith("sensor.") && e.entity_id.includes("humidity")
  );
  const temp = tempSensor?.state;
  const humidity = humiditySensor?.state;
  const areaColor = getAreaColor(areaId);
  const areaIcon = getAreaIcon(areaId);

  return (
    <CardErrorBoundary cardType="area_small">
      <div className="area-card--small" onClick={() => onCardAction?.("area", { areaId })}>
        <div className="area-card__icon-circle" style={{ background: areaColor + "26" }}>
          <Icon name={areaIcon} style={{ color: areaColor, width: "var(--dh-icon-size)", height: "var(--dh-icon-size)" }} />
        </div>
        <span className="area-card__name--small">{area?.name || areaId}</span>
        <span className="area-card__stats">
          {temp ? `${temp}°` : ""}
          {temp && humidity ? " " : ""}
          {humidity ? `${humidity}%` : ""}
        </span>
      </div>
    </CardErrorBoundary>
  );
}
