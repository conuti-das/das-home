import { useEntity, useEntitiesByDomain } from "@/hooks/useEntity";
import { PopupModal } from "@/components/layout/PopupModal";
import { WeatherIcon } from "@/components/cards/WeatherIcon";
import { WeatherChart } from "./WeatherChart";
import type { PopupProps } from "./PopupRegistry";
import "./WeatherPopup.css";

const CONDITION_TEXT: Record<string, string> = {
  sunny: "Sonnig",
  "clear-night": "Klare Nacht",
  cloudy: "Bewolkt",
  partlycloudy: "Teilw. bewolkt",
  rainy: "Regen",
  pouring: "Starkregen",
  snowy: "Schnee",
  "snowy-rainy": "Schneeregen",
  lightning: "Gewitter",
  "lightning-rainy": "Gewitter + Regen",
  fog: "Nebel",
  windy: "Windig",
  "windy-variant": "Windig",
  hail: "Hagel",
  exceptional: "Ungewoehnlich",
};

const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

const WIND_DIR_TEXT: Record<string, string> = {
  N: "Nord", NNE: "NNO", NE: "NO", ENE: "ONO",
  E: "Ost", ESE: "OSO", SE: "SO", SSE: "SSO",
  S: "Sued", SSW: "SSW", SW: "SW", WSW: "WSW",
  W: "West", WNW: "WNW", NW: "NW", NNW: "NNW",
};

function bearingToDir(bearing: number | undefined): string {
  if (bearing === undefined) return "";
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round(bearing / 22.5) % 16;
  const dir = dirs[idx];
  return WIND_DIR_TEXT[dir] || dir;
}

export function WeatherPopup({ onClose, props }: PopupProps) {
  const weatherEntities = useEntitiesByDomain("weather");
  const entityId = (props?.entityId as string) || weatherEntities[0]?.entity_id || "weather.forecast_home";
  const entity = useEntity(entityId);
  const condition = entity?.state || "";
  const temp = entity?.attributes?.temperature as number | undefined;
  const humidity = entity?.attributes?.humidity as number | undefined;
  const windSpeed = entity?.attributes?.wind_speed as number | undefined;
  const windBearing = entity?.attributes?.wind_bearing as number | undefined;
  const pressure = entity?.attributes?.pressure as number | undefined;
  const forecast = (entity?.attributes?.forecast as Array<{
    datetime: string;
    condition: string;
    temperature: number;
    templow?: number;
    precipitation_probability?: number;
    wind_speed?: number;
    wind_bearing?: number;
  }>) || [];

  const conditionText = CONDITION_TEXT[condition] || condition;
  const dailyForecast = forecast.slice(0, 7);
  const windDir = bearingToDir(windBearing);

  return (
    <PopupModal open title="Wetter" icon="weather-proofing" onClose={onClose} className="weather-popup-modal">
      {/* Current weather header */}
      <div className="wp__current">
        <WeatherIcon condition={condition} size={64} />
        <div className="wp__current-info">
          <span className="wp__temp">{temp !== undefined ? `${Math.round(temp)}°` : "--"}</span>
          <span className="wp__condition">{conditionText}</span>
        </div>
      </div>

      {/* Stats strip */}
      <div className="wp__stats">
        {humidity !== undefined && (
          <div className="wp__stat">
            <div className="wp__stat-label">Feuchtigkeit</div>
            <div className="wp__stat-value" style={{ color: "var(--dh-blue)" }}>{humidity}%</div>
          </div>
        )}
        {windSpeed !== undefined && (
          <div className="wp__stat">
            <div className="wp__stat-label">Wind</div>
            <div className="wp__stat-value">{Math.round(windSpeed)} km/h {windDir}</div>
          </div>
        )}
        {pressure !== undefined && (
          <div className="wp__stat">
            <div className="wp__stat-label">Druck</div>
            <div className="wp__stat-value">{Math.round(pressure)} hPa</div>
          </div>
        )}
      </div>

      {/* Temperature chart */}
      {dailyForecast.length >= 2 && (
        <div className="wp__chart-section">
          <div className="wp__section-title">7-Tage-Temperatur</div>
          <WeatherChart forecast={dailyForecast} />
        </div>
      )}

      {/* Wind detail strip per day */}
      {dailyForecast.length > 0 && (
        <div className="wp__wind-section">
          <div className="wp__section-title">Wind-Details</div>
          <div className="wp__wind-list">
            {dailyForecast.map((day, i) => {
              const date = new Date(day.datetime);
              const dayName = i === 0 ? "Heute" : DAY_NAMES[date.getDay()];
              const ws = day.wind_speed ?? 0;
              const dir = bearingToDir(day.wind_bearing);
              const precip = day.precipitation_probability;
              return (
                <div key={i} className="wp__wind-row">
                  <span className="wp__wind-day">{dayName}</span>
                  <WeatherIcon condition={day.condition} size={22} />
                  <span className="wp__wind-speed">{Math.round(ws)} km/h</span>
                  {dir && <span className="wp__wind-dir">{dir}</span>}
                  {precip !== undefined && precip > 0 && (
                    <span className="wp__wind-precip">{precip}%</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PopupModal>
  );
}
