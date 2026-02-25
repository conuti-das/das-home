import { Button, Text, ObjectStatus } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/download.js";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function UpdateCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const isOn = entity?.state === "on"; // update available
  const currentVersion = (entity?.attributes?.installed_version as string) || "";
  const latestVersion = (entity?.attributes?.latest_version as string) || "";

  return (
    <BaseCard title={name} status={isOn ? "Update available" : "Up to date"} cardType="update" size={card.size}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.5rem 0" }}>
        <Text>Current: {currentVersion || "—"}</Text>
        {isOn && <Text>Latest: {latestVersion}</Text>}
        <ObjectStatus state={isOn ? "Critical" : "Positive"} showDefaultIcon>
          {isOn ? "Update available" : "Up to date"}
        </ObjectStatus>
        {isOn && (
          <Button icon="download" onClick={() => callService("update", "install", {}, { entity_id: card.entity })}>
            Install
          </Button>
        )}
      </div>
    </BaseCard>
  );
}
