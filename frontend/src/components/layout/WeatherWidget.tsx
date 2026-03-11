import { useEntitiesByDomain } from "@/hooks/useEntity";
import { WeatherIcon } from "@/components/cards/WeatherIcon";
import "./WeatherWidget.css";

interface WeatherWidgetProps {
  onWeatherClick: () => void;
}

const CONDITION_SHORT: Record<string, string> = {
  sunny: "Sonnig",
  "clear-night": "Klar",
  cloudy: "Bewolkt",
  partlycloudy: "Teilw. bew.",
  rainy: "Regen",
  pouring: "Starkregen",
  snowy: "Schnee",
  "snowy-rainy": "Schneeregen",
  lightning: "Gewitter",
  "lightning-rainy": "Gewitter",
  fog: "Nebel",
  windy: "Windig",
  "windy-variant": "Windig",
  hail: "Hagel",
  exceptional: "Extrem",
};

export function WeatherWidget({ onWeatherClick }: WeatherWidgetProps) {
  const weatherEntities = useEntitiesByDomain("weather");
  const weather = weatherEntities[0];

  if (!weather) return null;

  const temp = weather.attributes?.temperature as number | undefined;
  const humidity = weather.attributes?.humidity as number | undefined;
  const condition = weather.state || "";
  const conditionText = CONDITION_SHORT[condition] || condition;

  return (
    <div className="weather-widget" onClick={onWeatherClick}>
      <div className="weather-widget__icon">
        <WeatherIcon condition={condition} size={40} />
      </div>
      <div className="weather-widget__info">
        <div className="weather-widget__temp">
          {temp !== undefined ? `${Math.round(temp)}°` : "--"}
        </div>
        <div className="weather-widget__meta">
          <span className="weather-widget__condition">{conditionText}</span>
          {humidity !== undefined && (
            <span className="weather-widget__humidity">{humidity}%</span>
          )}
        </div>
      </div>
    </div>
  );
}
