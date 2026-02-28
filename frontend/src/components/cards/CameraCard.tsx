import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function CameraCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const state = entity?.state || "idle";

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={state}
      icon="camera"
      isOn={state === "recording"}
      cardType="camera"
    />
  );
}
