import { Switch, Slider, Text } from "@ui5/webcomponents-react";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function HumidifierCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const isOn = entity?.state === "on";
  const humidity = (entity?.attributes?.humidity as number) || 0;
  const currentHumidity = (entity?.attributes?.current_humidity as number) || 0;

  return (
    <BaseCard title={name} status={isOn ? "On" : "Off"} cardType="humidifier" size={card.size}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem 0" }}>
        <Text style={{ textAlign: "center" }}>Current: {currentHumidity}%</Text>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "var(--sapContent_LabelColor)" }}>Power</span>
          <Switch checked={isOn} onChange={() => callService("humidifier", "toggle", {}, { entity_id: card.entity })} />
        </div>
        {isOn && (
          <div>
            <span style={{ color: "var(--sapContent_LabelColor)", fontSize: "0.75rem" }}>Target: {humidity}%</span>
            <Slider
              value={humidity}
              min={0}
              max={100}
              showTooltip
              onInput={(e) => {
                const val = (e.target as unknown as { value: number }).value;
                callService("humidifier", "set_humidity", { humidity: val }, { entity_id: card.entity });
              }}
            />
          </div>
        )}
      </div>
    </BaseCard>
  );
}
