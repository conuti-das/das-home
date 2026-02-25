import { ObjectStatus } from "@ui5/webcomponents-react";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function PersonCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const state = entity?.state || "unknown";
  const isHome = state === "home";

  return (
    <BaseCard title={name} status={state} cardType="person" size={card.size}>
      <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}>
        <ObjectStatus
          state={isHome ? "Positive" : "Information"}
          showDefaultIcon
        >
          {isHome ? "Home" : state}
        </ObjectStatus>
      </div>
    </BaseCard>
  );
}
