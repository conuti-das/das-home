import { ObjectStatus, Text } from "@ui5/webcomponents-react";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function SensorCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const unit = (entity?.attributes?.unit_of_measurement as string) || "";
  const value = entity?.state || "—";
  const deviceClass = (entity?.attributes?.device_class as string) || "";

  return (
    <BaseCard title={name} subtitle={deviceClass} cardType="sensor" size={card.size}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1rem 0", gap: "0.5rem" }}>
        <Text style={{ fontSize: "2rem", fontWeight: "bold" }}>
          {value}
        </Text>
        {unit && (
          <ObjectStatus>
            {unit}
          </ObjectStatus>
        )}
      </div>
    </BaseCard>
  );
}
