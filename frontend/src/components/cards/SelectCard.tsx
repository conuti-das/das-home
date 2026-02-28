import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function SelectCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const value = entity?.state || "\u2014";

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={value}
      icon="dropdown"
      variant="small"
      cardType="select"
    />
  );
}
