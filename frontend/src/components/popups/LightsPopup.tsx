import { useCallback } from "react";
import { useEntitiesByDomain } from "@/hooks/useEntity";
import { PopupModal } from "@/components/layout/PopupModal";
import { LightSliderCard } from "@/components/cards/LightSliderCard";
import type { PopupProps } from "./PopupRegistry";

/** Filter out sub-entities like WLED segments, channels, etc. */
function isMainLight(entity: { entity_id: string; attributes: Record<string, unknown> }): boolean {
  const id = entity.entity_id;
  const name = ((entity.attributes?.friendly_name as string) || "").toLowerCase();
  // Filter out WLED segments, channels, and other sub-entities
  if (id.includes("_segment_") || id.includes("_channel_")) return false;
  if (/segment\s*\d/i.test(name)) return false;
  // HA marks sub-entities with entity_category
  if (entity.attributes?.entity_category === "config" || entity.attributes?.entity_category === "diagnostic") return false;
  return true;
}

export function LightsPopup({ onClose, callService, onOpenPopup }: PopupProps) {
  const allLights = useEntitiesByDomain("light");
  const lights = allLights.filter(isMainLight);
  const onLights = lights.filter((e) => e.state === "on");
  const offLights = lights.filter((e) => e.state !== "on");

  const handleCardAction = useCallback((popupId: string, actionProps?: Record<string, unknown>) => {
    onOpenPopup?.(popupId, actionProps);
  }, [onOpenPopup]);

  return (
    <PopupModal open title={`Lichter (${onLights.length} an)`} icon="lightbulb" onClose={onClose}>
      {/* Lights ON */}
      {onLights.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.4, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, padding: "0 4px", color: "var(--dh-gray100)" }}>
            Eingeschaltet
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {onLights.map((light) => (
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

      {/* Lights OFF */}
      {offLights.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.4, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, padding: "0 4px", color: "var(--dh-gray100)" }}>
            Ausgeschaltet
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {offLights.map((light) => (
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
    </PopupModal>
  );
}
