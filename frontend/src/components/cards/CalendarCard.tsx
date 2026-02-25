import { Text } from "@ui5/webcomponents-react";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function CalendarCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const message = (entity?.attributes?.message as string) || "";
  const startTime = (entity?.attributes?.start_time as string) || "";
  const state = entity?.state || "off";

  return (
    <BaseCard title={name} status={state === "on" ? "Active" : "No events"} cardType="calendar" size={card.size}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0.5rem 0" }}>
        {message ? (
          <>
            <Text style={{ fontWeight: "bold" }}>{message}</Text>
            {startTime && <Text style={{ fontSize: "0.85rem", color: "var(--sapContent_LabelColor)" }}>{startTime}</Text>}
          </>
        ) : (
          <Text style={{ color: "var(--sapContent_LabelColor)" }}>No upcoming events</Text>
        )}
      </div>
    </BaseCard>
  );
}
