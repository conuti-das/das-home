import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function NumberCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const value = entity?.state || "0";
  const unit = (entity?.attributes?.unit_of_measurement as string) || "";

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={value}
      symbol={unit}
      icon="number-sign"
      variant="small"
      cardType="number"
    />
  );
}
