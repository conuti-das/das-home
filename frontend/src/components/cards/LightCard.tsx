import { PillCard } from "./PillCard";
import { LightSliderCard } from "./LightSliderCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function LightCard({ card, callService, onCardAction }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const isOn = entity?.state === "on";
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const supportsBrightness = (entity?.attributes?.supported_color_modes as string[] || []).some(
    (m) => m !== "onoff"
  );

  const toggle = () => {
    callService("light", isOn ? "turn_off" : "turn_on", {}, { entity_id: card.entity });
  };

  // Use slider variant for dimmable lights
  if (supportsBrightness) {
    return <LightSliderCard card={card} callService={callService} onCardAction={onCardAction} />;
  }

  // Simple toggle for on/off only lights
  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={isOn ? "On" : "Off"}
      icon="lightbulb"
      isOn={isOn}
      onClick={toggle}
      variant="small"
      cardType="light"
    />
  );
}
