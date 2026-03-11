import { WeatherIcon } from "@/components/cards/WeatherIcon";

interface ForecastDay {
  datetime: string;
  condition: string;
  temperature: number;
  templow?: number;
  wind_speed?: number;
}

interface WeatherChartProps {
  forecast: ForecastDay[];
}

const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export function WeatherChart({ forecast }: WeatherChartProps) {
  if (forecast.length < 2) return null;

  const days = forecast.slice(0, 7);
  const padding = { top: 50, bottom: 40, left: 20, right: 20 };
  const width = 520;
  const height = 220;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const highs = days.map((d) => d.temperature);
  const lows = days.map((d) => d.templow ?? d.temperature - 5);

  const allTemps = [...highs, ...lows];
  const minT = Math.min(...allTemps) - 2;
  const maxT = Math.max(...allTemps) + 2;
  const range = maxT - minT || 1;

  const xStep = chartW / Math.max(1, days.length - 1);

  function tempToY(t: number): number {
    return padding.top + chartH - ((t - minT) / range) * chartH;
  }

  const highPoints = highs.map((t, i) => ({
    x: padding.left + i * xStep,
    y: tempToY(t),
    t,
  }));

  const lowPoints = lows.map((t, i) => ({
    x: padding.left + i * xStep,
    y: tempToY(t),
    t,
  }));

  const highLine = highPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const lowLine = lowPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Gradient fill area between high and low
  const areaPath = [
    `M ${highPoints[0].x},${highPoints[0].y}`,
    ...highPoints.slice(1).map((p) => `L ${p.x},${p.y}`),
    ...lowPoints.slice().reverse().map((p) => `L ${p.x},${p.y}`),
    "Z",
  ].join(" ");

  return (
    <div className="weather-chart">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F2994A" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#56CCF2" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Gradient fill between lines */}
        <path d={areaPath} fill="url(#tempGradient)" />

        {/* High temperature line */}
        <polyline
          points={highLine}
          fill="none"
          stroke="#F2994A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Low temperature line (dashed) */}
        <polyline
          points={lowLine}
          fill="none"
          stroke="#56CCF2"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 3"
        />

        {/* Data points and labels for highs */}
        {highPoints.map((p, i) => (
          <g key={`h-${i}`}>
            <circle cx={p.x} cy={p.y} r="3" fill="#F2994A" />
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              fill="#F2994A"
              fontSize="11"
              fontWeight="600"
            >
              {Math.round(p.t)}°
            </text>
          </g>
        ))}

        {/* Data points and labels for lows */}
        {lowPoints.map((p, i) => (
          <g key={`l-${i}`}>
            <circle cx={p.x} cy={p.y} r="3" fill="#56CCF2" />
            <text
              x={p.x}
              y={p.y + 18}
              textAnchor="middle"
              fill="#56CCF2"
              fontSize="11"
              fontWeight="600"
            >
              {Math.round(p.t)}°
            </text>
          </g>
        ))}

        {/* Day labels at bottom */}
        {days.map((day, i) => {
          const date = new Date(day.datetime);
          const dayName = i === 0 ? "Heute" : DAY_NAMES[date.getDay()];
          const x = padding.left + i * xStep;
          return (
            <text
              key={`day-${i}`}
              x={x}
              y={height - 8}
              textAnchor="middle"
              fill="var(--dh-gray100)"
              fontSize="11"
              fontWeight="500"
              opacity="0.6"
            >
              {dayName}
            </text>
          );
        })}

        {/* Weather icons at top */}
        {days.map((day, i) => {
          const x = padding.left + i * xStep;
          return (
            <foreignObject key={`icon-${i}`} x={x - 12} y={2} width={24} height={24}>
              <WeatherIcon condition={day.condition} size={24} />
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}
