import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnomalyList } from "../AnomalyList";
import type { InsightsAnomaly } from "@/services/api";

function makeAnomaly(i: number, severity: InsightsAnomaly["severity"] = "low"): InsightsAnomaly {
  return {
    entity_id: `sensor.test_${i}`,
    friendly_name: `Test Sensor ${i}`,
    description: `Ungewöhnlicher Wert erkannt (${i})`,
    severity,
    detected_at: `2024-01-01T00:00:${String(i).padStart(2, "0")}Z`,
  };
}

describe("AnomalyList", () => {
  it("renders 'Alles normal' when empty", () => {
    render(<AnomalyList anomalies={[]} />);
    expect(screen.getByTestId("hob-anomaly-empty")).toBeInTheDocument();
    expect(screen.getByText(/Alles normal/i)).toBeInTheDocument();
    expect(screen.queryByTestId("hob-anomaly-list")).not.toBeInTheDocument();
  });

  it("renders 3 anomalies with names and severity", () => {
    const list = [
      makeAnomaly(1, "low"),
      makeAnomaly(2, "medium"),
      makeAnomaly(3, "high"),
    ];
    render(<AnomalyList anomalies={list} />);
    expect(screen.getByText("Test Sensor 1")).toBeInTheDocument();
    expect(screen.getByText("Test Sensor 2")).toBeInTheDocument();
    expect(screen.getByText("Test Sensor 3")).toBeInTheDocument();

    const items = screen.getAllByTestId("hob-anomaly-item");
    expect(items).toHaveLength(3);
    expect(items[0].getAttribute("data-severity")).toBe("low");
    expect(items[1].getAttribute("data-severity")).toBe("medium");
    expect(items[2].getAttribute("data-severity")).toBe("high");
  });

  it("shows first 10 + 'N weitere' affordance when > 10 anomalies", async () => {
    const list = Array.from({ length: 15 }, (_, i) => makeAnomaly(i + 1));
    render(<AnomalyList anomalies={list} />);

    const items = screen.getAllByTestId("hob-anomaly-item");
    expect(items).toHaveLength(10);

    const more = screen.getByTestId("hob-anomaly-more");
    expect(more).toHaveTextContent(/5 weitere/);

    await userEvent.click(more);
    const expanded = screen.getAllByTestId("hob-anomaly-item");
    expect(expanded).toHaveLength(15);
    expect(screen.queryByTestId("hob-anomaly-more")).not.toBeInTheDocument();
  });
});
