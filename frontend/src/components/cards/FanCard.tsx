import { Switch, Slider } from "@ui5/webcomponents-react";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function FanCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const isOn = entity?.state === "on";
  const percentage = (entity?.attributes?.percentage as number) || 0;

  return (
    <BaseCard title={name} status={isOn ? `${percentage}%` : "Off"} cardType="fan" size={card.size}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "var(--sapContent_LabelColor)" }}>Power</span>
          <Switch checked={isOn} onChange={() => callService("fan", "toggle", {}, { entity_id: card.entity })} />
        </div>
        {isOn && (
          <Slider
            value={percentage}
            min={0}
            max={100}
            showTooltip
            onInput={(e) => {
              const val = (e.target as unknown as { value: number }).value;
              callService("fan", "set_percentage", { percentage: val }, { entity_id: card.entity });
            }}
          />
        )}
      </div>
    </BaseCard>
  );
}
