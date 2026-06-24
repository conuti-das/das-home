import type { ReactNode } from "react";
import { Card } from "prince-ui";
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

/**
 * Generische Karten-Hülle. Welle 1 (prince-ui): die frühere UI5 `Card`/`CardHeader`
 * ist durch prince-ui `Card` ersetzt. Titel/Subtitle/Status werden in den
 * Header-Slot gerendert; Größen-Spans + Edit-Overlay bleiben app-eigen.
 */
export function BaseCard({ title, subtitle, status, cardType, size = "1x1", children }: BaseCardProps) {
  const editMode = useDashboardStore((s) => s.editMode);

  const style: React.CSSProperties = { height: "100%" };
  if (size === "2x1") {
    style.gridColumn = "span 2";
  } else if (size === "1x2") {
    style.gridRow = "span 2";
  } else if (size === "2x2") {
    style.gridColumn = "span 2";
    style.gridRow = "span 2";
  }

  const subline = [subtitle, status].filter(Boolean).join(" · ");

  return (
    <CardErrorBoundary cardType={cardType}>
      <div style={{ position: "relative", ...style }}>
        <Card
          title={title}
          header={
            subline ? (
              <span style={{ color: "var(--prn-label-2)", fontSize: 13 }}>{subline}</span>
            ) : undefined
          }
          className="base-card"
        >
          {children}
        </Card>
        {editMode && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.1)",
              border: "2px dashed var(--prn-label-2)",
              borderRadius: "var(--prn-radius-card)",
              cursor: "move",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <span style={{ color: "var(--prn-label-2)", fontSize: "0.75rem" }}>
              {cardType}
            </span>
          </div>
        )}
      </div>
    </CardErrorBoundary>
  );
}
