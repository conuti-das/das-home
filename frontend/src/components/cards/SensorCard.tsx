import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

const DEVICE_CLASS_ICONS: Record<string, string> = {
  temperature: "temperature",
  humidity: "blur",
  battery: "status-positive",
  power: "energy-saving-lightbulb",
  energy: "energy-saving-lightbulb",
  pressure: "measure",
  illuminance: "lightbulb",
  motion: "person-placeholder",
  gas: "weather-proofing",
  co2: "cloud",
};

export function SensorCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const unit = (entity?.attributes?.unit_of_measurement as string) || "";
  const value = entity?.state || "\u2014";
  const deviceClass = (entity?.attributes?.device_class as string) || "";
  const icon = DEVICE_CLASS_ICONS[deviceClass] || "measurement-document";

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={value}
      symbol={unit}
      icon={icon}
      cardType="sensor"
    />
  );
}
