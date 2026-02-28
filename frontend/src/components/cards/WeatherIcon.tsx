import "./WeatherIcon.css";

interface WeatherIconProps {
  condition: string;
  size?: number;
}

function SunnyIcon({ size }: { size: number }) {
  return (
    <svg className="weather-icon" width={size} height={size} viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="12" fill="#F2C94C" />
      <g className="rays">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1="32" y1="12" x2="32" y2="6"
            stroke="#F2C94C" strokeWidth="2.5" strokeLinecap="round"
            transform={`rotate(${angle} 32 32)`}
          />
        ))}
      </g>
    </svg>
  );
}

function ClearNightIcon({ size }: { size: number }) {
  return (
    <svg className="weather-icon" width={size} height={size} viewBox="0 0 64 64">
      <path d="M36 16a16 16 0 1 0 0 32 16 16 0 0 1 0-32z" fill="#E0E0E0" />
      <circle className="star" cx="18" cy="20" r="1.5" fill="#FFF" />
      <circle className="star" cx="12" cy="34" r="1" fill="#FFF" />
      <circle className="star" cx="22" cy="44" r="1.2" fill="#FFF" />
    </svg>
  );
}

function CloudIcon({ size }: { size: number }) {
  return (
    <svg className="weather-icon" width={size} height={size} viewBox="0 0 64 64">
      <g className="cloud-drift">
        <path d="M18 40a10 10 0 0 1 0-20h1a14 14 0 0 1 27 4 8 8 0 0 1-1 16H18z" fill="#B0BEC5" />
      </g>
    </svg>
  );
}

function PartlyCloudyIcon({ size }: { size: number }) {
  return (
    <svg className="weather-icon" width={size} height={size} viewBox="0 0 64 64">
      <circle cx="24" cy="24" r="10" fill="#F2C94C" />
      <g className="rays">
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <line
            key={angle}
            x1="24" y1="10" x2="24" y2="6"
            stroke="#F2C94C" strokeWidth="2" strokeLinecap="round"
            transform={`rotate(${angle} 24 24)`}
          />
        ))}
      </g>
      <g className="cloud-drift">
        <path d="M22 46a8 8 0 0 1 0-16h1a11 11 0 0 1 21 3 6 6 0 0 1-1 13H22z" fill="#B0BEC5" />
      </g>
    </svg>
  );
}

function RainyIcon({ size }: { size: number }) {
  return (
    <svg className="weather-icon" width={size} height={size} viewBox="0 0 64 64">
      <path d="M16 34a9 9 0 0 1 0-18h1a12 12 0 0 1 23 3 7 7 0 0 1-1 14H16z" fill="#B0BEC5" />
      <line className="raindrop" x1="24" y1="40" x2="22" y2="50" stroke="#56CCF2" strokeWidth="2" strokeLinecap="round" />
      <line className="raindrop" x1="32" y1="40" x2="30" y2="50" stroke="#56CCF2" strokeWidth="2" strokeLinecap="round" />
      <line className="raindrop" x1="40" y1="40" x2="38" y2="50" stroke="#56CCF2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PouringIcon({ size }: { size: number }) {
  return (
    <svg className="weather-icon" width={size} height={size} viewBox="0 0 64 64">
      <path d="M16 32a9 9 0 0 1 0-18h1a12 12 0 0 1 23 3 7 7 0 0 1-1 14H16z" fill="#90A4AE" />
      <line className="raindrop" x1="20" y1="38" x2="17" y2="52" stroke="#56CCF2" strokeWidth="2.5" strokeLinecap="round" />
      <line className="raindrop" x1="28" y1="38" x2="25" y2="52" stroke="#56CCF2" strokeWidth="2.5" strokeLinecap="round" />
      <line className="raindrop" x1="36" y1="38" x2="33" y2="52" stroke="#56CCF2" strokeWidth="2.5" strokeLinecap="round" />
      <line className="raindrop" x1="44" y1="38" x2="41" y2="52" stroke="#56CCF2" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function SnowyIcon({ size }: { size: number }) {
  return (
    <svg className="weather-icon" width={size} height={size} viewBox="0 0 64 64">
      <path d="M16 34a9 9 0 0 1 0-18h1a12 12 0 0 1 23 3 7 7 0 0 1-1 14H16z" fill="#B0BEC5" />
      <circle className="snowflake" cx="24" cy="44" r="2" fill="#FFF" />
      <circle className="snowflake" cx="32" cy="48" r="2" fill="#FFF" />
      <circle className="snowflake" cx="40" cy="44" r="2" fill="#FFF" />
    </svg>
  );
}

function LightningIcon({ size }: { size: number }) {
  return (
    <svg className="weather-icon" width={size} height={size} viewBox="0 0 64 64">
      <path d="M16 30a9 9 0 0 1 0-18h1a12 12 0 0 1 23 3 7 7 0 0 1-1 14H16z" fill="#78909C" />
      <polygon className="lightning-bolt" points="34,32 28,44 33,44 30,56 40,40 35,40 38,32" fill="#F2C94C" />
    </svg>
  );
}

function FogIcon({ size }: { size: number }) {
  return (
    <svg className="weather-icon" width={size} height={size} viewBox="0 0 64 64">
      <line className="fog-line" x1="12" y1="24" x2="52" y2="24" stroke="#B0BEC5" strokeWidth="3" strokeLinecap="round" />
      <line className="fog-line" x1="16" y1="32" x2="48" y2="32" stroke="#B0BEC5" strokeWidth="3" strokeLinecap="round" />
      <line className="fog-line" x1="12" y1="40" x2="52" y2="40" stroke="#B0BEC5" strokeWidth="3" strokeLinecap="round" />
      <line className="fog-line" x1="18" y1="48" x2="46" y2="48" stroke="#B0BEC5" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function WindyIcon({ size }: { size: number }) {
  return (
    <svg className="weather-icon" width={size} height={size} viewBox="0 0 64 64">
      <path className="wind-line" d="M10 24 Q30 20 42 24 Q50 26 52 22" fill="none" stroke="#B0BEC5" strokeWidth="2.5" strokeLinecap="round" />
      <path className="wind-line" d="M10 34 Q26 30 38 34 Q48 36 54 32" fill="none" stroke="#B0BEC5" strokeWidth="2.5" strokeLinecap="round" />
      <path className="wind-line" d="M14 44 Q32 40 44 44 Q50 46 52 42" fill="none" stroke="#B0BEC5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const CONDITION_MAP: Record<string, React.FC<{ size: number }>> = {
  sunny: SunnyIcon,
  "clear-night": ClearNightIcon,
  cloudy: CloudIcon,
  partlycloudy: PartlyCloudyIcon,
  rainy: RainyIcon,
  pouring: PouringIcon,
  snowy: SnowyIcon,
  "snowy-rainy": SnowyIcon,
  lightning: LightningIcon,
  "lightning-rainy": LightningIcon,
  fog: FogIcon,
  windy: WindyIcon,
  "windy-variant": WindyIcon,
  hail: SnowyIcon,
  exceptional: CloudIcon,
};

export function WeatherIcon({ condition, size = 64 }: WeatherIconProps) {
  const Icon = CONDITION_MAP[condition] || CloudIcon;
  return <Icon size={size} />;
}
