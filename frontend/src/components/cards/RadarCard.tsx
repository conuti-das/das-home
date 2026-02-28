import { CardErrorBoundary } from "./CardErrorBoundary";
import type { CardComponentProps } from "./CardRegistry";
import "./RadarCard.css";

const DEFAULT_RADAR_URL =
  "https://radar.wo-cloud.com/mobile/embedded?wrx=53.517,12.683&wrm=8&wry=53.517,12.683&wro=true";

export function RadarCard({ card }: CardComponentProps) {
  const url = (card.config?.url as string) || DEFAULT_RADAR_URL;

  return (
    <CardErrorBoundary cardType="radar">
      <div className="radar-card">
        <iframe src={url} title="Radar" loading="lazy" />
      </div>
    </CardErrorBoundary>
  );
}
