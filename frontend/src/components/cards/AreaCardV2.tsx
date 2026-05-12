// frontend/src/components/cards/AreaCardV2.tsx
import { useMemo, useCallback } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useEntity, useEntitiesByArea } from "@/hooks/useEntity";
import { useEntityStore } from "@/stores/entityStore";
import { apiUrl } from "@/utils/basePath";
import type { CardComponentProps } from "./CardRegistry";
import type { EntityState } from "@/types";
import "./AreaCardV2.css";

/** Auto-pick best entity for a slot from area entities. */
function pickEntityForSlot(
  entities: EntityState[],
  slot: "temperature" | "light" | "media" | "special",
): string | undefined {
  if (slot === "temperature") {
    const t = entities.find(
      (e) =>
        e.entity_id.startsWith("sensor.") &&
        (e.entity_id.includes("temperature") || e.entity_id.includes("temp")),
    );
    return t?.entity_id;
  }
  if (slot === "light") {
    return entities.find((e) => e.entity_id.startsWith("light."))?.entity_id;
  }
  if (slot === "media") {
    return entities.find((e) => e.entity_id.startsWith("media_player."))?.entity_id;
  }
  // special: vacuum / washer / dishwasher / dryer
  return entities.find((e) => {
    const id = e.entity_id.toLowerCase();
    if (!id.startsWith("vacuum.") && !id.startsWith("sensor.")) return false;
    return (
      id.includes("vacuum") ||
      id.includes("saugrobot") ||
      id.includes("wasch") ||
      id.includes("washing") ||
      id.includes("trockner") ||
      id.includes("dryer") ||
      id.includes("dishwasher") ||
      id.includes("spuel")
    );
  })?.entity_id;
}

/** Detect entity "on" state based on domain */
function isEntityOn(state: string | undefined, domain: string): boolean {
  if (!state) return false;
  if (domain === "vacuum") return state === "cleaning";
  if (domain === "media_player") return state === "playing";
  return state === "on";
}

/** Get UI5 icon name for special entity based on domain/entity_id */
function getSpecialIconName(entityId: string): string {
  if (entityId.includes("vacuum") || entityId.includes("saugrobot")) return "washing-machine";
  if (entityId.includes("wasch") || entityId.includes("washing")) return "washing-machine";
  if (entityId.includes("trockner") || entityId.includes("dryer")) return "temperature";
  if (entityId.includes("dishwasher") || entityId.includes("spuel")) return "meal";
  return "activate";
}

export function AreaCardV2({ card, callService, onCardAction }: CardComponentProps) {
  const config = card.config ?? {};
  const areaId = config.area_id as string | undefined;
  const bgSource = (config.backgroundSource as string) || "area";
  const bgUrl = config.backgroundUrl as string | undefined;

  // Area info
  const area = useEntityStore((s) => areaId ? s.areas.get(areaId) : undefined);

  // Auto-discovery fallback: when explicit entity configs are missing, pick from
  // entities mapped to this area. Lets a card configured with just area_id
  // populate without per-slot manual mapping.
  const areaEntities = useEntitiesByArea(areaId ?? "");
  const resolvedTemperatureEntity =
    (config.temperature_entity as string | undefined) ||
    (areaId ? pickEntityForSlot(areaEntities, "temperature") : undefined);
  const resolvedLightEntity =
    (config.light_entity as string | undefined) ||
    (areaId ? pickEntityForSlot(areaEntities, "light") : undefined);
  const resolvedMediaEntity =
    (config.media_player_entity as string | undefined) ||
    (areaId ? pickEntityForSlot(areaEntities, "media") : undefined);
  const resolvedSpecialEntity =
    (config.special_entity as string | undefined) ||
    (areaId ? pickEntityForSlot(areaEntities, "special") : undefined);

  // Entities
  const tempEntity = useEntity(resolvedTemperatureEntity ?? "");
  const lightEntity = useEntity(resolvedLightEntity ?? "");
  const specialEntity = useEntity(resolvedSpecialEntity ?? "");
  const mediaEntity = useEntity(resolvedMediaEntity ?? "");
  const cameraEntity = useEntity(config.camera_entity as string);

  // Background image
  const backgroundImage = useMemo(() => {
    if (bgSource === "custom" && bgUrl) return bgUrl;
    if (bgSource === "camera" && config.camera_entity) {
      return apiUrl(`/api/media/artwork?entity_id=${encodeURIComponent(config.camera_entity as string)}&t=${Math.floor(Date.now() / 30000)}`);
    }
    if (bgSource === "media" && mediaEntity?.attributes?.entity_picture && resolvedMediaEntity) {
      return apiUrl(`/api/media/artwork?entity_id=${encodeURIComponent(resolvedMediaEntity)}`);
    }
    if (bgSource === "media" && area?.picture) return area.picture; // fallback
    if (area?.picture) return area.picture;
    return undefined;
  }, [bgSource, bgUrl, cameraEntity, mediaEntity, area, resolvedMediaEntity, config.camera_entity]);

  const hasImage = !!backgroundImage;
  const areaName = area?.name || areaId || "Bereich";

  // Temperature
  const tempValue = tempEntity?.state ? parseFloat(tempEntity.state) : undefined;

  // Entity states
  const lightDomain = resolvedLightEntity?.split(".")[0] || "light";
  const lightOn = isEntityOn(lightEntity?.state, lightDomain);

  const specialDomain = resolvedSpecialEntity?.split(".")[0] || "";
  const specialOn = isEntityOn(specialEntity?.state, specialDomain);
  const specialIconName = resolvedSpecialEntity ? getSpecialIconName(resolvedSpecialEntity) : "electricity";

  const mediaPlaying = mediaEntity?.state === "playing";
  const mediaVolume = mediaEntity?.attributes?.volume_level as number | undefined;

  // Click handlers
  const handleClick = useCallback(() => {
    onCardAction?.("area-v2", { areaId, ...config });
  }, [onCardAction, areaId, config]);

  const handleMediaToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!resolvedMediaEntity) return;
    callService(
      "media_player",
      mediaPlaying ? "media_pause" : "media_play",
      {},
      { entity_id: resolvedMediaEntity }
    );
  }, [callService, resolvedMediaEntity, mediaPlaying]);

  const handleLightToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!resolvedLightEntity) return;
    callService("light", lightOn ? "turn_off" : "turn_on", {}, { entity_id: resolvedLightEntity });
  }, [callService, resolvedLightEntity, lightOn]);

  const cardClass = `area-card-v2 ${hasImage ? "area-card-v2--image" : "area-card-v2--light"}`;

  return (
    <div
      className={cardClass}
      style={hasImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
      onClick={handleClick}
    >
      <div className="acv2__top">
        <div className="acv2__info">
          <div className="acv2__name">{areaName}</div>
          {tempValue !== undefined && (
            <div className="acv2__temp">{tempValue.toFixed(1)}°</div>
          )}
        </div>

        <div className="acv2__buttons">
          {!!resolvedLightEntity && (
            <button
              className={`acv2__btn ${lightOn ? "acv2__btn--light-on" : "acv2__btn--light-off"}`}
              onClick={handleLightToggle}
              title={lightOn ? "Licht aus" : "Licht an"}
            >
              <Icon name="lightbulb" style={{ width: 18, height: 18 }} />
            </button>
          )}
          {!!resolvedMediaEntity && (
            <button
              className={`acv2__btn ${mediaPlaying ? "acv2__btn--media-on" : "acv2__btn--media-off"}`}
              onClick={(e) => { e.stopPropagation(); }}
              title="Media"
            >
              <Icon name="media-play" style={{ width: 18, height: 18 }} />
            </button>
          )}
          {!!resolvedSpecialEntity && (
            <button
              className={`acv2__btn ${specialOn ? "acv2__btn--special-on" : "acv2__btn--special-off"}`}
              onClick={(e) => { e.stopPropagation(); }}
              title={resolvedSpecialEntity}
            >
              <Icon name={specialIconName} style={{ width: 18, height: 18 }} />
            </button>
          )}
        </div>
      </div>

      <div className="acv2__bottom">
        {!!resolvedMediaEntity && (
          <div>
            <button
              className={`acv2__play-btn ${mediaPlaying ? "acv2__play-btn--playing" : "acv2__play-btn--stopped"}`}
              onClick={handleMediaToggle}
            >
              {mediaPlaying ? "⏸" : "▶"}
            </button>
            {mediaVolume !== undefined && (
              <div className="acv2__volume">
                <div className="acv2__volume-bar">
                  <div className="acv2__volume-fill" style={{ width: `${Math.round(mediaVolume * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
