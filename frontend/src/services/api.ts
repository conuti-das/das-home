import type { AppConfiguration, DashboardConfig } from "@/types";
import { apiUrl } from "@/utils/basePath";

const BASE = apiUrl("/api");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!resp.ok) {
    throw new Error(`API error: ${resp.status} ${resp.statusText}`);
  }
  return resp.json();
}

export const api = {
  getHealth: () => request<{ status: string; version: string; mode: string; releases_url: string }>("/health"),
  getConfig: () => request<AppConfiguration>("/config"),
  putConfig: (config: AppConfiguration) =>
    request("/config", { method: "PUT", body: JSON.stringify(config) }),
  getDashboard: () => request<DashboardConfig>("/dashboard"),
  putDashboard: (dashboard: DashboardConfig) =>
    request("/dashboard", { method: "PUT", body: JSON.stringify(dashboard) }),
  getAuthStatus: () => request<{ configured: boolean; mode: string }>("/auth/status"),
  getPanelInfo: () => request<{ is_addon: boolean; panel_name?: string; panel_url?: string; message?: string }>("/panel/info"),
  setDefaultPanel: () => request<{ status: string; default_panel?: string; message?: string; panel_name?: string }>("/panel/set-default", { method: "POST" }),
  getCalendarEvents: (entityId: string, start: string, end: string) =>
    request<Array<{ summary: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string }; description?: string; location?: string }>>(
      `/calendar/events/${entityId}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    ),
};

// ---------- Insights (Home Operations Briefing) ----------

export interface InsightsKPI {
  value: number | null;
  unit: string;
  available: boolean;
  entity_id: string | null;
  trend_7d: number[];
  yoy_7d: number[] | null;
  anomaly_flag: boolean;
  reason?: "no_entity_found" | "no_data" | "error";
}

export interface InsightsAnomaly {
  entity_id: string;
  friendly_name: string;
  description: string;
  severity: "low" | "medium" | "high";
  detected_at: string;
}

export interface InsightsTrendPoint {
  date: string;
  value: number;
  yoy_value: number | null;
}

export interface InsightsResponse {
  generated_at: string;
  cache_age_seconds: number;
  kpis: {
    energy_cost_today: InsightsKPI;
    occupancy_hours_today: InsightsKPI;
    device_uptime_pct: InsightsKPI;
    anomaly_count: InsightsKPI;
  };
  anomalies: InsightsAnomaly[];
  trends: { energy_daily_7d: InsightsTrendPoint[] };
  missing_kpis: string[];
}

export interface InsightsOverrides {
  energyEntity?: string;
  occupancyEntity?: string;
  uptimeEntities?: string[];
}

export async function fetchInsights(overrides?: InsightsOverrides): Promise<InsightsResponse> {
  const params = new URLSearchParams();
  if (overrides?.energyEntity) params.set("energy_entity", overrides.energyEntity);
  if (overrides?.occupancyEntity) params.set("occupancy_entity", overrides.occupancyEntity);
  if (overrides?.uptimeEntities?.length) params.set("uptime_entities", overrides.uptimeEntities.join(","));
  const qs = params.toString();
  const url = apiUrl(`/api/insights${qs ? `?${qs}` : ""}`);
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Insights fetch failed: ${resp.status} ${resp.statusText}`);
  }
  return resp.json();
}
