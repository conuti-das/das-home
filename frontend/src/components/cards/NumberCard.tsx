import { Slider, Text } from "@ui5/webcomponents-react";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function NumberCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const value = Number(entity?.state) || 0;
  const min = (entity?.attributes?.min as number) || 0;
  const max = (entity?.attributes?.max as number) || 100;
  const step = (entity?.attributes?.step as number) || 1;
  const unit = (entity?.attributes?.unit_of_measurement as string) || "";

  return (
    <BaseCard title={name} status={`${value}${unit}`} cardType="number" size={card.size}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.5rem 0" }}>
        <Text style={{ textAlign: "center", fontSize: "1.25rem" }}>{value}{unit}</Text>
        <Slider
          value={value}
          min={min}
          max={max}
          step={step}
          showTooltip
          onInput={(e) => {
            const val = (e.target as unknown as { value: number }).value;
            callService("number", "set_value", { value: val }, { entity_id: card.entity });
          }}
        />
      </div>
    </BaseCard>
  );
}
