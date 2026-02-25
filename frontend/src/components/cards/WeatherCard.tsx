import { Text } from "@ui5/webcomponents-react";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function WeatherCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const temp = entity?.attributes?.temperature as number | undefined;
  const humidity = entity?.attributes?.humidity as number | undefined;
  const condition = entity?.state || "—";
  const unit = (entity?.attributes?.temperature_unit as string) || "°C";

  return (
    <BaseCard title={name} status={condition} cardType="weather" size={card.size}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" }}>
        <Text style={{ fontSize: "2rem", fontWeight: "bold" }}>
          {temp !== undefined ? `${temp}${unit}` : "—"}
        </Text>
        <Text style={{ color: "var(--sapContent_LabelColor)" }}>
          {condition}
        </Text>
        {humidity !== undefined && (
          <Text style={{ fontSize: "0.85rem", color: "var(--sapContent_LabelColor)" }}>
            Humidity: {humidity}%
          </Text>
        )}
      </div>
    </BaseCard>
  );
}
