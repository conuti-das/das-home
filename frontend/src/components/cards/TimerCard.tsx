import { Button, Text } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/play.js";
import "@ui5/webcomponents-icons/dist/stop.js";
import "@ui5/webcomponents-icons/dist/media-pause.js";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function TimerCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const state = entity?.state || "idle";
  const remaining = (entity?.attributes?.remaining as string) || "";
  const duration = (entity?.attributes?.duration as string) || "";

  return (
    <BaseCard title={name} status={state} cardType="timer" size={card.size}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem 0", alignItems: "center" }}>
        <Text style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
          {state === "active" ? remaining : duration || "—"}
        </Text>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {state === "idle" && (
            <Button icon="play" design="Emphasized" onClick={() => callService("timer", "start", {}, { entity_id: card.entity })}>Start</Button>
          )}
          {state === "active" && (
            <>
              <Button icon="media-pause" design="Transparent" onClick={() => callService("timer", "pause", {}, { entity_id: card.entity })} />
              <Button icon="stop" design="Transparent" onClick={() => callService("timer", "cancel", {}, { entity_id: card.entity })} />
            </>
          )}
          {state === "paused" && (
            <>
              <Button icon="play" design="Emphasized" onClick={() => callService("timer", "start", {}, { entity_id: card.entity })}>Resume</Button>
              <Button icon="stop" design="Transparent" onClick={() => callService("timer", "cancel", {}, { entity_id: card.entity })} />
            </>
          )}
        </div>
      </div>
    </BaseCard>
  );
}
