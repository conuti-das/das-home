import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { InsightsTrendPoint } from "@/services/api";

vi.mock("@tremor/react", () => ({
  LineChart: ({
    data,
    categories,
    showLegend,
  }: {
    data: unknown[];
    categories: string[];
    showLegend?: boolean;
  }) => (
    <div
      data-testid="mock-linechart"
      data-points={data.length}
      data-categories={categories.join(",")}
      data-show-legend={showLegend ? "true" : "false"}
    />
  ),
  SparkAreaChart: () => <div />,
}));

import { TrendChart } from "../TrendChart";

function makeTrend(withYoY: boolean): InsightsTrendPoint[] {
  const out: InsightsTrendPoint[] = [];
  for (let i = 0; i < 7; i++) {
    out.push({
      date: `2024-01-0${i + 1}`,
      value: i * 1.5,
      yoy_value: withYoY ? i * 1.2 : null,
    });
  }
  return out;
}

describe("TrendChart", () => {
  it("renders with current + YoY when yoy_value is populated", () => {
    render(<TrendChart trend={makeTrend(true)} />);
    const chart = screen.getByTestId("mock-linechart");
    expect(chart.getAttribute("data-categories")).toBe("Aktuell,Vorjahr");
    expect(chart.getAttribute("data-show-legend")).toBe("true");
    expect(chart.getAttribute("data-points")).toBe("7");
    const wrapper = screen.getByTestId("hob-trend-chart");
    expect(wrapper.getAttribute("data-yoy")).toBe("true");
  });

  it("renders in single-line mode when all yoy_value are null", () => {
    render(<TrendChart trend={makeTrend(false)} />);
    const chart = screen.getByTestId("mock-linechart");
    expect(chart.getAttribute("data-categories")).toBe("Aktuell");
    expect(chart.getAttribute("data-show-legend")).toBe("false");
    const wrapper = screen.getByTestId("hob-trend-chart");
    expect(wrapper.getAttribute("data-yoy")).toBe("false");
  });

  it("renders empty message for empty trend data", () => {
    render(<TrendChart trend={[]} />);
    expect(screen.getByTestId("hob-trend-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-linechart")).not.toBeInTheDocument();
  });

  it("doesn't crash on sparse data with some null yoy_values", () => {
    const mixed: InsightsTrendPoint[] = [
      { date: "2024-01-01", value: 1, yoy_value: null },
      { date: "2024-01-02", value: 2, yoy_value: 1.5 },
      { date: "2024-01-03", value: 3, yoy_value: null },
    ];
    expect(() => render(<TrendChart trend={mixed} />)).not.toThrow();
    const chart = screen.getByTestId("mock-linechart");
    // hasYoY = true (at least one non-null yoy_value)
    expect(chart.getAttribute("data-categories")).toBe("Aktuell,Vorjahr");
  });
});
