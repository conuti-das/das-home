import { Button, ObjectStatus } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/locked.js";
import "@ui5/webcomponents-icons/dist/unlocked.js";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function LockCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const isLocked = entity?.state === "locked";

  return (
    <BaseCard title={name} status={isLocked ? "Locked" : "Unlocked"} cardType="lock" size={card.size}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}>
        <ObjectStatus state={isLocked ? "Positive" : "Critical"} showDefaultIcon>
          {isLocked ? "Locked" : "Unlocked"}
        </ObjectStatus>
        <Button
          icon={isLocked ? "unlocked" : "locked"}
          design="Emphasized"
          onClick={() => callService("lock", isLocked ? "unlock" : "lock", {}, { entity_id: card.entity })}
        >
          {isLocked ? "Unlock" : "Lock"}
        </Button>
      </div>
    </BaseCard>
  );
}
