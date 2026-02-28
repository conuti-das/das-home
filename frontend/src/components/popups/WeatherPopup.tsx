import { useEntity, useEntitiesByDomain } from "@/hooks/useEntity";
import { PopupModal } from "@/components/layout/PopupModal";
import { WeatherIcon } from "@/components/cards/WeatherIcon";
import type { PopupProps } from "./PopupRegistry";

const CONDITION_TEXT: Record<string, string> = {
  sunny: "Sonnig",
  "clear-night": "Klare Nacht",
  cloudy: "Bewölkt",
  partlycloudy: "Teilw. bewölkt",
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
  exceptional: "Ungewöhnlich",
};

const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export function WeatherPopup({ onClose, props }: PopupProps) {
  // Use provided entity or find first weather entity
  const weatherEntities = useEntitiesByDomain("weather");
  const entityId = (props?.entityId as string) || weatherEntities[0]?.entity_id || "weather.forecast_home";
  const entity = useEntity(entityId);
  const condition = entity?.state || "";
  const temp = entity?.attributes?.temperature as number | undefined;
  const humidity = entity?.attributes?.humidity as number | undefined;
  const windSpeed = entity?.attributes?.wind_speed as number | undefined;
  const pressure = entity?.attributes?.pressure as number | undefined;
  const forecast = (entity?.attributes?.forecast as Array<{
    datetime: string;
    condition: string;
    temperature: number;
    templow?: number;
    precipitation_probability?: number;
  }>) || [];

  const conditionText = CONDITION_TEXT[condition] || condition;
  const dailyForecast = forecast.slice(0, 7);

  return (
    <PopupModal open title="Wetter" icon="weather-proofing" onClose={onClose}>
      {/* Current */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "8px 8px 20px 8px" }}>
        <WeatherIcon condition={condition} size={72} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 48, fontWeight: 700, color: "var(--dh-gray100)" }}>
              {temp !== undefined ? `${Math.round(temp)}°` : "--"}
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, opacity: 0.7, color: "var(--dh-gray100)" }}>
            {conditionText}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: 12, padding: "0 8px 20px 8px" }}>
        {humidity !== undefined && (
          <div style={{ flex: 1, background: "var(--dh-gray300)", borderRadius: "var(--dh-card-radius)", padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 11, opacity: 0.5, color: "var(--dh-gray100)" }}>Feuchtigkeit</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--dh-blue)" }}>{humidity}%</div>
          </div>
        )}
        {windSpeed !== undefined && (
          <div style={{ flex: 1, background: "var(--dh-gray300)", borderRadius: "var(--dh-card-radius)", padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 11, opacity: 0.5, color: "var(--dh-gray100)" }}>Wind</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--dh-gray100)" }}>{Math.round(windSpeed)} km/h</div>
          </div>
        )}
        {pressure !== undefined && (
          <div style={{ flex: 1, background: "var(--dh-gray300)", borderRadius: "var(--dh-card-radius)", padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 11, opacity: 0.5, color: "var(--dh-gray100)" }}>Druck</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--dh-gray100)" }}>{Math.round(pressure)} hPa</div>
          </div>
        )}
      </div>

      {/* 7-Day Forecast */}
      {dailyForecast.length > 0 && (
        <div style={{ padding: "0 8px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.4, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, color: "var(--dh-gray100)" }}>
            7-Tage-Vorhersage
          </div>
          {dailyForecast.map((day, i) => {
            const date = new Date(day.datetime);
            const dayName = i === 0 ? "Heute" : DAY_NAMES[date.getDay()];
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: i < dailyForecast.length - 1 ? "1px solid rgba(250,251,252,0.06)" : "none",
                }}
              >
                <span style={{ width: 40, fontSize: 13, fontWeight: 600, color: "var(--dh-gray100)" }}>{dayName}</span>
                <WeatherIcon condition={day.condition} size={28} />
                <span style={{ flex: 1, fontSize: 13, opacity: 0.6, color: "var(--dh-gray100)" }}>
                  {CONDITION_TEXT[day.condition] || day.condition}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--dh-gray100)" }}>
                  {Math.round(day.temperature)}°
                </span>
                {day.templow !== undefined && (
                  <span style={{ fontSize: 13, opacity: 0.5, color: "var(--dh-gray100)", width: 32, textAlign: "right" }}>
                    {Math.round(day.templow)}°
                  </span>
                )}
                {day.precipitation_probability !== undefined && day.precipitation_probability > 0 && (
                  <span style={{ fontSize: 11, color: "var(--dh-blue)", width: 32, textAlign: "right" }}>
                    {day.precipitation_probability}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PopupModal>
  );
}
