import { useEntity } from "@/hooks/useEntity";
import { WeatherIcon } from "./WeatherIcon";
import { CardErrorBoundary } from "./CardErrorBoundary";
import type { CardComponentProps } from "./CardRegistry";

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

export function WeatherCard({ card, onCardAction }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const condition = entity?.state || "";
  const temp = entity?.attributes?.temperature as number | undefined;
  const humidity = entity?.attributes?.humidity as number | undefined;
  const conditionText = CONDITION_TEXT[condition] || condition;

  return (
    <CardErrorBoundary cardType="weather">
      <div
        className="weather-card"
        onClick={() => onCardAction?.("weather")}
        style={{
          borderRadius: "var(--dh-card-radius)",
          border: "var(--dh-surface-border)",
          boxShadow: "var(--dh-card-shadow)",
          background: "linear-gradient(135deg, rgba(86,204,242,0.2) 0%, rgba(45,156,219,0.15) 100%)",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          height: 120,
          overflow: "hidden",
          gridColumn: "span 2",
          cursor: "pointer",
        }}
      >
        <WeatherIcon condition={condition} size={72} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: 42, fontWeight: 700, lineHeight: 1, color: "var(--dh-gray100)" }}>
              {temp !== undefined ? `${Math.round(temp)}°` : "--"}
            </span>
            {humidity !== undefined && (
              <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.6, color: "var(--dh-gray100)" }}>
                {humidity}%
              </span>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, opacity: 0.7, marginTop: 6, color: "var(--dh-gray100)" }}>
            {conditionText}
          </div>
        </div>
      </div>
    </CardErrorBoundary>
  );
}
