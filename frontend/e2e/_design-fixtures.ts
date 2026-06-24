/**
 * Shared fixtures for the Apple-design screenshot harness.
 *
 * These drive a realistic, offline render of the real dashboard: a rich
 * "overview" view with many card types, plus matching Home-Assistant entity
 * states served over a mocked WebSocket. No backend / no live HA required.
 */

const TS = "2026-06-20T08:30:00+00:00";

interface State {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

function s(
  entity_id: string,
  state: string,
  attributes: Record<string, unknown> = {},
): State {
  return { entity_id, state, attributes, last_changed: TS, last_updated: TS };
}

// ---- Weather forecast helpers ---------------------------------------------
const HOURLY = Array.from({ length: 8 }, (_, i) => ({
  datetime: `2026-06-20T${String(9 + i).padStart(2, "0")}:00:00+00:00`,
  temperature: 18 + Math.round(Math.sin(i / 2) * 6),
  condition: ["sunny", "partlycloudy", "cloudy", "rainy"][i % 4],
  precipitation: i % 4 === 3 ? 1.2 : 0,
}));
const DAILY = Array.from({ length: 5 }, (_, i) => ({
  datetime: `2026-06-2${i}T12:00:00+00:00`,
  temperature: 22 + i,
  templow: 12 + i,
  condition: ["sunny", "partlycloudy", "rainy", "cloudy", "sunny"][i],
}));

export const DEMO_STATES: State[] = [
  s("sun.sun", "above_horizon"),

  // Weather
  s("weather.home", "partlycloudy", {
    friendly_name: "Zuhause",
    temperature: 21,
    apparent_temperature: 20,
    humidity: 54,
    wind_speed: 9,
    pressure: 1014,
    forecast: HOURLY,
    temperature_unit: "°C",
  }),

  // Lights
  s("light.wohnzimmer", "on", { friendly_name: "Wohnzimmer", brightness: 204, supported_color_modes: ["brightness"] }),
  s("light.stehlampe", "on", { friendly_name: "Stehlampe", brightness: 110, supported_color_modes: ["brightness"] }),
  s("light.kueche", "on", { friendly_name: "Küche", brightness: 230, supported_color_modes: ["brightness"] }),
  s("light.schlafzimmer", "off", { friendly_name: "Schlafzimmer", supported_color_modes: ["brightness"] }),
  s("light.flur", "on", { friendly_name: "Flur", brightness: 70, supported_color_modes: ["brightness"] }),
  s("light.bad", "off", { friendly_name: "Bad" }),

  // Climate
  s("climate.wohnzimmer", "heat", {
    friendly_name: "Heizung Wohnzimmer",
    temperature: 21.5,
    current_temperature: 20.8,
    hvac_action: "heating",
    hvac_modes: ["off", "heat", "auto"],
    min_temp: 7,
    max_temp: 28,
    target_temp_step: 0.5,
  }),

  // Sensors
  s("sensor.aussentemperatur", "12.4", { friendly_name: "Außentemperatur", unit_of_measurement: "°C", device_class: "temperature" }),
  s("sensor.luftfeuchtigkeit", "54", { friendly_name: "Luftfeuchtigkeit", unit_of_measurement: "%", device_class: "humidity" }),
  s("sensor.energie_heute", "8.2", { friendly_name: "Energie heute", unit_of_measurement: "kWh", device_class: "energy", state_class: "total_increasing" }),
  s("sensor.co2_wohnzimmer", "612", { friendly_name: "CO₂ Wohnzimmer", unit_of_measurement: "ppm", device_class: "carbon_dioxide" }),
  s("sensor.restmuell", "23.06.2026", { friendly_name: "Restmüll" }),

  // Media
  s("media_player.sonos_wohnzimmer", "playing", {
    friendly_name: "Sonos Wohnzimmer",
    media_title: "Bohemian Rhapsody",
    media_artist: "Queen",
    media_album_name: "A Night at the Opera",
    volume_level: 0.42,
    media_content_type: "music",
    supported_features: 152511,
  }),

  // Cover
  s("cover.rollladen_wohnzimmer", "open", { friendly_name: "Rollladen Wohnzimmer", current_position: 70, device_class: "shutter", supported_features: 15 }),

  // Security / misc small
  s("lock.haustuer", "locked", { friendly_name: "Haustür" }),
  s("person.max", "home", { friendly_name: "Max" }),
  s("switch.kaffeemaschine", "on", { friendly_name: "Kaffeemaschine" }),
  s("scene.guten_morgen", "scening", { friendly_name: "Guten Morgen" }),
  s("fan.schlafzimmer", "off", { friendly_name: "Ventilator Schlafzimmer", percentage: 0 }),
];

export const DEMO_DISCOVERY = {
  areas: [
    { area_id: "wohnzimmer", name: "Wohnzimmer", picture: null, floor_id: "eg" },
    { area_id: "kueche", name: "Küche", picture: null, floor_id: "eg" },
    { area_id: "schlafzimmer", name: "Schlafzimmer", picture: null, floor_id: "og" },
  ],
  entity_area_map: {
    "light.wohnzimmer": "wohnzimmer",
    "light.stehlampe": "wohnzimmer",
    "climate.wohnzimmer": "wohnzimmer",
    "media_player.sonos_wohnzimmer": "wohnzimmer",
    "light.kueche": "kueche",
    "light.schlafzimmer": "schlafzimmer",
    "fan.schlafzimmer": "schlafzimmer",
  },
};

function card(
  id: string,
  type: string,
  entity: string,
  size: string,
  config: Record<string, unknown> = {},
) {
  const [colSpan, rowSpan] = size.split("x").map((n) => parseInt(n));
  return { id, type, entity, size, config, colSpan, rowSpan };
}

export const DEMO_DASHBOARD = {
  version: 1,
  theme: "sap_horizon_dark",
  accent_color: "#0A84FF",
  auto_theme: false,
  sidebar_visible: false,
  default_view: "overview",
  views: [
    {
      id: "overview",
      name: "Übersicht",
      icon: "home",
      type: "grid" as const,
      area: "",
      header: { show_badges: true, badges: [] },
      layout: {},
      sections: [
        {
          id: "summary",
          title: "Überblick",
          icon: "home",
          items: [
            card("hob", "home_ops_briefing", "", "2x2"),
            card("weather", "weather", "weather.home", "2x2"),
          ],
          subsections: [],
        },
        {
          id: "klima",
          title: "Klima & Energie",
          icon: "temperature",
          items: [
            card("climate", "climate", "climate.wohnzimmer", "2x1"),
            card("temp", "sensor", "sensor.aussentemperatur", "1x1"),
            card("humid", "sensor", "sensor.luftfeuchtigkeit", "1x1"),
            card("energy", "sensor", "sensor.energie_heute", "1x1"),
            card("co2", "sensor", "sensor.co2_wohnzimmer", "1x1"),
          ],
          subsections: [],
        },
        {
          id: "wohnzimmer",
          title: "Wohnzimmer",
          icon: "home",
          items: [
            card("l1", "light", "light.wohnzimmer", "2x1"),
            card("l2", "light", "light.stehlampe", "2x1"),
            card("media", "media_player", "media_player.sonos_wohnzimmer", "2x2"),
            card("cover", "cover", "cover.rollladen_wohnzimmer", "2x1"),
          ],
          subsections: [],
        },
        {
          id: "haus",
          title: "Haus & Sicherheit",
          icon: "shield",
          items: [
            card("lock", "lock", "lock.haustuer", "1x1"),
            card("person", "person", "person.max", "1x1"),
            card("kaffee", "switch", "switch.kaffeemaschine", "1x1"),
            card("scene", "scene", "scene.guten_morgen", "1x1"),
          ],
          subsections: [],
        },
      ],
    },
  ],
};

export const DEMO_CONFIG = {
  version: 1,
  connection: { hass_url: "http://localhost:8123", token_stored: true },
  locale: "de",
  custom_js_enabled: false,
  hacs_cards: [],
  sidebar: { width: 280, visible: false, show_clock: true, show_weather: true, weather_entity: "weather.home" },
};

export const DEMO_HEALTH = { status: "ok", version: "0.7.1", mode: "standalone", releases_url: "https://github.com/conuti-das/das-home/releases" };

export const DEMO_INSIGHTS = {
  generated_at: TS,
  cache_age_seconds: 5,
  kpis: {
    energy_cost_today: { value: 2.73, unit: "€", available: true, entity_id: "sensor.energie_heute", trend_7d: [2.1, 2.4, 2.3, 2.5, 2.6, 2.7, 2.73], yoy_7d: null, anomaly_flag: false },
    occupancy_hours_today: { value: 8.5, unit: "h", available: true, entity_id: "person.max", trend_7d: [7, 8, 7.5, 9, 8, 8.5, 8.5], yoy_7d: null, anomaly_flag: false },
    device_uptime_pct: { value: 99.7, unit: "%", available: true, entity_id: null, trend_7d: [99.5, 99.8, 100, 99.7, 99.9, 99.8, 99.7], yoy_7d: null, anomaly_flag: false },
    anomaly_count: { value: 1, unit: "", available: true, entity_id: null, trend_7d: [0, 0, 0, 1, 0, 1, 1], yoy_7d: null, anomaly_flag: false },
  },
  anomalies: [
    { entity_id: "sensor.co2_wohnzimmer", friendly_name: "CO₂ Wohnzimmer", description: "Ungewöhnlich hoch für Montag (612 ppm vs. Ø 480 ppm)", severity: "medium", detected_at: TS },
  ],
  trends: { energy_daily_7d: Array.from({ length: 7 }, (_, i) => ({ date: `2026-06-1${i + 3}`, value: 2 + i * 0.15, yoy_value: 1.8 + i * 0.12 })) },
  missing_kpis: [],
};
