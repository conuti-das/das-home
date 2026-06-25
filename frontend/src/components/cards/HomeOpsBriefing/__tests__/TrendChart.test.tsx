import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { InsightsTrendPoint } from "@/services/api";

// prince-ui AreaChart wird zu einem dünnen Stub gemockt — jsdom misst kein
// responsives SVG. Jede gerenderte Fläche bekommt eine eigene Test-ID, damit
// wir die Einreihen-/YoY-Überlagerung prüfen können.
vi.mock("prince-ui", () => ({
  AreaChart: ({ data, className }: { data: number[]; className?: string }) => (
    <div
      data-testid="mock-areachart"
      data-points={data.length}
      data-variant={className?.includes("--prev") ? "prev" : "current"}
    />
  ),
  Sparkline: () => <div />,
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
  it("renders current + YoY (two areas + legend) when yoy_value is populated", () => {
    render(<TrendChart trend={makeTrend(true)} />);
    const charts = screen.getAllByTestId("mock-areachart");
    // Eine aktuelle + eine Vorjahres-Fläche.
    expect(charts).toHaveLength(2);
    const variants = charts.map((c) => c.getAttribute("data-variant")).sort();
    expect(variants).toEqual(["current", "prev"]);
    expect(screen.getByTestId("hob-trend-legend")).toBeInTheDocument();
    const wrapper = screen.getByTestId("hob-trend-chart");
    expect(wrapper.getAttribute("data-yoy")).toBe("true");
  });

  it("renders in single-area mode (no legend) when all yoy_value are null", () => {
    render(<TrendChart trend={makeTrend(false)} />);
    const charts = screen.getAllByTestId("mock-areachart");
    expect(charts).toHaveLength(1);
    expect(charts[0].getAttribute("data-variant")).toBe("current");
    expect(charts[0].getAttribute("data-points")).toBe("7");
    expect(screen.queryByTestId("hob-trend-legend")).not.toBeInTheDocument();
    const wrapper = screen.getByTestId("hob-trend-chart");
    expect(wrapper.getAttribute("data-yoy")).toBe("false");
  });

  it("renders empty message for empty trend data", () => {
    render(<TrendChart trend={[]} />);
    expect(screen.getByTestId("hob-trend-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-areachart")).not.toBeInTheDocument();
  });

  it("doesn't crash on sparse data with some null yoy_values", () => {
    const mixed: InsightsTrendPoint[] = [
      { date: "2024-01-01", value: 1, yoy_value: null },
      { date: "2024-01-02", value: 2, yoy_value: 1.5 },
      { date: "2024-01-03", value: 3, yoy_value: null },
    ];
    expect(() => render(<TrendChart trend={mixed} />)).not.toThrow();
    // hasYoY = true (mindestens ein nicht-null yoy_value) → zwei Flächen.
    expect(screen.getAllByTestId("mock-areachart")).toHaveLength(2);
  });
});
