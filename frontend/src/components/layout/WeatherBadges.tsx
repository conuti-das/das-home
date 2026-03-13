// frontend/src/components/layout/WeatherBadges.tsx
import { useMemo } from "react";
import { WeatherIcon } from "@/components/cards/WeatherIcon";
import { useWeatherForecast } from "@/hooks/useWeatherForecast";
import "./WeatherBadges.css";

const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

interface WeatherBadgesProps {
  onOpenPopup?: (popupId: string, props?: Record<string, unknown>) => void;
  hourlyCount?: number;
  dailyCount?: number;
  showHourly?: boolean;
  showDaily?: boolean;
}

export function WeatherBadges({ onOpenPopup, hourlyCount = 3, dailyCount = 3, showHourly = true, showDaily = true }: WeatherBadgesProps) {
  const { hourlyForecast, dailyForecast, entityId } = useWeatherForecast();

  const hourlyBadges = useMemo(() => showHourly ? hourlyForecast.slice(0, hourlyCount) : [], [hourlyForecast, hourlyCount, showHourly]);
  const dailyBadges = useMemo(() => showDaily ? dailyForecast.slice(0, dailyCount) : [], [dailyForecast, dailyCount, showDaily]);

  if (hourlyBadges.length === 0 && dailyBadges.length === 0) {
    return null;
  }

  const handleClick = () => {
    onOpenPopup?.("weather", { entityId });
  };

  return (
    <>
      <div className="weather-badges__divider" />

      {/* Hourly badges */}
      {hourlyBadges.length > 0 && (
        <div className="weather-badges">
          {hourlyBadges.map((entry, i) => {
            const time = new Date(entry.datetime);
            const timeStr = time.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={i} className="weather-badge" onClick={handleClick}>
                <span className="weather-badge__time">{timeStr}</span>
                <WeatherIcon condition={entry.condition} size={18} />
                <span className="weather-badge__temp">{Math.round(entry.temperature)}°</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Divider between hourly and daily */}
      {hourlyBadges.length > 0 && dailyBadges.length > 0 && (
        <div className="weather-badges__divider" />
      )}

      {/* Daily badges */}
      {dailyBadges.length > 0 && (
        <div className="weather-badges">
          {dailyBadges.map((entry, i) => {
            const date = new Date(entry.datetime);
            const dayName = DAY_NAMES[date.getDay()];
            return (
              <div key={i} className="weather-badge" onClick={handleClick}>
                <span className="weather-badge__time">{dayName}</span>
                <WeatherIcon condition={entry.condition} size={18} />
                <span className="weather-badge__temps">
                  <span className="weather-badge__temp">{Math.round(entry.temperature)}°</span>
                  {entry.templow !== undefined && (
                    <span className="weather-badge__temp-low">{Math.round(entry.templow)}°</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
