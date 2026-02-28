import { getCardComponent } from "./CardRegistry";
import type { CardComponentProps } from "./CardRegistry";

export function GroupCard({ card, callService }: CardComponentProps) {
  const items = (card.config?.items as Array<{ id: string; type: string; entity: string; size: string; config: Record<string, unknown> }>) || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dh-grid-gap)" }}>
      {items.map((item) => {
        const CardComp = getCardComponent(item.type);
        if (!CardComp) return null;
        return <CardComp key={item.id} card={item} callService={callService} />;
      })}
    </div>
  );
}
