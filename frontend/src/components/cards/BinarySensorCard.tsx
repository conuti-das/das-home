import { ObjectStatus } from "@ui5/webcomponents-react";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function BinarySensorCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const isOn = entity?.state === "on";
  const deviceClass = (entity?.attributes?.device_class as string) || "";

  return (
    <BaseCard title={name} subtitle={deviceClass} status={isOn ? "Active" : "Inactive"} cardType="binary_sensor" size={card.size}>
      <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}>
        <ObjectStatus
          state={isOn ? "Critical" : "Positive"}
          showDefaultIcon
        >
          {isOn ? "On" : "Off"}
        </ObjectStatus>
      </div>
    </BaseCard>
  );
}
