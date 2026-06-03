import { useState, useEffect } from "react";
import { apiUrl } from "@/utils/basePath";

export interface HistoryPoint {
  t: number; // unix seconds
  v: number;
}

interface CacheEntry {
  at: number;
  points: HistoryPoint[];
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;

/**
 * Fetch up to `hours` of numeric history for a sensor (for card sparklines).
 *
 * Results are cached per entity+hours for 5 minutes so a dashboard full of
 * sensor cards reuses data instead of re-fetching. Returns `[]` until loaded
 * or when `entityId` is undefined. History is decorative: fetch failures
 * degrade silently to "no sparkline" (logged at debug) rather than surfacing
 * an error on the card.
 */
export function useSensorHistory(entityId: string | undefined, hours = 24): HistoryPoint[] {
  const key = entityId ? `${entityId}:${hours}` : "";
  const [points, setPoints] = useState<HistoryPoint[]>(() => cache.get(key)?.points ?? []);

  useEffect(() => {
    if (!entityId) {
      setPoints([]);
      return;
    }
    const k = `${entityId}:${hours}`;
    const cached = cache.get(k);
    if (cached && Date.now() - cached.at < TTL_MS) {
      setPoints(cached.points);
      return;
    }
    let cancelled = false;
    fetch(apiUrl(`/api/history?entity_id=${encodeURIComponent(entityId)}&hours=${hours}`))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`history ${r.status}`))))
      .then((data) => {
        if (cancelled) return;
        const pts: HistoryPoint[] = Array.isArray(data?.points) ? data.points : [];
        cache.set(k, { at: Date.now(), points: pts });
        setPoints(pts);
      })
      .catch((err) => {
        if (!cancelled) console.debug("[useSensorHistory]", entityId, err);
      });
    return () => {
      cancelled = true;
    };
  }, [entityId, hours]);

  return points;
}
