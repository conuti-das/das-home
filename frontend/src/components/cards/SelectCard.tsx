import { Select, Option } from "@ui5/webcomponents-react";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function SelectCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const current = entity?.state || "";
  const options = (entity?.attributes?.options as string[]) || [];

  return (
    <BaseCard title={name} status={current} cardType="select" size={card.size}>
      <div style={{ padding: "0.5rem 0" }}>
        <Select
          onChange={(e) => {
            const val = e.detail.selectedOption?.dataset?.value;
            if (val) callService("select", "select_option", { option: val }, { entity_id: card.entity });
          }}
          style={{ width: "100%" }}
        >
          {options.map((opt) => (
            <Option key={opt} data-value={opt} selected={opt === current}>{opt}</Option>
          ))}
        </Select>
      </div>
    </BaseCard>
  );
}
