import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function CalendarCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const message = (entity?.attributes?.message as string) || entity?.state || "\u2014";

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={message}
      icon="calendar"
      cardType="calendar"
    />
  );
}
