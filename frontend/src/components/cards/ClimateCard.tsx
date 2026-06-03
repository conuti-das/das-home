import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import { entityFriendlyName, isUnavailable, NO_VALUE } from "@/utils/formatEntityState";
import type { CardComponentProps } from "./CardRegistry";

export function ClimateCard({ card, onCardAction }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = entityFriendlyName(card.entity, entity);
  const rawTemp = entity?.attributes?.current_temperature;
  const currentTemp = typeof rawTemp === "number" && Number.isFinite(rawTemp) ? rawTemp : undefined;
  const hvacMode = entity?.state || "off";
  const available = !isUnavailable(entity?.state);
  const isActive = available && hvacMode !== "off";

  // Prefer the measured temperature; otherwise show the HVAC mode (off/heat/\u2026),
  // and a placeholder rather than the raw "unavailable" string when offline.
  const value = currentTemp != null ? `${currentTemp}` : available ? hvacMode : NO_VALUE;

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={value}
      symbol={currentTemp != null ? "\u00B0" : undefined}
      icon="temperature"
      isOn={isActive}
      onClick={() => onCardAction?.("climate-detail", { entityId: card.entity })}
      cardType="climate"
      muted={!available}
    />
  );
}
