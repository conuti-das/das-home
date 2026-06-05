// frontend/src/components/popups/AreaPopupV2.tsx
import { useState, useMemo, useCallback } from "react";
import { PopupModal } from "@/components/layout/PopupModal";
import { ControlTile } from "@/components/cards/ControlTile";
import { EntityPickerList } from "@/components/popups/EntityPickerList";
import { useEntity, useEntitiesByDomain, useEntitiesByArea } from "@/hooks/useEntity";
import { useEntityStore } from "@/stores/entityStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { api } from "@/services/api";
import { resolveAreaEntities } from "@/utils/resolveAreaEntities";
import { numericState } from "@/utils/formatEntityState";
import { apiUrl } from "@/utils/basePath";
import type { PopupProps } from "./PopupRegistry";
import "./AreaPopupV2.css";

/** Filter out sub-entities like WLED segments */
function isMainLight(e: { entity_id: string; attributes: Record<string, unknown> }): boolean {
  if (e.entity_id.includes("_segment_") || e.entity_id.includes("_channel_")) return false;
  if (e.attributes?.entity_category === "config" || e.attributes?.entity_category === "diagnostic") return false;
  return true;
}

type TabKey = "light" | "cover" | "climate";

export function AreaPopupV2({ onClose, callService, onOpenPopup, props }: PopupProps) {
  const areaId = props?.areaId as string | undefined;
  const cardId = props?.cardId as string | undefined;
  const area = useEntityStore((s) => areaId ? s.areas.get(areaId) : undefined);
  const areaEntities = useEntitiesByArea(areaId || "");
  const entityAreaMap = useEntityStore((s) => s.entityAreaMap);
  const allEntitiesMap = useEntityStore((s) => s.entities);

  // Curated visibility config (persisted per area-card in card.config).
  const popupHidden = useMemo(
    () => (Array.isArray(props?.popup_hidden_entities) ? (props.popup_hidden_entities as string[]) : []),
    [props],
  );
  const popupExtra = useMemo(
    () => (Array.isArray(props?.popup_extra_entities) ? (props.popup_extra_entities as string[]) : []),
    [props],
  );

  // Temperature entity from card config or area entities
  const configTempEntity = props?.temperature_entity as string | undefined;
  const tempEntity = useEntity(configTempEntity || "");
  const areaTempSensor = useMemo(() => {
    if (configTempEntity && tempEntity) return tempEntity;
    return areaEntities.find((e) =>
      e.entity_id.startsWith("sensor.") &&
      (e.attributes?.device_class === "temperature" || e.attributes?.unit_of_measurement === "°C")
    );
  }, [configTempEntity, tempEntity, areaEntities]);

  // Humidity sensor
  const humiditySensor = useMemo(() =>
    areaEntities.find((e) =>
      e.entity_id.startsWith("sensor.") &&
      e.attributes?.device_class === "humidity"
    ), [areaEntities]);

  // Media player
  const configMediaEntity = props?.media_player_entity as string | undefined;
  const mediaEntity = useEntity(configMediaEntity || "");
  const areaMediaPlayer = useMemo(() => {
    if (configMediaEntity && mediaEntity) return mediaEntity;
    return areaEntities.find((e) => e.entity_id.startsWith("media_player."));
  }, [configMediaEntity, mediaEntity, areaEntities]);

  // Filter entities by domain
  const covers = useMemo(() => areaEntities.filter((e) => e.entity_id.startsWith("cover.")), [areaEntities]);
  const climates = useMemo(() => areaEntities.filter((e) => e.entity_id.startsWith("climate.")), [areaEntities]);

  // Editor state for the curated light & switch list. Seeded from the persisted
  // card config (passed via props) and kept in sync locally so edits show
  // immediately without re-opening the popup.
  const [editMode, setEditMode] = useState(false);
  const [hidden, setHidden] = useState<string[]>(popupHidden);
  const [extra, setExtra] = useState<string[]>(popupExtra);

  // Mixed, ordered visible list (room lights + room switches − hidden + extras).
  const visible = useMemo(
    () => resolveAreaEntities(areaEntities, { popup_hidden_entities: hidden, popup_extra_entities: extra }, allEntitiesMap),
    [areaEntities, hidden, extra, allEntitiesMap],
  );

  // Room light/switch candidates for the editor (auto-visible set, main-only).
  const roomControls = useMemo(
    () => areaEntities.filter(
      (e) => (e.entity_id.startsWith("light.") || e.entity_id.startsWith("switch.")) && isMainLight(e),
    ),
    [areaEntities],
  );

  // All instance light/switch entities (for the "add foreign entity" search).
  const allLights = useEntitiesByDomain("light");
  const allSwitches = useEntitiesByDomain("switch");
  const allCandidates = useMemo(
    () => [...allLights, ...allSwitches].filter(isMainLight),
    [allLights, allSwitches],
  );

  const persistCuration = useCallback(
    (next: { hidden: string[]; extra: string[] }) => {
      setHidden(next.hidden);
      setExtra(next.extra);
      if (!cardId) return;
      useDashboardStore.getState().updateCardConfigById(cardId, {
        popup_hidden_entities: next.hidden,
        popup_extra_entities: next.extra,
      });
      const current = useDashboardStore.getState().dashboard;
      if (current) api.putDashboard(current).catch(console.error);
    },
    [cardId],
  );

  const hasControls = visible.length > 0 || roomControls.length > 0;

  // Scenes in this area
  const allScenes = useEntitiesByDomain("scene");
  const areaScenes = useMemo(() =>
    allScenes.filter((s) => entityAreaMap.get(s.entity_id) === areaId),
    [allScenes, entityAreaMap, areaId]
  );

  // Tab state
  const availableTabs = useMemo(() => {
    const tabs: { key: TabKey; label: string; icon: string }[] = [];
    if (hasControls) tabs.push({ key: "light", label: "Licht & Schalter", icon: "💡" });
    if (covers.length > 0) tabs.push({ key: "cover", label: "Rollos", icon: "🪟" });
    if (climates.length > 0) tabs.push({ key: "climate", label: "Klima", icon: "❄️" });
    return tabs;
  }, [hasControls, covers, climates]);

  const [activeTab, setActiveTab] = useState<TabKey>("light");

  // Text overview — numericState returns undefined for unavailable/unknown/
  // non-numeric states, so an offline sensor no longer renders as "NaN°".
  const tempValue = numericState(areaTempSensor);
  const humidityValue = numericState(humiditySensor);

  const areaName = area?.name || areaId || "Bereich";

  // Handlers
  const handleSceneActivate = useCallback((entityId: string) => {
    callService("scene", "turn_on", {}, { entity_id: entityId });
  }, [callService]);

  const handleMediaToggle = useCallback(() => {
    if (!areaMediaPlayer) return;
    const isPlaying = areaMediaPlayer.state === "playing";
    callService("media_player", isPlaying ? "media_pause" : "media_play", {}, { entity_id: areaMediaPlayer.entity_id });
  }, [callService, areaMediaPlayer]);

  const handleVolumeChange = useCallback((delta: number) => {
    if (!areaMediaPlayer) return;
    const current = (areaMediaPlayer.attributes?.volume_level as number) ?? 0.5;
    const next = Math.min(1, Math.max(0, current + delta));
    callService("media_player", "volume_set", { volume_level: next }, { entity_id: areaMediaPlayer.entity_id });
  }, [callService, areaMediaPlayer]);

  const handleCardAction = useCallback((popupId: string, actionProps?: Record<string, unknown>) => {
    onOpenPopup?.(popupId, actionProps);
  }, [onOpenPopup]);

  const mediaTitle = areaMediaPlayer?.attributes?.media_title as string | undefined;
  const mediaArtist = areaMediaPlayer?.attributes?.media_artist as string | undefined;
  const mediaPlaying = areaMediaPlayer?.state === "playing";
  const mediaPicture = areaMediaPlayer?.attributes?.entity_picture as string | undefined;
  const mediaVolume = areaMediaPlayer?.attributes?.volume_level as number | undefined;

  return (
    <PopupModal open title={areaName} icon="home" onClose={onClose}>
      {/* Text overview */}
      <div className="apv2__text-overview">
        {tempValue !== undefined && (
          <>Es ist <span className="apv2__highlight apv2__highlight--warm">{tempValue.toFixed(1)}°</span> im {areaName}</>
        )}
        {tempValue !== undefined && humidityValue !== undefined && " und die Luftfeuchtigkeit betraegt "}
        {humidityValue !== undefined && (
          <span className="apv2__highlight apv2__highlight--info">{humidityValue}%</span>
        )}
        {(tempValue !== undefined || humidityValue !== undefined) && "."}
      </div>

      {/* Scenes */}
      {areaScenes.length > 0 && (
        <div className="apv2__scenes">
          {areaScenes.map((scene) => {
            const name = (scene.attributes?.friendly_name as string) || scene.entity_id.split(".")[1];
            const icon = (scene.attributes?.icon as string) || "🎬";
            return (
              <button
                key={scene.entity_id}
                className="apv2__scene-btn"
                onClick={() => handleSceneActivate(scene.entity_id)}
              >
                <div className="apv2__scene-icon">{icon.startsWith("mdi:") ? "🎬" : icon}</div>
                <div className="apv2__scene-name">{name}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Media player */}
      {areaMediaPlayer && (
        <div className="apv2__media">
          <div className="apv2__media-art">
            {mediaPicture ? (
              <img
                src={apiUrl(`/api/media/artwork?entity_id=${encodeURIComponent(areaMediaPlayer.entity_id)}`)}
                alt=""
                loading="lazy"
              />
            ) : "🎵"}
          </div>
          <div className="apv2__media-info">
            <div className="apv2__media-title">{mediaTitle || (areaMediaPlayer.attributes?.friendly_name as string) || "Media Player"}</div>
            <div className="apv2__media-artist">{mediaArtist || areaMediaPlayer.state}</div>
          </div>
          <div className="apv2__media-controls">
            <button className="apv2__media-vol" onClick={() => handleVolumeChange(-0.05)}>−</button>
            <button className="apv2__media-play" onClick={handleMediaToggle}>
              {mediaPlaying ? "⏸" : "▶"}
            </button>
            <button className="apv2__media-vol" onClick={() => handleVolumeChange(0.05)}>+</button>
            {mediaVolume !== undefined && (
              <span className="apv2__media-vol-label">{Math.round(mediaVolume * 100)}%</span>
            )}
          </div>
        </div>
      )}

      {/* Category tabs */}
      {availableTabs.length > 0 && (
        <div className="apv2__tabs">
          {availableTabs.map((t) => (
            <button
              key={t.key}
              className={`apv2__tab ${activeTab === t.key ? "apv2__tab--active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Light & switch tab: section label with edit toggle, then either the
          mixed ControlTile list or the editor (EntityPickerList). */}
      {activeTab === "light" && hasControls && (
        <>
          <div className="apv2__sec-label">
            <span className="apv2__sec-label-text">
              {editMode ? "Sichtbar im Popup wählen" : "Licht & Schalter"}
            </span>
            {cardId && (
              <button
                type="button"
                className="apv2__sec-edit"
                onClick={() => setEditMode((v) => !v)}
              >
                {editMode ? "Fertig" : "⚙ Bearbeiten"}
              </button>
            )}
          </div>
          {editMode ? (
            <EntityPickerList
              roomEntities={roomControls}
              allCandidates={allCandidates}
              hidden={hidden}
              extra={extra}
              onChange={persistCuration}
            />
          ) : (
            <div className="apv2__entity-list">
              {visible.map((entity) => (
                <ControlTile
                  key={entity.entity_id}
                  entityId={entity.entity_id}
                  callService={callService}
                  onCardAction={handleCardAction}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Cover / climate controls */}
      <div className="apv2__entity-list">
        {activeTab === "cover" && covers.map((cover) => {
          const name = (cover.attributes?.friendly_name as string) || cover.entity_id.split(".")[1];
          const isOpen = cover.state === "open";
          const position = cover.attributes?.current_position as number | undefined;
          return (
            <div key={cover.entity_id} style={{
              background: "var(--dh-gray300)",
              borderRadius: "var(--dh-card-radius)",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--dh-gray100)" }}>{name}</div>
                <div style={{ fontSize: 11, color: "var(--dh-gray100)", opacity: 0.5, marginTop: 2 }}>
                  {isOpen ? `Offen${position !== undefined ? ` (${position}%)` : ""}` : "Geschlossen"}
                </div>
              </div>
              <button
                style={{
                  background: isOpen ? "rgba(86,204,242,0.15)" : "rgba(255,255,255,0.08)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  color: isOpen ? "var(--dh-blue)" : "var(--dh-gray100)",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => callService("cover", isOpen ? "close_cover" : "open_cover", {}, { entity_id: cover.entity_id })}
              >
                {isOpen ? "▼" : "▲"}
              </button>
            </div>
          );
        })}

        {activeTab === "climate" && climates.map((climate) => {
          const name = (climate.attributes?.friendly_name as string) || climate.entity_id.split(".")[1];
          const currentTemp = climate.attributes?.current_temperature as number | undefined;
          const targetTemp = climate.attributes?.temperature as number | undefined;
          const mode = climate.state;
          return (
            <div key={climate.entity_id} style={{
              background: "var(--dh-gray300)",
              borderRadius: "var(--dh-card-radius)",
              padding: "12px 16px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--dh-gray100)" }}>{name}</div>
              <div style={{ fontSize: 11, color: "var(--dh-gray100)", opacity: 0.5, marginTop: 4 }}>
                {mode} · Aktuell: {currentTemp !== undefined ? `${currentTemp}°` : "--"}
                {targetTemp !== undefined && ` · Ziel: ${targetTemp}°`}
              </div>
            </div>
          );
        })}
      </div>
    </PopupModal>
  );
}
