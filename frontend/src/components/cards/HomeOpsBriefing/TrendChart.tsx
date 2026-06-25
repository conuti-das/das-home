import { AreaChart } from "prince-ui";
import type { InsightsTrendPoint } from "@/services/api";

interface TrendChartProps {
  trend: InsightsTrendPoint[];
}

const WEEKDAYS_DE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return WEEKDAYS_DE[d.getDay()] ?? iso;
}

export function TrendChart({ trend }: TrendChartProps) {
  if (!trend || trend.length === 0) {
    return (
      <div className="hob-trend-empty" data-testid="hob-trend-empty">
        Keine Trenddaten verfügbar
      </div>
    );
  }

  const hasYoY = trend.some((p) => p.yoy_value !== null && p.yoy_value !== undefined);

  const labels = trend.map((p) => shortDate(p.date));
  const current = trend.map((p) => p.value);
  // YoY-Vergleichsreihe: fehlende Punkte mit 0 auffüllen (Tremor-Verhalten gespiegelt).
  const previous = hasYoY
    ? trend.map((p) => (p.yoy_value === null || p.yoy_value === undefined ? 0 : p.yoy_value))
    : [];

  return (
    <div className="hob-trend-chart" data-testid="hob-trend-chart" data-yoy={hasYoY ? "true" : "false"}>
      <div className="hob-trend-chart__plot">
        {/* prince-ui AreaChart ist einreihig — die YoY-Vergleichsreihe ("Vorjahr")
            wird als zweite, gedämpfte Fläche dahinter gelegt. */}
        {hasYoY && (
          <AreaChart
            data={previous}
            color="var(--prn-label-3)"
            className="hob-area-chart hob-area-chart--prev"
          />
        )}
        <AreaChart
          data={current}
          showAxes
          color="var(--prn-blue)"
          className="hob-area-chart hob-area-chart--current"
        />
      </div>
      {hasYoY && (
        <div className="hob-trend-legend" data-testid="hob-trend-legend">
          <span className="hob-trend-legend__item">
            <span className="hob-trend-legend__dot" style={{ background: "var(--prn-blue)" }} />
            Aktuell
          </span>
          <span className="hob-trend-legend__item">
            <span className="hob-trend-legend__dot" style={{ background: "var(--prn-label-3)" }} />
            Vorjahr
          </span>
        </div>
      )}
      <div className="hob-trend-axis" aria-hidden="true">
        {labels.map((l, i) => (
          <span key={i} className="hob-trend-axis__tick">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
