import { PillCard } from "./PillCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function UpdateCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const hasUpdate = entity?.state === "on";
  const latestVersion = (entity?.attributes?.latest_version as string) || "";

  const install = () => {
    callService("update", "install", {}, { entity_id: card.entity });
  };

  return (
    <PillCard
      entityId={card.entity}
      label={name}
      value={hasUpdate ? latestVersion || "Available" : "Up to date"}
      icon="download"
      isOn={hasUpdate}
      onClick={hasUpdate ? install : undefined}
      variant="small"
      cardType="update"
    />
  );
}
