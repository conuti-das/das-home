import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function AutomationCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const isOn = entity?.state === "on";

  const toggle = () => {
    callService("automation", "toggle", {}, { entity_id: card.entity });
  };

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={isOn ? "On" : "Off"}
      icon="process"
      isOn={isOn}
      onClick={toggle}
      variant="small"
      cardType="automation"
    />
  );
}
