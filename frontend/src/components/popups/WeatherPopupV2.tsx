// frontend/src/components/popups/WeatherPopupV2.tsx
import { useEntity, useEntitiesByDomain } from "@/hooks/useEntity";
import { useWeatherForecast } from "@/hooks/useWeatherForecast";
import { PopupModal } from "@/components/layout/PopupModal";
import { WeatherIcon } from "@/components/cards/WeatherIcon";
import type { PopupProps } from "./PopupRegistry";
import "./WeatherPopupV2.css";

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

export function WeatherPopupV2({ onClose, props }: PopupProps) {
  const weatherEntities = useEntitiesByDomain("weather");
  const entityId = (props?.entityId as string) || weatherEntities[0]?.entity_id || "weather.forecast_home";
  const entity = useEntity(entityId);
  const { hourlyForecast, dailyForecast } = useWeatherForecast();

  const condition = entity?.state || "";
  const temp = entity?.attributes?.temperature as number | undefined;
  const humidity = entity?.attributes?.humidity as number | undefined;
  const windSpeed = entity?.attributes?.wind_speed as number | undefined;
  const conditionText = CONDITION_TEXT[condition] || condition;

  const hourlyItems = hourlyForecast.slice(0, 12);
  const dailyItems = dailyForecast.slice(0, 7);

  return (
    <PopupModal open title="Wetter" icon="weather-proofing" onClose={onClose} className="weather-popup-modal">
      {/* Current weather */}
      <div className="wpv2__current">
        <div>
          <div className="wpv2__current-temp">
            {temp !== undefined ? `${Math.round(temp)}°` : "--"}
          </div>
          <div className="wpv2__current-feels">
            {conditionText}
            {humidity !== undefined && ` · ${humidity}%`}
            {windSpeed !== undefined && ` · ${Math.round(windSpeed)} km/h`}
          </div>
        </div>
        <WeatherIcon condition={condition} size={64} />
      </div>

      {/* Hourly forecast */}
      {hourlyItems.length > 0 && (
        <div className="wpv2__hourly">
          {hourlyItems.map((entry, i) => {
            const time = new Date(entry.datetime);
            const timeStr = time.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
            const wind = entry.wind_speed ? `${Math.round(entry.wind_speed)}km/h` : "";
            const precip = entry.precipitation ? `${entry.precipitation}mm` : "";
            const extra = [wind, precip].filter(Boolean).join(" · ");
            return (
              <div key={i} className="wpv2__hour-item">
                <span className="wpv2__hour-time">{timeStr}</span>
                <WeatherIcon condition={entry.condition} size={24} />
                <span className="wpv2__hour-temp">{Math.round(entry.temperature)}°</span>
                {extra && <span className="wpv2__hour-extra">{extra}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Daily forecast */}
      {dailyItems.length > 0 && (
        <div className="wpv2__daily">
          {dailyItems.map((entry, i) => {
            const date = new Date(entry.datetime);
            const dayName = i === 0 ? "Heute" : i === 1 ? "Morgen" : DAY_NAMES[date.getDay()];
            const condText = CONDITION_TEXT[entry.condition] || entry.condition;
            const precip = entry.precipitation ? `${entry.precipitation}mm` : "0mm";
            const tempLow = entry.templow !== undefined ? `${Math.round(entry.templow)}°` : "";
            return (
              <div key={i} className="wpv2__day-item">
                <div>
                  <div className="wpv2__day-name">{dayName}</div>
                  <div className="wpv2__day-temp">
                    {Math.round(entry.temperature)}°
                    {tempLow && <span className="wpv2__day-templow"> / {tempLow}</span>}
                  </div>
                  <div className="wpv2__day-condition">{condText} · {precip}</div>
                </div>
                <WeatherIcon condition={entry.condition} size={42} />
              </div>
            );
          })}
        </div>
      )}
    </PopupModal>
  );
}
