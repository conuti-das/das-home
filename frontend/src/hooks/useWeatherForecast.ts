// frontend/src/hooks/useWeatherForecast.ts
import { useMemo } from "react";
import { useEntity, useEntitiesByDomain } from "./useEntity";

export interface ForecastEntry {
  datetime: string;
  condition: string;
  temperature: number;
  templow?: number;
  precipitation?: number;
  precipitation_probability?: number;
  wind_speed?: number;
  wind_bearing?: number;
  humidity?: number;
}

interface WeatherForecastResult {
  hourlyForecast: ForecastEntry[];
  dailyForecast: ForecastEntry[];
  entityId: string;
}

/**
 * Reads forecast data from weather entity attributes.
 * Uses the legacy forecast attribute (still available in most HA setups).
 * Splits entries into hourly (within 24h) and daily (beyond 24h) buckets.
 */
export function useWeatherForecast(): WeatherForecastResult {
  const weatherEntities = useEntitiesByDomain("weather");
  const entityId = weatherEntities[0]?.entity_id || "weather.forecast_home";
  const entity = useEntity(entityId);

  const forecast = (entity?.attributes?.forecast as ForecastEntry[]) || [];

  const { hourlyForecast, dailyForecast } = useMemo(() => {
    if (forecast.length === 0) return { hourlyForecast: [], dailyForecast: [] };

    const now = Date.now();
    const in24h = now + 24 * 60 * 60 * 1000;

    // If entries are spaced <= 3 hours apart, treat as hourly data
    const firstTwo = forecast.slice(0, 2);
    const isHourlyData = firstTwo.length === 2 &&
      (new Date(firstTwo[1].datetime).getTime() - new Date(firstTwo[0].datetime).getTime()) <= 3 * 60 * 60 * 1000;

    if (isHourlyData) {
      // All hourly — split into near-term (hourly badges) and daily summary not available
      return {
        hourlyForecast: forecast.filter((e) => new Date(e.datetime).getTime() <= in24h),
        dailyForecast: [],
      };
    }

    // Otherwise treat as daily data
    return {
      hourlyForecast: [],
      dailyForecast: forecast,
    };
  }, [forecast]);

  return { hourlyForecast, dailyForecast, entityId };
}
