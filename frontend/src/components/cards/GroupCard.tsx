import { Title } from "@ui5/webcomponents-react";
import { getCardComponent } from "./CardRegistry";
import type { CardComponentProps } from "./CardRegistry";
import type { CardItem } from "@/types";

export function GroupCard({ card, callService }: CardComponentProps) {
  const title = (card.config?.title as string) || "Group";
  const children = (card.config?.cards as CardItem[]) || [];

  return (
    <div style={{ gridColumn: card.size === "2x1" || card.size === "2x2" ? "span 2" : undefined }}>
      <Title level="H5" style={{ marginBottom: "0.5rem" }}>{title}</Title>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
        {children.map((child) => {
          const CardComp = getCardComponent(child.type);
          if (!CardComp) return <div key={child.id}>Unknown: {child.type}</div>;
          return <CardComp key={child.id} card={child} callService={callService} />;
        })}
      </div>
    </div>
  );
}
