import { useCallback, useMemo, useState } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useEntityStore } from "@/stores/entityStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useEntitiesByArea, useEntitiesByDomain } from "@/hooks/useEntity";
import { api } from "@/services/api";
import { resolveAreaEntities } from "@/utils/resolveAreaEntities";
import { PopupModal } from "@/components/layout/PopupModal";
import { ControlTile } from "@/components/cards/ControlTile";
import { EntityPickerList } from "@/components/popups/EntityPickerList";
import type { PopupProps } from "./PopupRegistry";
import "./AreaPopupV2.css";

/** Filter out sub-entities (WLED segments) + config/diagnostic helpers. */
function isMainControl(e: { entity_id: string; attributes: Record<string, unknown> }): boolean {
  if (e.entity_id.includes("_segment_") || e.entity_id.includes("_channel_")) return false;
  if (e.attributes?.entity_category === "config" || e.attributes?.entity_category === "diagnostic") return false;
  return true;
}

export function AreaPopup({ onClose, callService, onOpenPopup, props }: PopupProps) {
  const areaId = (props?.areaId as string) || "";
  const cardId = props?.cardId as string | undefined;
  const area = useEntityStore((s) => s.areas.get(areaId));
  const entities = useEntitiesByArea(areaId);
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

  const climates = entities.filter((e) => e.entity_id.startsWith("climate."));
  const mediaPlayers = entities.filter((e) => e.entity_id.startsWith("media_player."));

  const tempSensor = entities.find(
    (e) => e.entity_id.startsWith("sensor.") && e.entity_id.includes("temperature")
  );
  const humiditySensor = entities.find(
    (e) => e.entity_id.startsWith("sensor.") && e.entity_id.includes("humidity")
  );

  // Editor state for the curated light & switch list (seeded from card config).
  const [editMode, setEditMode] = useState(false);
  const [hidden, setHidden] = useState<string[]>(popupHidden);
  const [extra, setExtra] = useState<string[]>(popupExtra);

  // Mixed, ordered visible list (room lights + room switches − hidden + extras).
  const visible = useMemo(
    () => resolveAreaEntities(entities, { popup_hidden_entities: hidden, popup_extra_entities: extra }, allEntitiesMap),
    [entities, hidden, extra, allEntitiesMap],
  );

  // Room light/switch candidates for the editor (auto-visible set, main-only).
  const roomControls = useMemo(
    () => entities.filter(
      (e) => (e.entity_id.startsWith("light.") || e.entity_id.startsWith("switch.")) && isMainControl(e),
    ),
    [entities],
  );

  // All instance light/switch entities (for the "add foreign entity" search).
  const allLights = useEntitiesByDomain("light");
  const allSwitches = useEntitiesByDomain("switch");
  const allCandidates = useMemo(
    () => [...allLights, ...allSwitches].filter(isMainControl),
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

  const handleCardAction = useCallback((popupId: string, actionProps?: Record<string, unknown>) => {
    onOpenPopup?.(popupId, actionProps);
  }, [onOpenPopup]);

  return (
    <PopupModal open title={area?.name || areaId} icon="building" onClose={onClose}>
      {/* Temperature/Humidity header */}
      {(tempSensor || humiditySensor) && (
        <div style={{ display: "flex", gap: 12, padding: "0 4px 16px 4px" }}>
          {tempSensor && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="temperature" style={{ width: 16, height: 16, color: "var(--dh-green)" }} />
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--dh-gray100)" }}>{tempSensor.state}°</span>
            </div>
          )}
          {humiditySensor && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="blur" style={{ width: 16, height: 16, color: "var(--dh-blue)" }} />
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--dh-gray100)" }}>{humiditySensor.state}%</span>
            </div>
          )}
        </div>
      )}

      {/* Lights & switches (mixed, curated) */}
      {hasControls && (
        <div style={{ marginBottom: 16 }}>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
        </div>
      )}

      {/* Climate */}
      {climates.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.4, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, padding: "0 4px", color: "var(--dh-gray100)" }}>
            Klima
          </div>
          {climates.map((climate) => {
            const currentTemp = climate.attributes?.current_temperature as number | undefined;
            const targetTemp = climate.attributes?.temperature as number | undefined;
            const hvacMode = climate.state;
            return (
              <div
                key={climate.entity_id}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", background: "var(--dh-gray300)",
                  borderRadius: "var(--dh-card-radius)", marginBottom: 6,
                }}
              >
                <Icon name="temperature" style={{ width: 20, height: 20, color: "var(--dh-green)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--dh-gray100)" }}>
                    {(climate.attributes?.friendly_name as string) || climate.entity_id}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)" }}>
                    {hvacMode} · {currentTemp !== undefined ? `${currentTemp}°` : "--"} → {targetTemp !== undefined ? `${targetTemp}°` : "--"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Media Players */}
      {mediaPlayers.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.4, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, padding: "0 4px", color: "var(--dh-gray100)" }}>
            Medien
          </div>
          {mediaPlayers.map((mp) => {
            const title = (mp.attributes?.media_title as string) || "";
            const artist = (mp.attributes?.media_artist as string) || "";
            const isPlaying = mp.state === "playing";
            return (
              <div
                key={mp.entity_id}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", background: "var(--dh-gray300)",
                  borderRadius: "var(--dh-card-radius)", marginBottom: 6,
                }}
              >
                <Icon name={isPlaying ? "media-pause" : "media-play"} style={{ width: 20, height: 20, color: "var(--dh-blue)", cursor: "pointer" }}
                  onClick={() => callService("media_player", isPlaying ? "media_pause" : "media_play", {}, { entity_id: mp.entity_id })}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--dh-gray100)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {title || (mp.attributes?.friendly_name as string) || mp.entity_id}
                  </div>
                  {artist && <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)" }}>{artist}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PopupModal>
  );
}
