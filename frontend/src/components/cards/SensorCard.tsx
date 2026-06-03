import { PillCard } from "./PillCard";
import { Sparkline } from "./Sparkline";
import { useEntity } from "@/hooks/useEntity";
import { useSensorHistory } from "@/hooks/useSensorHistory";
import { formatStateValue, entityFriendlyName, numericState } from "@/utils/formatEntityState";
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
  const name = entityFriendlyName(card.entity, entity);
  const { value, unit, available } = formatStateValue(entity);
  const deviceClass = (entity?.attributes?.device_class as string) || "";
  const icon = DEVICE_CLASS_ICONS[deviceClass] || "measurement-document";

  // Sparkline only for numeric, available sensors. History is lazy + cached;
  // passing undefined when non-numeric skips the fetch entirely.
  const isNumeric = available && numericState(entity) !== undefined;
  const history = useSensorHistory(isNumeric ? card.entity : undefined, 24);
  const series = history.map((p) => p.v);

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={value}
      symbol={unit}
      icon={icon}
      cardType="sensor"
      muted={!available}
    >
      {series.length >= 2 && <Sparkline points={series} />}
    </PillCard>
  );
}
