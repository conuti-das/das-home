import { Switch, Button } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/play.js";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function AutomationCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const isOn = entity?.state === "on";

  return (
    <BaseCard title={name} status={isOn ? "Enabled" : "Disabled"} cardType="automation" size={card.size}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0" }}>
        <Switch checked={isOn} onChange={() => callService("automation", "toggle", {}, { entity_id: card.entity })} />
        <Button icon="play" design="Transparent" onClick={() => callService("automation", "trigger", {}, { entity_id: card.entity })}>
          Trigger
        </Button>
      </div>
    </BaseCard>
  );
}
