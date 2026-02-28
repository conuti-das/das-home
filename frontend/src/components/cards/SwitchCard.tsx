import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function SwitchCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const isOn = entity?.state === "on";
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const domain = card.entity.split(".")[0];

  const toggle = () => {
    callService(domain, "toggle", {}, { entity_id: card.entity });
  };

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={isOn ? "On" : "Off"}
      icon="switch-classes"
      isOn={isOn}
      onClick={toggle}
      variant="small"
      cardType="switch"
    />
  );
}
