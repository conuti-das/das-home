import { Button, ObjectStatus } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/play.js";
import "@ui5/webcomponents-icons/dist/stop.js";
import "@ui5/webcomponents-icons/dist/undo.js";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function VacuumCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const state = entity?.state || "idle";
  const battery = entity?.attributes?.battery_level as number | undefined;

  return (
    <BaseCard title={name} status={battery !== undefined ? `${battery}%` : state} cardType="vacuum" size={card.size}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem 0", alignItems: "center" }}>
        <ObjectStatus state={state === "cleaning" ? "Information" : state === "error" ? "Negative" : "None"}>
          {state}
        </ObjectStatus>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button icon="play" design="Emphasized" onClick={() => callService("vacuum", "start", {}, { entity_id: card.entity })}>Start</Button>
          <Button icon="stop" design="Transparent" onClick={() => callService("vacuum", "stop", {}, { entity_id: card.entity })} />
          <Button icon="undo" design="Transparent" onClick={() => callService("vacuum", "return_to_base", {}, { entity_id: card.entity })} />
        </div>
      </div>
    </BaseCard>
  );
}
