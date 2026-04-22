import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { InsightsKPI } from "@/services/api";

// Mock Tremor's SparkAreaChart to a thin stub — jsdom can't render recharts canvas/svg cleanly
vi.mock("@tremor/react", () => ({
  SparkAreaChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="mock-sparkchart" data-points={data.length} />
  ),
  LineChart: ({ data, categories }: { data: unknown[]; categories: string[] }) => (
    <div data-testid="mock-linechart" data-points={data.length} data-categories={categories.join(",")} />
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Metric: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { KPITile } from "../KPITile";

function availableKpi(overrides: Partial<InsightsKPI> = {}): InsightsKPI {
  return {
    value: 12.34,
    unit: "€",
    available: true,
    entity_id: "sensor.energy",
    trend_7d: [1, 2, 3, 4, 5, 6, 7],
    yoy_7d: null,
    anomaly_flag: false,
    ...overrides,
  };
}

describe("KPITile", () => {
  it("renders value, unit, and spark chart when available", () => {
    render(<KPITile label="Energiekosten" kpi={availableKpi()} />);
    expect(screen.getByText("Energiekosten")).toBeInTheDocument();
    expect(screen.getByText("12.3")).toBeInTheDocument();
    expect(screen.getByText("€")).toBeInTheDocument();
    expect(screen.getByTestId("mock-sparkchart")).toHaveAttribute("data-points", "7");
  });

  it("adds anomaly indicator when anomaly_flag is true", () => {
    render(<KPITile label="Uptime" kpi={availableKpi({ anomaly_flag: true })} />);
    expect(screen.getByTestId("hob-anomaly-indicator")).toBeInTheDocument();
    const tile = screen.getByTestId("hob-kpi-tile");
    expect(tile.getAttribute("data-anomaly")).toBe("true");
  });

  it("renders Konfigurieren CTA when kpi is unavailable", () => {
    const unavailable: InsightsKPI = {
      value: null,
      unit: "€",
      available: false,
      entity_id: null,
      trend_7d: [0, 0, 0, 0, 0, 0, 0],
      yoy_7d: null,
      anomaly_flag: false,
      reason: "no_entity_found",
    };
    render(<KPITile label="Energiekosten" kpi={unavailable} />);
    expect(screen.getByText("Energiekosten")).toBeInTheDocument();
    expect(screen.getByText(/Konfigurieren/)).toBeInTheDocument();
    const tile = screen.getByTestId("hob-kpi-tile");
    expect(tile.getAttribute("data-available")).toBe("false");
  });

  it("does NOT render spark chart when trend is all zeros", () => {
    render(
      <KPITile
        label="No data"
        kpi={availableKpi({ trend_7d: [0, 0, 0, 0, 0, 0, 0] })}
      />,
    );
    expect(screen.queryByTestId("mock-sparkchart")).not.toBeInTheDocument();
  });

  it("formats large values without decimals", () => {
    render(<KPITile label="Big" kpi={availableKpi({ value: 1234.56 })} />);
    expect(screen.getByText("1235")).toBeInTheDocument();
  });
});
