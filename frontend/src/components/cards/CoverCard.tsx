import { Button, Slider } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/open-command-field.js";
import "@ui5/webcomponents-icons/dist/close-command-field.js";
import "@ui5/webcomponents-icons/dist/stop.js";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function CoverCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const position = (entity?.attributes?.current_position as number) ?? 0;

  return (
    <BaseCard title={name} status={`${position}%`} cardType="cover" size={card.size}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0.5rem 0" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
          <Button icon="open-command-field" design="Transparent" onClick={() => callService("cover", "open_cover", {}, { entity_id: card.entity })} />
          <Button icon="stop" design="Transparent" onClick={() => callService("cover", "stop_cover", {}, { entity_id: card.entity })} />
          <Button icon="close-command-field" design="Transparent" onClick={() => callService("cover", "close_cover", {}, { entity_id: card.entity })} />
        </div>
        <Slider
          value={position}
          min={0}
          max={100}
          showTooltip
          onInput={(e) => {
            const val = (e.target as unknown as { value: number }).value;
            callService("cover", "set_cover_position", { position: val }, { entity_id: card.entity });
          }}
        />
      </div>
    </BaseCard>
  );
}
