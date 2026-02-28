import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function HumidifierCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const isOn = entity?.state === "on";
  const humidity = entity?.attributes?.humidity as number | undefined;

  const toggle = () => {
    callService("humidifier", "toggle", {}, { entity_id: card.entity });
  };

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={humidity !== undefined ? `${humidity}` : isOn ? "On" : "Off"}
      symbol={humidity !== undefined ? "%" : undefined}
      icon="blur"
      isOn={isOn}
      onClick={toggle}
      cardType="humidifier"
    />
  );
}
