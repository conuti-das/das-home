import type { DashboardConfig } from "@/types";
import { apiUrl } from "@/utils/basePath";

const BASE = apiUrl("/api/discovery");

export interface DiscoveryResult {
  states: Array<{ entity_id: string; state: string; attributes: Record<string, unknown> }>;
  areas: Array<{ area_id: string; name: string; picture: string | null }>;
  devices: Array<{ id: string; name: string; area_id: string | null }>;
  entity_registry: Array<{ entity_id: string; device_id: string | null; area_id: string | null }>;
  floors: Array<{ floor_id: string; name: string; level: number }>;
  summary: {
    entity_count: number;
    area_count: number;
    device_count: number;
    floor_count: number;
  };
}

export async function runDiscovery(): Promise<DiscoveryResult> {
  const resp = await fetch(BASE);
  if (!resp.ok) throw new Error(`Discovery failed: ${resp.status}`);
  return resp.json();
}

export async function suggestDashboard(): Promise<DashboardConfig> {
  const resp = await fetch(`${BASE}/suggest`, { method: "POST" });
  if (!resp.ok) throw new Error(`Suggestion failed: ${resp.status}`);
  return resp.json();
}
