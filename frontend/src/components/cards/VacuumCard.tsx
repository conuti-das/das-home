import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function VacuumCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const state = entity?.state || "docked";
  const battery = entity?.attributes?.battery_level as number | undefined;
  const isCleaning = state === "cleaning";

  const toggle = () => {
    callService("vacuum", isCleaning ? "stop" : "start", {}, { entity_id: card.entity });
  };

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={state}
      icon="inventory"
      isOn={isCleaning}
      barValue={battery}
      onClick={toggle}
      cardType="vacuum"
    />
  );
}
