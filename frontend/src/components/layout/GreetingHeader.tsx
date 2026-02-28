import { useEntitiesByDomain, useEntity } from "@/hooks/useEntity";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Gute Nacht";
  if (hour < 12) return "Guten Morgen";
  if (hour < 18) return "Hallo";
  return "Guten Abend";
}

export function GreetingHeader() {
  const weather = useEntity("weather.forecast_home");
  const lights = useEntitiesByDomain("light");
  const lightsOn = lights.filter((e) => e.state === "on").length;

  const temp = weather?.attributes?.temperature as number | undefined;
  const condition = weather?.state || "";

  return (
    <div style={{ padding: "24px 20px 8px 20px" }}>
      <h1 style={{
        fontSize: 28,
        fontWeight: 700,
        color: "var(--dh-gray100)",
        margin: 0,
      }}>
        {getGreeting()}
      </h1>
      <p style={{
        fontSize: 14,
        color: "var(--dh-gray100)",
        opacity: 0.6,
        margin: "8px 0 0 0",
        lineHeight: 1.6,
      }}>
        {temp !== undefined && (
          <>Draussen ist es {condition} und {temp}&deg;. </>
        )}
        {lightsOn > 0 && (
          <>{lightsOn} {lightsOn === 1 ? "Licht" : "Lichter"} eingeschaltet.</>
        )}
      </p>
    </div>
  );
}
