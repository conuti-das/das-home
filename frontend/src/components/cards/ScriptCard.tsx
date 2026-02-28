import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function ScriptCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const isRunning = entity?.state === "on";

  const run = () => {
    callService("script", "turn_on", {}, { entity_id: card.entity });
  };

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={isRunning ? "Running" : "Run"}
      icon="process"
      isOn={isRunning}
      onClick={run}
      variant="small"
      cardType="script"
    />
  );
}
