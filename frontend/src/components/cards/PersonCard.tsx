import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function PersonCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const state = entity?.state || "unknown";
  const isHome = state === "home";

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={isHome ? "Home" : state}
      icon="person-placeholder"
      isOn={isHome}
      variant="small"
      cardType="person"
    />
  );
}
