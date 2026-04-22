import { useState } from "react";
import type { InsightsAnomaly } from "@/services/api";

interface AnomalyListProps {
  anomalies: InsightsAnomaly[];
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "#9ca3af",
  medium: "#f59e0b",
  high: "#ef4444",
};

const SEVERITY_LABELS_DE: Record<string, string> = {
  low: "gering",
  medium: "mittel",
  high: "hoch",
};

const INITIAL_LIMIT = 10;

export function AnomalyList({ anomalies }: AnomalyListProps) {
  const [expanded, setExpanded] = useState(false);

  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="hob-anomaly-empty" data-testid="hob-anomaly-empty">
        <span className="hob-anomaly-empty__icon">&#x2713;</span>
        <span>Alles normal</span>
      </div>
    );
  }

  const visible = expanded ? anomalies : anomalies.slice(0, INITIAL_LIMIT);
  const hiddenCount = anomalies.length - INITIAL_LIMIT;

  return (
    <ul className="hob-anomaly-list" data-testid="hob-anomaly-list">
      {visible.map((a) => (
        <li
          key={a.entity_id + a.detected_at}
          className="hob-anomaly-item"
          data-testid="hob-anomaly-item"
          data-severity={a.severity}
        >
          <span
            className="hob-anomaly-dot"
            style={{ backgroundColor: SEVERITY_COLORS[a.severity] || SEVERITY_COLORS.low }}
            aria-label={`Schweregrad: ${SEVERITY_LABELS_DE[a.severity] || a.severity}`}
          />
          <div className="hob-anomaly-body">
            <div className="hob-anomaly-name">{a.friendly_name}</div>
            <div className="hob-anomaly-desc">{a.description}</div>
          </div>
        </li>
      ))}
      {!expanded && hiddenCount > 0 && (
        <li className="hob-anomaly-more">
          <button
            type="button"
            className="hob-anomaly-more__btn"
            onClick={() => setExpanded(true)}
            data-testid="hob-anomaly-more"
          >
            {hiddenCount} weitere anzeigen
          </button>
        </li>
      )}
    </ul>
  );
}
