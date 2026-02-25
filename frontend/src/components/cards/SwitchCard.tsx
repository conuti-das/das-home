import { Switch } from "@ui5/webcomponents-react";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function SwitchCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const isOn = entity?.state === "on";
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const domain = card.entity.split(".")[0];

  const toggle = () => {
    callService(domain, "toggle", {}, { entity_id: card.entity });
  };

  return (
    <BaseCard title={name} status={isOn ? "On" : "Off"} cardType="switch" size={card.size}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0" }}>
        <span style={{ color: "var(--sapContent_LabelColor)" }}>{card.entity}</span>
        <Switch
          checked={isOn}
          onChange={toggle}
        />
      </div>
    </BaseCard>
  );
}
