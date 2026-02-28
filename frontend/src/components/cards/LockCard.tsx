import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function LockCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const isLocked = entity?.state === "locked";

  const toggle = () => {
    callService("lock", isLocked ? "unlock" : "lock", {}, { entity_id: card.entity });
  };

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={isLocked ? "Locked" : "Unlocked"}
      icon={isLocked ? "locked" : "unlocked"}
      isOn={!isLocked}
      onClick={toggle}
      variant="small"
      cardType="lock"
    />
  );
}
