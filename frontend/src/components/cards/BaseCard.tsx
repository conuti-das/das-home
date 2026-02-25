import type { ReactNode } from "react";
import { Card, CardHeader } from "@ui5/webcomponents-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { CardErrorBoundary } from "./CardErrorBoundary";

interface BaseCardProps {
  title: string;
  subtitle?: string;
  status?: string;
  cardType: string;
  size?: string;
  children: ReactNode;
}

export function BaseCard({ title, subtitle, status, cardType, size = "1x1", children }: BaseCardProps) {
  const editMode = useDashboardStore((s) => s.editMode);

  const style: React.CSSProperties = {};
  if (size === "2x1") {
    style.gridColumn = "span 2";
  } else if (size === "1x2") {
    style.gridRow = "span 2";
  } else if (size === "2x2") {
    style.gridColumn = "span 2";
    style.gridRow = "span 2";
  }

  return (
    <CardErrorBoundary cardType={cardType}>
      <div style={{ position: "relative", ...style }}>
        <Card
          header={
            <CardHeader
              titleText={title}
              subtitleText={subtitle}
              additionalText={status}
            />
          }
          style={{ height: "100%" }}
        >
          <div style={{ padding: "0.5rem 1rem" }}>
            {children}
          </div>
        </Card>
        {editMode && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.1)",
              border: "2px dashed var(--sapContent_ForegroundColor)",
              borderRadius: "var(--sapElement_BorderCornerRadius)",
              cursor: "move",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <span style={{ color: "var(--sapContent_LabelColor)", fontSize: "0.75rem" }}>
              {cardType}
            </span>
          </div>
        )}
      </div>
    </CardErrorBoundary>
  );
}
