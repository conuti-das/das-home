import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function CoverCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const state = entity?.state || "closed";
  const position = entity?.attributes?.current_position as number | undefined;
  const isOpen = state === "open";

  const toggle = () => {
    callService("cover", isOpen ? "close_cover" : "open_cover", {}, { entity_id: card.entity });
  };

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={position !== undefined ? `${position}%` : state}
      icon="popup-window"
      isOn={isOpen}
      barValue={position}
      onClick={toggle}
      cardType="cover"
    />
  );
}
