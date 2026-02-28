import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function ButtonCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;

  const press = () => {
    callService("button", "press", {}, { entity_id: card.entity });
  };

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value="Press"
      icon="action"
      onClick={press}
      variant="small"
      cardType="button"
    />
  );
}
