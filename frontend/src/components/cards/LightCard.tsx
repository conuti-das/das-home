import { Switch, Slider } from "@ui5/webcomponents-react";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function LightCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const isOn = entity?.state === "on";
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const brightness = entity?.attributes?.brightness as number | undefined;
  const brightnessPct = brightness !== undefined ? Math.round((brightness / 255) * 100) : 0;
  const supportsbrightness = (entity?.attributes?.supported_color_modes as string[] || []).some(
    (m) => m !== "onoff"
  );

  const toggle = () => {
    callService("light", isOn ? "turn_off" : "turn_on", {}, { entity_id: card.entity });
  };

  const setBrightness = (pct: number) => {
    callService("light", "turn_on", { brightness_pct: pct }, { entity_id: card.entity });
  };

  return (
    <BaseCard title={name} status={isOn ? `${brightnessPct}%` : "Off"} cardType="light" size={card.size}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "var(--sapContent_LabelColor)" }}>Power</span>
          <Switch checked={isOn} onChange={toggle} />
        </div>
        {supportsbrightness && isOn && (
          <div>
            <span style={{ color: "var(--sapContent_LabelColor)", fontSize: "0.75rem" }}>Brightness</span>
            <Slider
              value={brightnessPct}
              min={1}
              max={100}
              showTooltip
              onInput={(e) => {
                const val = (e.target as unknown as { value: number }).value;
                setBrightness(Number(val));
              }}
            />
          </div>
        )}
      </div>
    </BaseCard>
  );
}
