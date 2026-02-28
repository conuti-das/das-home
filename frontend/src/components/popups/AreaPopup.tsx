import { useCallback } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useEntityStore } from "@/stores/entityStore";
import { useEntitiesByArea } from "@/hooks/useEntity";
import { PopupModal } from "@/components/layout/PopupModal";
import { LightSliderCard } from "@/components/cards/LightSliderCard";
import type { PopupProps } from "./PopupRegistry";

export function AreaPopup({ onClose, callService, onOpenPopup, props }: PopupProps) {
  const areaId = (props?.areaId as string) || "";
  const area = useEntityStore((s) => s.areas.get(areaId));
  const entities = useEntitiesByArea(areaId);

  const lights = entities.filter((e) => e.entity_id.startsWith("light."));
  const climates = entities.filter((e) => e.entity_id.startsWith("climate."));
  const mediaPlayers = entities.filter((e) => e.entity_id.startsWith("media_player."));
  const switches = entities.filter((e) => e.entity_id.startsWith("switch."));

  const tempSensor = entities.find(
    (e) => e.entity_id.startsWith("sensor.") && e.entity_id.includes("temperature")
  );
  const humiditySensor = entities.find(
    (e) => e.entity_id.startsWith("sensor.") && e.entity_id.includes("humidity")
  );

  const toggleEntity = useCallback(
    (entityId: string, currentState: string) => {
      const domain = entityId.split(".")[0];
      const service = currentState === "on" ? "turn_off" : "turn_on";
      callService(domain, service, {}, { entity_id: entityId });
    },
    [callService]
  );

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

      {/* Lights */}
      {lights.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.4, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, padding: "0 4px", color: "var(--dh-gray100)" }}>
            Lichter
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lights.map((light) => (
              <LightSliderCard
                key={light.entity_id}
                card={{ id: light.entity_id, type: "light", entity: light.entity_id, size: "1x1", config: {} }}
                callService={callService}
                onCardAction={handleCardAction}
              />
            ))}
          </div>
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

      {/* Switches/Devices */}
      {switches.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.4, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, padding: "0 4px", color: "var(--dh-gray100)" }}>
            Geräte
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {switches.map((sw) => {
              const isOn = sw.state === "on";
              return (
                <button
                  key={sw.entity_id}
                  onClick={() => toggleEntity(sw.entity_id, sw.state)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px",
                    background: isOn ? "var(--dh-yellow)" : "var(--dh-gray300)",
                    color: isOn ? "var(--dh-gray1000)" : "var(--dh-gray100)",
                    borderRadius: "var(--dh-card-radius)",
                    border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                  }}
                >
                  <Icon name="settings" style={{ width: 14, height: 14 }} />
                  {(sw.attributes?.friendly_name as string) || sw.entity_id}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </PopupModal>
  );
}
