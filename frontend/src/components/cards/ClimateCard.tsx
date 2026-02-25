import { StepInput, SegmentedButton, SegmentedButtonItem, Text } from "@ui5/webcomponents-react";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

const HVAC_MODES = ["heat", "cool", "auto", "off"] as const;

export function ClimateCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const currentTemp = entity?.attributes?.current_temperature as number | undefined;
  const targetTemp = entity?.attributes?.temperature as number | undefined;
  const hvacMode = entity?.state || "off";
  const unit = (entity?.attributes?.temperature_unit as string) || "°C";
  const minTemp = (entity?.attributes?.min_temp as number) || 5;
  const maxTemp = (entity?.attributes?.max_temp as number) || 35;
  const step = (entity?.attributes?.target_temp_step as number) || 0.5;
  const availableModes = (entity?.attributes?.hvac_modes as string[]) || HVAC_MODES;

  const setTemp = (temp: number) => {
    callService("climate", "set_temperature", { temperature: temp }, { entity_id: card.entity });
  };

  const setMode = (mode: string) => {
    callService("climate", "set_hvac_mode", { hvac_mode: mode }, { entity_id: card.entity });
  };

  return (
    <BaseCard title={name} status={hvacMode} cardType="climate" size={card.size}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem 0" }}>
        {currentTemp !== undefined && (
          <div style={{ textAlign: "center" }}>
            <Text style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              {currentTemp}{unit}
            </Text>
            <div style={{ color: "var(--sapContent_LabelColor)", fontSize: "0.75rem" }}>Current</div>
          </div>
        )}
        {targetTemp !== undefined && hvacMode !== "off" && (
          <div>
            <span style={{ color: "var(--sapContent_LabelColor)", fontSize: "0.75rem" }}>Target</span>
            <StepInput
              value={targetTemp}
              min={minTemp}
              max={maxTemp}
              step={step}
              onChange={(e) => {
                const val = (e.target as unknown as { value: number }).value;
                setTemp(val);
              }}
              style={{ width: "100%" }}
            />
          </div>
        )}
        <SegmentedButton
          onSelectionChange={(e) => {
            const items = e.detail?.selectedItems;
            if (items?.length) {
              const mode = items[0].dataset.mode;
              if (mode) setMode(mode);
            }
          }}
        >
          {availableModes.filter((m) => HVAC_MODES.includes(m as typeof HVAC_MODES[number])).map((mode) => (
            <SegmentedButtonItem
              key={mode}
              data-mode={mode}
              selected={mode === hvacMode}
            >
              {mode}
            </SegmentedButtonItem>
          ))}
        </SegmentedButton>
      </div>
    </BaseCard>
  );
}
