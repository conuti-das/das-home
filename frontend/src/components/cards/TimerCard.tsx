import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function TimerCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const state = entity?.state || "idle";
  const remaining = (entity?.attributes?.remaining as string) || "";
  const isActive = state === "active";

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={isActive ? remaining : state}
      icon="fob-watch"
      isOn={isActive}
      cardType="timer"
    />
  );
}
