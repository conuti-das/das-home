import { ObjectPage, ObjectPageSection, ObjectPageSubSection, ObjectPageHeader, Title } from "@ui5/webcomponents-react";
import { getCardComponent } from "@/components/cards";
import type { ViewConfig } from "@/types";

interface ObjectPageViewProps {
  view: ViewConfig;
  callService: (domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>) => void;
}

export function ObjectPageView({ view, callService }: ObjectPageViewProps) {
  const minColWidth = (view.layout?.min_column_width as number) || 280;

  return (
    <ObjectPage
      headerArea={
        <ObjectPageHeader>
          <Title level="H3">{view.name}</Title>
        </ObjectPageHeader>
      }
      style={{ flex: 1 }}
    >
      {view.sections.map((section) => (
        <ObjectPageSection
          key={section.id}
          id={section.id}
          titleText={section.title}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fill, minmax(${minColWidth}px, 1fr))`,
              gap: "1rem",
              padding: "0.5rem",
            }}
          >
            {section.items.map((card) => {
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
          {section.subsections.map((sub) => (
            <ObjectPageSubSection
              key={sub.id}
              id={sub.id}
              titleText={sub.title}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(auto-fill, minmax(${minColWidth}px, 1fr))`,
                  gap: "1rem",
                  padding: "0.5rem",
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
            </ObjectPageSubSection>
          ))}
        </ObjectPageSection>
      ))}
    </ObjectPage>
  );
}
