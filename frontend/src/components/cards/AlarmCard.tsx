import { Input, SegmentedButton, SegmentedButtonItem } from "@ui5/webcomponents-react";
import { useState } from "react";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

const ALARM_STATES = ["armed_home", "armed_away", "armed_night", "disarmed"] as const;

export function AlarmCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const state = entity?.state || "disarmed";
  const codeRequired = entity?.attributes?.code_arm_required as boolean;
  const [code, setCode] = useState("");

  const setAlarmState = (newState: string) => {
    const service = newState === "disarmed" ? "alarm_disarm" : `alarm_arm_${newState.replace("armed_", "")}`;
    const data = codeRequired ? { code } : {};
    callService("alarm_control_panel", service, data, { entity_id: card.entity });
  };

  return (
    <BaseCard title={name} status={state} cardType="alarm" size={card.size}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem 0" }}>
        <SegmentedButton
          onSelectionChange={(e) => {
            const items = e.detail?.selectedItems;
            if (items?.length) {
              const mode = items[0].dataset.mode;
              if (mode) setAlarmState(mode);
            }
          }}
        >
          {ALARM_STATES.map((s) => (
            <SegmentedButtonItem key={s} data-mode={s} selected={s === state}>
              {s.replace("armed_", "").replace("disarmed", "off")}
            </SegmentedButtonItem>
          ))}
        </SegmentedButton>
        {codeRequired && (
          <Input
            type="Password"
            value={code}
            onInput={(e) => setCode((e.target as unknown as { value: string }).value)}
            placeholder="Code"
            style={{ width: "100%" }}
          />
        )}
      </div>
    </BaseCard>
  );
}
