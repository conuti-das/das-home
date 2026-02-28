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
};
