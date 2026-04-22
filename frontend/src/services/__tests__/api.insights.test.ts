import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchInsights, type InsightsResponse } from "@/services/api";

function makePayload(): InsightsResponse {
  return {
    generated_at: "2024-01-01T00:00:00+00:00",
    cache_age_seconds: 0,
    kpis: {
      energy_cost_today: {
        value: 1.23,
        unit: "€",
        available: true,
        entity_id: "sensor.energy",
        trend_7d: [0, 1, 2, 3, 4, 5, 6],
        yoy_7d: null,
        anomaly_flag: false,
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
        value: 99.5,
        unit: "%",
        available: true,
        entity_id: null,
        trend_7d: [99, 99, 100, 100, 99, 99, 100],
        yoy_7d: null,
        anomaly_flag: false,
      },
      anomaly_count: {
        value: 0,
        unit: "",
        available: true,
        entity_id: null,
        trend_7d: [0, 0, 0, 0, 0, 0, 0],
        yoy_7d: null,
        anomaly_flag: false,
      },
    },
    anomalies: [],
    trends: { energy_daily_7d: [] },
    missing_kpis: ["occupancy_hours_today"],
  };
}

describe("fetchInsights", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls the /api/insights endpoint and returns parsed JSON", async () => {
    const payload = makePayload();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(payload), { status: 200 }),
    );

    const result = await fetchInsights();
    expect(result).toEqual(payload);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/insights");
    // Without overrides, there is no query string
    expect(url).not.toContain("?");
  });

  it("throws a descriptive error on non-OK status (503)", async () => {
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response("service down", { status: 503, statusText: "Service Unavailable" }),
    );

    await expect(fetchInsights()).rejects.toThrow(/503/);
    await expect(fetchInsights()).rejects.toThrow(/Insights fetch failed/);
  });

  it("encodes overrides into the query string", async () => {
    const payload = makePayload();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    );

    await fetchInsights({
      energyEntity: "sensor.energy_cost",
      occupancyEntity: "binary_sensor.presence",
      uptimeEntities: ["sensor.a", "sensor.b"],
    });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("energy_entity=sensor.energy_cost");
    expect(url).toContain("occupancy_entity=binary_sensor.presence");
    expect(url).toContain("uptime_entities=sensor.a%2Csensor.b");
  });

  it("omits empty overrides from the query string", async () => {
    const payload = makePayload();
    const mockFetch = vi.mocked(globalThis.fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(payload), { status: 200 }),
    );

    await fetchInsights({ uptimeEntities: [] });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).not.toContain("?");
  });
});
