import { useEntity } from "@/hooks/useEntity";
import { CardErrorBoundary } from "./CardErrorBoundary";
import type { CardComponentProps } from "./CardRegistry";
import "./TrashCard.css";

export function TrashCard({ card, onCardAction }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const raw = entity?.state || "";
  const [daysStr, wasteType] = raw.split(",");
  const days = parseInt(daysStr) || 0;
  const label = days === 0 ? "Heute" : days === 1 ? "Morgen" : `In ${days} Tagen`;

  return (
    <CardErrorBoundary cardType="trash">
      <div className="trash-card" onClick={() => onCardAction?.("trash")}>
        <div className="trash-card__days">{daysStr || "--"}</div>
        <div>
          <div className="trash-card__label">
            {label}
            <br />
            Müllabfuhr
          </div>
          {wasteType && <div className="trash-card__waste">{wasteType.trim()}</div>}
        </div>
      </div>
    </CardErrorBoundary>
  );
}
