// frontend/src/components/cards/AreaCardV2.tsx
import { useMemo, useCallback } from "react";
import { useEntity } from "@/hooks/useEntity";
import { useEntityStore } from "@/stores/entityStore";
import { apiUrl } from "@/utils/basePath";
import type { CardComponentProps } from "./CardRegistry";
import "./AreaCardV2.css";

/** Detect entity "on" state based on domain */
function isEntityOn(state: string | undefined, domain: string): boolean {
  if (!state) return false;
  if (domain === "vacuum") return state === "cleaning";
  if (domain === "media_player") return state === "playing";
  return state === "on";
}

/** Get icon for special entity based on domain/entity_id */
function getSpecialIcon(entityId: string): string {
  if (entityId.includes("vacuum") || entityId.includes("saugrobot")) return "🤖";
  if (entityId.includes("wasch") || entityId.includes("washing")) return "🫧";
  if (entityId.includes("trockner") || entityId.includes("dryer")) return "👕";
  if (entityId.includes("dishwasher") || entityId.includes("spuel")) return "🍽️";
  return "⚡";
}

export function AreaCardV2({ card, callService, onCardAction }: CardComponentProps) {
  const config = card.config ?? {};
  const areaId = config.area_id as string | undefined;
  const bgSource = (config.backgroundSource as string) || "area";
  const bgUrl = config.backgroundUrl as string | undefined;

  // Area info
  const area = useEntityStore((s) => areaId ? s.areas.get(areaId) : undefined);

  // Entities
  const tempEntity = useEntity(config.temperature_entity as string);
  const lightEntity = useEntity(config.light_entity as string);
  const specialEntity = useEntity(config.special_entity as string);
  const mediaEntity = useEntity(config.media_player_entity as string);

  // Background image
  const backgroundImage = useMemo(() => {
    if (bgSource === "custom" && bgUrl) return bgUrl;
    if (bgSource === "media" && mediaEntity?.attributes?.entity_picture) {
      return apiUrl(`/api/media/artwork?entity_id=${encodeURIComponent(config.media_player_entity as string)}`);
    }
    if (bgSource === "media" && area?.picture) return area.picture; // fallback
    if (area?.picture) return area.picture;
    return undefined;
  }, [bgSource, bgUrl, mediaEntity, area, config.media_player_entity]);

  const hasImage = !!backgroundImage;
  const areaName = area?.name || areaId || "Bereich";

  // Temperature
  const tempValue = tempEntity?.state ? parseFloat(tempEntity.state) : undefined;

  // Entity states
  const lightDomain = (config.light_entity as string)?.split(".")[0] || "light";
  const lightOn = isEntityOn(lightEntity?.state, lightDomain);

  const specialDomain = (config.special_entity as string)?.split(".")[0] || "";
  const specialOn = isEntityOn(specialEntity?.state, specialDomain);
  const specialIcon = config.special_entity ? getSpecialIcon(config.special_entity as string) : "⚡";

  const mediaPlaying = mediaEntity?.state === "playing";
  const mediaVolume = mediaEntity?.attributes?.volume_level as number | undefined;

  // Click handlers
  const handleClick = useCallback(() => {
    onCardAction?.("area-v2", { areaId, ...config });
  }, [onCardAction, areaId, config]);

  const handleMediaToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!config.media_player_entity) return;
    callService(
      "media_player",
      mediaPlaying ? "media_pause" : "media_play",
      {},
      { entity_id: config.media_player_entity as string }
    );
  }, [callService, config.media_player_entity, mediaPlaying]);

  const handleLightToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!config.light_entity) return;
    callService("light", lightOn ? "turn_off" : "turn_on", {}, { entity_id: config.light_entity as string });
  }, [callService, config.light_entity, lightOn]);

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
          {!!config.light_entity && (
            <button
              className={`acv2__btn ${lightOn ? "acv2__btn--light-on" : "acv2__btn--light-off"}`}
              onClick={handleLightToggle}
              title={lightOn ? "Licht aus" : "Licht an"}
            >
              💡
            </button>
          )}
          {!!config.media_player_entity && (
            <button
              className={`acv2__btn ${mediaPlaying ? "acv2__btn--media-on" : "acv2__btn--media-off"}`}
              onClick={(e) => { e.stopPropagation(); }}
              title="Media"
            >
              🔊
            </button>
          )}
          {!!config.special_entity && (
            <button
              className={`acv2__btn ${specialOn ? "acv2__btn--special-on" : "acv2__btn--special-off"}`}
              onClick={(e) => { e.stopPropagation(); }}
              title={config.special_entity as string}
            >
              {specialIcon}
            </button>
          )}
        </div>
      </div>

      <div className="acv2__bottom">
        {!!config.media_player_entity && (
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
