import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function FanCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const isOn = entity?.state === "on";
  const pct = entity?.attributes?.percentage as number | undefined;

  const toggle = () => {
    callService("fan", "toggle", {}, { entity_id: card.entity });
  };

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={isOn && pct !== undefined ? `${pct}%` : isOn ? "On" : "Off"}
      icon="weather-proofing"
      isOn={isOn}
      barValue={isOn ? pct : undefined}
      onClick={toggle}
      cardType="fan"
    />
  );
}
