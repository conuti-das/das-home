import type { IconName } from "prince-ui";

/**
 * Bildet die in den Views verwendeten (oft `mdi:`-präfixierten) Icon-Namen auf
 * das begrenzte monochrome prince-ui-Icon-Set ab.
 *
 * prince-ui 0.8.0 liefert nur ein kuratiertes Set (`IconName`). Für Raum-/
 * Dashboard-Navigation reicht eine pragmatische Heuristik: bekannte Schlüssel
 * mappen, sonst sinnvoller Fallback (`building` für Räume, `compass` generisch).
 */
const MAP: Record<string, IconName> = {
  home: "building",
  "view-dashboard": "grid",
  dashboard: "grid",
  grid: "grid",
  star: "heart",
  heart: "heart",
  favorite: "heart",
  fire: "flame",
  flame: "flame",
  "weather-night": "moon",
  moon: "moon",
  "chart-line": "chart",
  chart: "chart",
  cog: "settings",
  settings: "settings",
  menu: "menu",
  account: "user",
  person: "user",
  user: "user",
  "office-building": "building",
  building: "building",
  magnify: "search",
  search: "search",
  plus: "plus",
  flash: "bolt",
  bolt: "bolt",
  alert: "alert",
  bell: "bell",
  mail: "mail",
  email: "mail",
  compass: "compass",
};

/** Liefert einen gültigen prince-ui-Icon-Namen für einen (mdi-)Icon-String. */
export function toPrinceIcon(raw: string | undefined, fallback: IconName = "compass"): IconName {
  if (!raw) return fallback;
  const key = raw.replace(/^mdi:/, "").toLowerCase();
  if (MAP[key]) return MAP[key];
  // Heuristik: alles was nach „Raum/Etage/Zimmer" klingt → building.
  if (/room|floor|etage|zimmer|haus|home|wohn|bad|kuche|kitchen|schlaf|buro|office/.test(key)) {
    return "building";
  }
  return fallback;
}
