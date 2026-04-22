import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CardItem } from "@/types";
import type { InsightsResponse } from "@/services/api";

// Mock Tremor charts (jsdom can't render recharts properly)
vi.mock("@tremor/react", () => ({
  SparkAreaChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="mock-sparkchart" data-points={data.length} />
  ),
  LineChart: ({ data, categories }: { data: unknown[]; categories: string[] }) => (
    <div
      data-testid="mock-linechart"
      data-points={data.length}
      data-categories={categories.join(",")}
    />
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Metric: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import HomeOpsBriefing from "../index";

function makePayload(overrides: Partial<InsightsResponse> = {}): InsightsResponse {
  return {
    generated_at: "2024-01-01T00:00:00+00:00",
    cache_age_seconds: 0,
    kpis: {
      energy_cost_today: {
        value: 2.5,
        unit: "€",
        available: true,
        entity_id: "sensor.energy",
        trend_7d: [1, 2, 3, 4, 5, 6, 7],
        yoy_7d: null,
        anomaly_flag: false,
      },
      occupancy_hours_today: {
        value: 8.5,
        unit: "h",
        available: true,
        entity_id: "sensor.presence",
        trend_7d: [6, 7, 8, 9, 8, 7, 8],
        yoy_7d: null,
        anomaly_flag: false,
      },
      device_uptime_pct: {
        value: 99.8,
        unit: "%",
        available: true,
        entity_id: null,
        trend_7d: [99, 100, 99, 100, 100, 99, 100],
        yoy_7d: null,
        anomaly_flag: false,
      },
      anomaly_count: {
        value: 1,
        unit: "",
        available: true,
        entity_id: null,
        trend_7d: [0, 0, 0, 1, 0, 1, 1],
        yoy_7d: null,
        anomaly_flag: false,
      },
    },
    anomalies: [
      {
        entity_id: "sensor.temp_kitchen",
        friendly_name: "Kitchen Temperature",
        description: "Above normal range for Monday",
        severity: "medium",
        detected_at: "2024-01-01T12:00:00+00:00",
      },
    ],
    trends: {
      energy_daily_7d: Array.from({ length: 7 }, (_, i) => ({
        date: `2024-01-0${i + 1}`,
        value: i * 0.5,
        yoy_value: i * 0.4,
      })),
    },
    missing_kpis: [],
    ...overrides,
  };
}

function makeCard(config: Record<string, unknown> = {}): CardItem {
  return {
    id: "card-1",
    type: "home_ops_briefing",
    entity: "",
    size: "2x2",
    config,
  };
}

const mockedFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockedFetch);
  mockedFetch.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("HomeOpsBriefing", () => {
  it("renders loading state on first mount before data arrives", async () => {
    // Never-resolving fetch
    mockedFetch.mockImplementation(() => new Promise(() => {}));
    render(<HomeOpsBriefing card={makeCard()} callService={() => {}} />);
    expect(screen.getByTestId("hob-loading")).toBeInTheDocument();
  });

  it("renders full dashboard after successful fetch", async () => {
    const payload = makePayload();
    mockedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(payload), { status: 200 }),
    );

    render(<HomeOpsBriefing card={makeCard()} callService={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("hob-briefing")).toBeInTheDocument();
    });

    expect(screen.getByText("Home Operations Briefing")).toBeInTheDocument();
    const tiles = screen.getAllByTestId("hob-kpi-tile");
    expect(tiles).toHaveLength(4);
    expect(screen.getByTestId("mock-linechart")).toBeInTheDocument();
    expect(screen.getAllByTestId("hob-anomaly-item")).toHaveLength(1);
  });

  it("renders error state with retry button when fetch fails", async () => {
    mockedFetch.mockRejectedValueOnce(new Error("network down"));

    render(<HomeOpsBriefing card={makeCard()} callService={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId("hob-error")).toBeInTheDocument();
    });
    expect(screen.getByText(/Laden fehlgeschlagen/)).toBeInTheDocument();

    const retryBtn = screen.getByTestId("hob-retry");
    expect(retryBtn).toBeInTheDocument();

    // Retry triggers a new fetch
    mockedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(makePayload()), { status: 200 }),
    );
    await userEvent.click(retryBtn);
    await waitFor(() => {
      expect(screen.getByTestId("hob-briefing")).toBeInTheDocument();
    });
  });

  it("renders empty state CTA when all KPIs are unavailable", async () => {
    const emptyPayload = makePayload({
      kpis: {
        energy_cost_today: {
          value: null,
          unit: "€",
          available: false,
          entity_id: null,
          trend_7d: [0, 0, 0, 0, 0, 0, 0],
          yoy_7d: null,
          anomaly_flag: false,
          reason: "no_entity_found",
        },
        occupancy_hours_today: {
          value: null,
          unit: "h",
          available: false,
          entity_id: null,
          trend_7d: [0, 0, 0, 0, 0, 0, 0],
          yoy_7d: null,
          anomaly_flag: false,
          reason: "no_entity_found",
        },
        device_uptime_pct: {
          value: null,
          unit: "%",
          available: false,
          entity_id: null,
          trend_7d: [0, 0, 0, 0, 0, 0, 0],
          yoy_7d: null,
          anomaly_flag: false,
          reason: "no_entity_found",
        },
        anomaly_count: {
          value: null,
          unit: "",
          available: false,
          entity_id: null,
          trend_7d: [0, 0, 0, 0, 0, 0, 0],
          yoy_7d: null,
          anomaly_flag: false,
        },
      },
      missing_kpis: ["all"],
    });
    mockedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(emptyPayload), { status: 200 }),
    );

    render(<HomeOpsBriefing card={makeCard()} callService={() => {}} />);
    await waitFor(() => {
      expect(screen.getByTestId("hob-empty")).toBeInTheDocument();
    });
    expect(screen.getByTestId("hob-configure-cta")).toBeInTheDocument();
  });

  it("shows stale badge when cache_age_seconds > 300", async () => {
    const stalePayload = makePayload({ cache_age_seconds: 900 });
    mockedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(stalePayload), { status: 200 }),
    );

    render(<HomeOpsBriefing card={makeCard()} callService={() => {}} />);
    await waitFor(() => {
      expect(screen.getByTestId("hob-stale-badge")).toBeInTheDocument();
    });
    expect(screen.getByTestId("hob-stale-badge")).toHaveTextContent(/15m/);
  });

  it("refetches on 5-minute poll interval", async () => {
    vi.useFakeTimers();
    mockedFetch.mockResolvedValue(
      new Response(JSON.stringify(makePayload()), { status: 200 }),
    );

    render(<HomeOpsBriefing card={makeCard()} callService={() => {}} />);

    // Wait for initial fetch to resolve
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1));

    // Advance 5 minutes — poll should fire
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    });
    expect(mockedFetch).toHaveBeenCalledTimes(2);

    // Advance another 5 minutes
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    });
    expect(mockedFetch).toHaveBeenCalledTimes(3);
  });

  it("stops polling and cleans up on unmount", async () => {
    vi.useFakeTimers();
    mockedFetch.mockResolvedValue(
      new Response(JSON.stringify(makePayload()), { status: 200 }),
    );

    const { unmount } = render(
      <HomeOpsBriefing card={makeCard()} callService={() => {}} />,
    );
    await vi.waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1));

    unmount();

    // Advance time well past the poll interval — no additional fetches
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30 * 60 * 1000);
    });
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it("passes overrides from card.config to fetchInsights", async () => {
    mockedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(makePayload()), { status: 200 }),
    );

    render(
      <HomeOpsBriefing
        card={makeCard({
          energyEntity: "sensor.custom_energy",
          occupancyEntity: "sensor.custom_presence",
          uptimeEntities: ["sensor.dev1", "sensor.dev2"],
        })}
        callService={() => {}}
      />,
    );

    await waitFor(() => expect(mockedFetch).toHaveBeenCalled());
    const url = mockedFetch.mock.calls[0][0] as string;
    expect(url).toContain("energy_entity=sensor.custom_energy");
    expect(url).toContain("occupancy_entity=sensor.custom_presence");
    expect(url).toContain("uptime_entities=sensor.dev1%2Csensor.dev2");
  });
});
