import { getAllMetadata, type CardMetadata } from "@/components/cards/CardRegistry";

/** Domain → widget types sorted by fit (best first) */
const DOMAIN_WIDGET_RANKING: Record<string, string[]> = {
  light: ["light", "switch", "sensor"],
  switch: ["switch", "input_boolean", "sensor"],
  input_boolean: ["input_boolean", "switch"],
  sensor: ["sensor", "binary_sensor"],
  binary_sensor: ["binary_sensor", "sensor"],
  climate: ["climate", "sensor"],
  media_player: ["media_player"],
  cover: ["cover", "switch"],
  fan: ["fan", "switch"],
  vacuum: ["vacuum"],
  lock: ["lock", "switch"],
  camera: ["camera"],
  weather: ["weather", "sensor"],
  automation: ["automation", "switch"],
  script: ["script", "button"],
  scene: ["scene"],
  button: ["button"],
  input_button: ["button"],
  person: ["person"],
  device_tracker: ["person"],
  timer: ["timer", "sensor"],
  humidifier: ["humidifier", "switch"],
  number: ["number", "sensor"],
  input_number: ["number", "sensor"],
  select: ["select"],
  input_select: ["select"],
  alarm_control_panel: ["alarm"],
  update: ["update", "sensor"],
  calendar: ["calendar", "sensor"],
  group: ["group"],
};

/**
 * Get recommended widgets for a domain, sorted by fit.
 */
export function getRecommendedWidgets(domain: string): CardMetadata[] {
  const ranking = DOMAIN_WIDGET_RANKING[domain] ?? ["sensor"];
  const allMeta = getAllMetadata();
  const metaByType = new Map(allMeta.map((m) => [m.type, m]));

  const result: CardMetadata[] = [];
  for (const type of ranking) {
    const meta = metaByType.get(type);
    if (meta) result.push(meta);
  }

  // Also include any widget that lists this domain as compatible (not already added)
  const seen = new Set(result.map((m) => m.type));
  for (const meta of allMeta) {
    if (!seen.has(meta.type) && meta.compatibleDomains.includes(domain)) {
      result.push(meta);
    }
  }

  return result;
}

/**
 * Get the single best widget type for a domain.
 */
export function getBestWidget(domain: string): string {
  const ranking = DOMAIN_WIDGET_RANKING[domain];
  return ranking?.[0] ?? "sensor";
}
