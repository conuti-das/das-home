/**
 * HomeOpsBriefing — enterprise-style KPI dashboard card.
 *
 * Theming: Tremor ships tailwind-styled wrapper elements; das-home does NOT
 * use tailwind. We therefore:
 *   - Use Tremor chart components (LineChart, SparkAreaChart) — these render
 *     Recharts SVG and work fine without tailwind classes on the outer
 *     wrappers. We override chart colors via the `colors` prop (blue/gray)
 *     to match UI5's navy accent.
 *   - Use our own CSS (HomeOpsBriefing.css) for tile layout / typography
 *     so it matches existing UI5-based cards (var(--dh-*) tokens).
 *
 * Polish (legend typography, tooltip skin) is deferred to
 * /plan-design-review — "good enough" per lane brief.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchInsights } from "@/services/api";
import type {
  CardComponentProps,
} from "../CardRegistry";
import type { InsightsResponse, InsightsOverrides } from "@/services/api";
import { KPITile } from "./KPITile";
import { TrendChart } from "./TrendChart";
import { AnomalyList } from "./AnomalyList";
import "./HomeOpsBriefing.css";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const VISIBILITY_REFRESH_THRESHOLD_MS = 60 * 1000; // 60 seconds
const STALE_THRESHOLD_SECONDS = 300; // 5 minutes

function extractOverrides(config: Record<string, unknown> | undefined): InsightsOverrides | undefined {
  if (!config) return undefined;
  const out: InsightsOverrides = {};
  if (typeof config.energyEntity === "string" && config.energyEntity) {
    out.energyEntity = config.energyEntity;
  }
  if (typeof config.occupancyEntity === "string" && config.occupancyEntity) {
    out.occupancyEntity = config.occupancyEntity;
  }
  if (Array.isArray(config.uptimeEntities) && config.uptimeEntities.length > 0) {
    out.uptimeEntities = config.uptimeEntities.filter((e): e is string => typeof e === "string");
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function formatRelativeMinutes(seconds: number): string {
  if (seconds < 60) return `vor ${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `vor ${mins}m`;
  const hours = Math.floor(mins / 60);
  return `vor ${hours}h`;
}

export default function HomeOpsBriefing({ card }: CardComponentProps) {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const overrides = extractOverrides(card.config);

  const load = useCallback(async () => {
    try {
      const resp = await fetchInsights(overrides);
      if (!mountedRef.current) return;
      setData(resp);
      setError(null);
      lastFetchedRef.current = Date.now();
    } catch (e) {
      if (!mountedRef.current) return;
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [overrides]);

  // Initial fetch + polling + visibility handling
  useEffect(() => {
    mountedRef.current = true;
    load();

    function startPolling() {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        load();
      }, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        const sinceLast = Date.now() - lastFetchedRef.current;
        if (sinceLast > VISIBILITY_REFRESH_THRESHOLD_MS) {
          load();
        }
        startPolling();
      } else {
        stopPolling();
      }
    }

    if (document.visibilityState === "visible") {
      startPolling();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mountedRef.current = false;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  // Loading (first fetch)
  if (loading && !data) {
    return (
      <div className="hob-card hob-card--loading" data-testid="hob-loading">
        <div className="hob-skeleton hob-skeleton--header" />
        <div className="hob-skeleton-row">
          <div className="hob-skeleton hob-skeleton--tile" />
          <div className="hob-skeleton hob-skeleton--tile" />
          <div className="hob-skeleton hob-skeleton--tile" />
          <div className="hob-skeleton hob-skeleton--tile" />
        </div>
        <div className="hob-skeleton hob-skeleton--chart" />
      </div>
    );
  }

  // Error (no prior data)
  if (error && !data) {
    return (
      <div className="hob-card hob-card--error" data-testid="hob-error">
        <div className="hob-card__title">Home Operations Briefing</div>
        <div className="hob-error-body">
          <div className="hob-error-msg">Laden fehlgeschlagen</div>
          <div className="hob-error-detail">{error}</div>
          <button
            type="button"
            className="hob-btn hob-btn--primary"
            onClick={() => {
              setLoading(true);
              setError(null);
              load();
            }}
            data-testid="hob-retry"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const kpis = data.kpis;
  const allUnavailable =
    !kpis.energy_cost_today.available &&
    !kpis.occupancy_hours_today.available &&
    !kpis.device_uptime_pct.available &&
    !kpis.anomaly_count.available;

  // Empty state (all KPIs unavailable)
  if (allUnavailable) {
    return (
      <div className="hob-card hob-card--empty" data-testid="hob-empty">
        <div className="hob-card__title">Home Operations Briefing</div>
        <div className="hob-empty-body">
          <div className="hob-empty-msg">Keine KPIs verfügbar</div>
          <div className="hob-empty-detail">
            Konfiguriere Entity-Overrides im Karten-Editor oder stelle sicher, dass
            Home Assistant relevante Sensoren bereitstellt.
          </div>
          <button type="button" className="hob-btn hob-btn--primary" data-testid="hob-configure-cta">
            Konfiguriere KPIs im Editor
          </button>
        </div>
      </div>
    );
  }

  const isStale = (error && data) || data.cache_age_seconds > STALE_THRESHOLD_SECONDS;
  const trendPoints = data.trends?.energy_daily_7d ?? [];

  return (
    <div className="hob-card" data-testid="hob-briefing">
      <div className="hob-card__header">
        <div className="hob-card__title">Home Operations Briefing</div>
        {isStale && (
          <span
            className="hob-card__stale"
            data-testid="hob-stale-badge"
            title={`Aktualisiert ${formatRelativeMinutes(data.cache_age_seconds)}`}
          >
            Aktualisiert {formatRelativeMinutes(data.cache_age_seconds)}
          </span>
        )}
      </div>

      <div className="hob-kpi-grid" data-testid="hob-kpi-grid">
        <KPITile label="Energiekosten heute" kpi={kpis.energy_cost_today} />
        <KPITile label="Anwesenheit heute" kpi={kpis.occupancy_hours_today} />
        <KPITile label="Geräte-Uptime" kpi={kpis.device_uptime_pct} />
        <KPITile label="Anomalien" kpi={kpis.anomaly_count} />
      </div>

      <div className="hob-section">
        <div className="hob-section__title">
          7-Tage-Trend &ndash; Energiekosten
          {trendPoints.some((p) => p.yoy_value !== null) && (
            <span className="hob-section__subtitle"> (aktuell vs. Vorjahr)</span>
          )}
        </div>
        <TrendChart trend={trendPoints} />
      </div>

      <div className="hob-section">
        <div className="hob-section__title">Anomalien heute</div>
        <AnomalyList anomalies={data.anomalies} />
      </div>
    </div>
  );
}
