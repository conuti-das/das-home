import { Title } from "@ui5/webcomponents-react";
import { getCardComponent } from "@/components/cards";
import type { ViewConfig } from "@/types";

interface GridViewProps {
  view: ViewConfig;
  callService: (domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>) => void;
}

export function GridView({ view, callService }: GridViewProps) {
  const minColWidth = (view.layout?.min_column_width as number) || 280;

  return (
    <div style={{ padding: "1rem", overflow: "auto", flex: 1 }}>
      {view.sections.map((section) => (
        <div key={section.id} style={{ marginBottom: "1.5rem" }}>
          <Title level="H4" style={{ marginBottom: "0.75rem" }}>{section.title}</Title>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fill, minmax(${minColWidth}px, 1fr))`,
              gap: "1rem",
            }}
          >
            {section.items.map((card) => {
              const CardComp = getCardComponent(card.type);
              if (!CardComp) {
                return (
                  <div key={card.id} style={{ padding: "1rem", border: "1px dashed var(--sapContent_ForegroundBorderColor)", borderRadius: "var(--sapElement_BorderCornerRadius)" }}>
                    Unknown card type: {card.type}
                  </div>
                );
              }
              return <CardComp key={card.id} card={card} callService={callService} />;
            })}
          </div>
          {section.subsections.map((sub) => (
            <div key={sub.id} style={{ marginTop: "1rem" }}>
              <Title level="H5" style={{ marginBottom: "0.5rem" }}>{sub.title}</Title>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(auto-fill, minmax(${minColWidth}px, 1fr))`,
                  gap: "1rem",
                }}
              >
                {sub.items.map((card) => {
                  const CardComp = getCardComponent(card.type);
                  if (!CardComp) {
                    return (
                      <div key={card.id} style={{ padding: "1rem", border: "1px dashed var(--sapContent_ForegroundBorderColor)" }}>
                        Unknown: {card.type}
                      </div>
                    );
                  }
                  return <CardComp key={card.id} card={card} callService={callService} />;
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
