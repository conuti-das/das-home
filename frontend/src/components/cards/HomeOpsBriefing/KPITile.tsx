import { SparkAreaChart } from "@tremor/react";
import type { InsightsKPI } from "@/services/api";

interface KPITileProps {
  label: string;
  kpi: InsightsKPI;
}

function formatValue(value: number | null): string {
  if (value === null || value === undefined) return "\u2014";
  if (Math.abs(value) >= 1000) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

export function KPITile({ label, kpi }: KPITileProps) {
  if (!kpi.available) {
    return (
      <div
        className="hob-kpi-tile hob-kpi-tile--empty"
        data-testid="hob-kpi-tile"
        data-available="false"
      >
        <div className="hob-kpi-tile__label">{label}</div>
        <div className="hob-kpi-tile__empty-text">Nicht konfiguriert</div>
        <button type="button" className="hob-kpi-tile__cta">
          Konfigurieren &rarr;
        </button>
      </div>
    );
  }

  const sparkData = (kpi.trend_7d || []).map((v, i) => ({ idx: i, value: v }));
  const hasSparkData = sparkData.length > 0 && sparkData.some((p) => p.value !== 0);

  return (
    <div
      className={`hob-kpi-tile ${kpi.anomaly_flag ? "hob-kpi-tile--anomaly" : ""}`}
      data-testid="hob-kpi-tile"
      data-available="true"
      data-anomaly={kpi.anomaly_flag ? "true" : "false"}
    >
      <div className="hob-kpi-tile__header">
        <span className="hob-kpi-tile__label">{label}</span>
        {kpi.anomaly_flag && (
          <span
            className="hob-kpi-tile__anomaly-dot"
            aria-label="Anomalie erkannt"
            data-testid="hob-anomaly-indicator"
          />
        )}
      </div>
      <div className="hob-kpi-tile__value">
        <span className="hob-kpi-tile__metric">{formatValue(kpi.value)}</span>
        {kpi.unit && <span className="hob-kpi-tile__unit">{kpi.unit}</span>}
      </div>
      <div
        className="hob-kpi-tile__spark"
        data-testid="hob-kpi-spark"
      >
        {hasSparkData && (
          <SparkAreaChart
            data={sparkData}
            categories={["value"]}
            index="idx"
            colors={["blue"]}
            className="hob-sparkline"
          />
        )}
      </div>
    </div>
  );
}
