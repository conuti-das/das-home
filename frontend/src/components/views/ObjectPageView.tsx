import { getCardComponent } from "@/components/cards";
import type { ViewConfig } from "@/types";

interface ObjectPageViewProps {
  view: ViewConfig;
  callService: (domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>) => void;
}

const SMALL_CARD_TYPES = new Set(["switch", "input_boolean", "button", "automation", "lock", "script", "scene", "binary_sensor", "update", "number", "select", "person"]);

export function ObjectPageView({ view, callService }: ObjectPageViewProps) {
  return (
    <div style={{ padding: "0 12px 80px 12px", overflow: "auto", flex: 1 }}>
      <div style={{ padding: "20px 8px 8px 8px" }}>
        <h2 style={{
          fontSize: 24,
          fontWeight: 700,
          color: "var(--dh-gray100)",
          margin: 0,
        }}>
          {view.name}
        </h2>
      </div>
      {view.sections.map((section) => {
        const allSmall = section.items.every((c) => SMALL_CARD_TYPES.has(c.type));
        return (
          <div key={section.id} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase" as const,
              letterSpacing: 0.5,
              color: "var(--dh-gray100)",
              opacity: 0.4,
              padding: "8px 8px 4px 8px",
            }}>
              {section.title}
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: allSmall ? "1fr" : "repeat(2, 1fr)",
              gap: "var(--dh-grid-gap)",
            }}>
              {section.items.map((card) => {
                const CardComp = getCardComponent(card.type);
                if (!CardComp) return null;
                return <CardComp key={card.id} card={card} callService={callService} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
