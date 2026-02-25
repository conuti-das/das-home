import { Button } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/play.js";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function ScriptCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const isRunning = entity?.state === "on";

  return (
    <BaseCard title={name} status={isRunning ? "Running" : "Idle"} cardType="script" size={card.size}>
      <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}>
        <Button icon="play" design="Emphasized" onClick={() => callService("script", "turn_on", {}, { entity_id: card.entity })}>
          Run
        </Button>
      </div>
    </BaseCard>
  );
}
