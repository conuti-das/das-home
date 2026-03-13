// frontend/src/hooks/useWeatherForecast.ts
import { useEffect, useState, useMemo, useRef } from "react";
import { useEntitiesByDomain } from "./useEntity";
import { wsUrl } from "@/utils/basePath";

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
 * Fetches weather forecast data via the backend WS proxy.
 * HA 2024.3+ removed the forecast attribute from weather entities,
 * so we use the weather/subscribe_forecast WS command instead.
 */
export function useWeatherForecast(): WeatherForecastResult {
  const weatherEntities = useEntitiesByDomain("weather");
  const entityId = weatherEntities[0]?.entity_id || "";

  const [hourlyData, setHourlyData] = useState<ForecastEntry[]>([]);
  const [dailyData, setDailyData] = useState<ForecastEntry[]>([]);
  const fetched = useRef(false);

  useEffect(() => {
    // Don't fetch until we have a real entity ID from the store
    if (!entityId || fetched.current) return;

    let cancelled = false;

    function fetchForecast() {
      const ws = new WebSocket(wsUrl("/ws"));
      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: "weather_forecast",
          entity_id: entityId,
          id: "forecast_req",
        }));
      };
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "weather_forecast_result" && !cancelled) {
          const hourly = msg.hourly || [];
          const daily = msg.daily || [];
          setHourlyData(hourly);
          setDailyData(daily);
          // Only mark as fetched if we got actual data
          if (hourly.length > 0 || daily.length > 0) {
            fetched.current = true;
          }
          ws.close();
        }
      };
      ws.onerror = () => ws.close();
    }

    fetchForecast();
    // Re-fetch every 30 minutes
    const interval = setInterval(() => {
      fetched.current = false;
      fetchForecast();
    }, 30 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [entityId]);

  const result = useMemo(() => {
    return { hourlyForecast: hourlyData, dailyForecast: dailyData };
  }, [hourlyData, dailyData]);

  return { ...result, entityId };
}
