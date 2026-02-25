import { Button } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/action.js";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function ButtonCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const domain = card.entity.split(".")[0];

  return (
    <BaseCard title={name} cardType="button" size={card.size}>
      <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}>
        <Button icon="action" design="Emphasized" onClick={() => callService(domain, "press", {}, { entity_id: card.entity })}>
          Press
        </Button>
      </div>
    </BaseCard>
  );
}
