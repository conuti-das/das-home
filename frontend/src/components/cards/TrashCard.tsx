import { Icon } from "@ui5/webcomponents-react";
import { useEntity } from "@/hooks/useEntity";
import { CardErrorBoundary } from "./CardErrorBoundary";
import type { CardComponentProps } from "./CardRegistry";
import "./TrashCard.css";

const WASTE_ICONS: Record<string, string> = {
  restmuell: "delete", restmüll: "delete", residual: "delete",
  gelber: "product", plastic: "product", packaging: "product",
  papier: "documents", paper: "documents",
  bio: "nutrition-activity", organic: "nutrition-activity",
  glas: "lab", glass: "lab",
};

function getWasteIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(WASTE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "delete";
}

export function TrashCard({ card, onCardAction }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const raw = entity?.state || "";
  const [daysStr, wasteType] = raw.split(",");
  const days = parseInt(daysStr) || 0;
  const wasteName = wasteType?.trim() || "Müllabfuhr";
  const wasteIcon = getWasteIcon(wasteName);

  const urgencyColor = days <= 1 ? "var(--dh-red)" : days <= 3 ? "var(--dh-yellow)" : "var(--dh-green)";

  return (
    <CardErrorBoundary cardType="trash">
      <div className="trash-card" onClick={() => onCardAction?.("trash")}>
        <div className="trash-card__icon" style={{ background: `${urgencyColor}20` }}>
          <Icon name={wasteIcon} style={{ width: 24, height: 24, color: urgencyColor }} />
        </div>
        <div className="trash-card__info">
          <div className="trash-card__days" style={{ color: urgencyColor }}>{daysStr || "--"}</div>
          <div className="trash-card__waste">{wasteName}</div>
        </div>
      </div>
    </CardErrorBoundary>
  );
}
