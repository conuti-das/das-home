import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function AlarmCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const state = entity?.state || "disarmed";
  const isArmed = state.startsWith("armed");

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={state.replace("_", " ")}
      icon="alert"
      isOn={isArmed}
      cardType="alarm"
    />
  );
}
