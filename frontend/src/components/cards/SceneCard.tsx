import { Button } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/play.js";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function SceneCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;

  const activate = () => {
    callService("scene", "turn_on", {}, { entity_id: card.entity });
  };

  return (
    <BaseCard title={name} cardType="scene" size={card.size}>
      <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}>
        <Button icon="play" design="Emphasized" onClick={activate}>
          Activate
        </Button>
      </div>
    </BaseCard>
  );
}
