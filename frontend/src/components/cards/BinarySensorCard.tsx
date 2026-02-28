import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function BinarySensorCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const isOn = entity?.state === "on";
  const deviceClass = (entity?.attributes?.device_class as string) || "";
  const icon = deviceClass === "motion" ? "person-placeholder"
    : deviceClass === "door" ? "windows-doors"
    : deviceClass === "window" ? "open-command-field"
    : "status-positive";

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={isOn ? "Detected" : "Clear"}
      icon={icon}
      isOn={isOn}
      variant="small"
      cardType="binary_sensor"
    />
  );
}
