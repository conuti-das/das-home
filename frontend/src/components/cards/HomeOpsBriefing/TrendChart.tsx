import { LineChart } from "@tremor/react";
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

  const chartData = trend.map((p) => {
    const row: Record<string, string | number | null> = {
      label: shortDate(p.date),
      Aktuell: p.value,
    };
    if (hasYoY) {
      row["Vorjahr"] = p.yoy_value;
    }
    return row;
  });

  const categories = hasYoY ? ["Aktuell", "Vorjahr"] : ["Aktuell"];
  const colors = hasYoY ? ["blue", "gray"] : ["blue"];

  return (
    <div className="hob-trend-chart" data-testid="hob-trend-chart" data-yoy={hasYoY ? "true" : "false"}>
      <LineChart
        data={chartData}
        index="label"
        categories={categories}
        colors={colors}
        showLegend={hasYoY}
        showAnimation={false}
        className="hob-line-chart"
        valueFormatter={(v: number) => v.toFixed(2)}
      />
    </div>
  );
}
