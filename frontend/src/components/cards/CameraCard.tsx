import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function CameraCard({ card }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const entityPicture = entity?.attributes?.entity_picture as string | undefined;

  return (
    <BaseCard title={name} status={entity?.state || "idle"} cardType="camera" size={card.size}>
      <div style={{ display: "flex", justifyContent: "center", padding: "0.25rem 0" }}>
        {entityPicture ? (
          <img
            src={entityPicture}
            alt={name}
            style={{ maxWidth: "100%", borderRadius: "var(--sapElement_BorderCornerRadius)" }}
          />
        ) : (
          <div style={{ padding: "2rem", color: "var(--sapContent_LabelColor)" }}>
            No preview available
          </div>
        )}
      </div>
    </BaseCard>
  );
}
