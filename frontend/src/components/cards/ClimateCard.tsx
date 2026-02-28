import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function ClimateCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const currentTemp = entity?.attributes?.current_temperature as number | undefined;
  const hvacMode = entity?.state || "off";
  const isActive = hvacMode !== "off" && hvacMode !== "unavailable";

  const toggle = () => {
    callService("climate", "set_hvac_mode",
      { hvac_mode: isActive ? "off" : "heat" },
      { entity_id: card.entity }
    );
  };

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={currentTemp != null ? `${currentTemp}` : hvacMode}
      symbol={currentTemp != null ? "\u00B0" : undefined}
      icon="temperature"
      isOn={isActive}
      onClick={toggle}
      cardType="climate"
    />
  );
}
