import { test, expect } from "@playwright/test";

/**
 * Critical E2E for Home Operations Briefing.
 *
 * Shortcut (per lane brief): instead of driving the Card Picker UI to add
 * the card, we seed a dashboard config that already contains a
 * `home_ops_briefing` card, then intercept the backend endpoints
 * (/api/config, /api/dashboard, /api/auth/status, /api/insights) with
 * fixtures. This proves the *rendering* critical path: browser loads the
 * dashboard, card renders, 4 KPI tiles are visible within 5 seconds.
 *
 * The Card Picker flow is validated by unit tests and can be exercised
 * manually once /plan-design-review polishes the wizard UX.
 */

const INSIGHTS_FIXTURE = {
  generated_at: "2024-01-01T12:00:00+00:00",
  cache_age_seconds: 5,
  kpis: {
    energy_cost_today: {
      value: 2.73,
      unit: "\u20ac",
      available: true,
      entity_id: "sensor.energy_cost",
      trend_7d: [2.1, 2.4, 2.3, 2.5, 2.6, 2.7, 2.73],
      yoy_7d: null,
      anomaly_flag: false,
    },
    occupancy_hours_today: {
      value: 8.5,
      unit: "h",
      available: true,
      entity_id: "binary_sensor.presence",
      trend_7d: [7, 8, 7.5, 9, 8, 8.5, 8.5],
      yoy_7d: null,
      anomaly_flag: false,
    },
    device_uptime_pct: {
      value: 99.7,
      unit: "%",
      available: true,
      entity_id: null,
      trend_7d: [99.5, 99.8, 100, 99.7, 99.9, 99.8, 99.7],
      yoy_7d: null,
      anomaly_flag: false,
    },
    anomaly_count: {
      value: 1,
      unit: "",
      available: true,
      entity_id: null,
      trend_7d: [0, 0, 0, 1, 0, 1, 1],
      yoy_7d: null,
      anomaly_flag: false,
    },
  },
  anomalies: [
    {
      entity_id: "sensor.kitchen_temperature",
      friendly_name: "Kitchen Temperature",
      description: "Ungewohnlich hoch fur Montag (23\u00b0C vs. \u00d8 19\u00b0C)",
      severity: "medium",
      detected_at: "2024-01-01T12:00:00+00:00",
    },
  ],
  trends: {
    energy_daily_7d: Array.from({ length: 7 }, (_, i) => ({
      date: `2024-01-0${i + 1}`,
      value: 2 + i * 0.15,
      yoy_value: 1.8 + i * 0.12,
    })),
  },
  missing_kpis: [],
};

const DASHBOARD_FIXTURE = {
  version: 1,
  theme: "light",
  accent_color: "#0854a0",
  auto_theme: false,
  sidebar_visible: false,
  default_view: "home",
  views: [
    {
      id: "home",
      name: "Home",
      icon: "home",
      type: "grid" as const,
      area: "",
      header: { show_badges: false, badges: [] },
      layout: {},
      sections: [
        {
          id: "main",
          title: "Main",
          icon: "list",
          items: [
            {
              id: "hob-1",
              type: "home_ops_briefing",
              entity: "",
              size: "2x2",
              config: {},
              gridCol: 0,
              gridRow: 0,
              colSpan: 2,
              rowSpan: 2,
            },
          ],
          subsections: [],
        },
      ],
    },
  ],
};

const CONFIG_FIXTURE = {
  version: 1,
  connection: { hass_url: "http://localhost:8123", token_stored: true },
  locale: "de",
  custom_js_enabled: false,
  hacs_cards: [],
  sidebar: {
    width: 280,
    visible: false,
    show_clock: false,
    show_weather: false,
    weather_entity: "",
  },
};

test.describe("HomeOpsBriefing card", () => {
  test("renders 4 KPI tiles within 5 seconds when card is on dashboard", async ({ page }) => {
    // Intercept all backend API calls — we don't need the real backend.
    await page.route("**/api/auth/status", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ configured: true, mode: "standalone" }),
      }),
    );

    await page.route("**/api/config", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(CONFIG_FIXTURE),
      }),
    );

    await page.route("**/api/dashboard", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(DASHBOARD_FIXTURE),
      }),
    );

    await page.route("**/api/insights*", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(INSIGHTS_FIXTURE),
      }),
    );

    // Stub other common endpoints the app may poll
    await page.route("**/api/health", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          version: "0.3.9",
          mode: "standalone",
          releases_url: "",
        }),
      }),
    );
    await page.route("**/api/panel/info", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ is_addon: false, message: "" }),
      }),
    );

    // Block the HA websocket (we don't need it for this test)
    await page.route("**/ws*", (route) => route.abort());

    await page.goto("/");

    // Briefing card should render — be generous with first render (Tremor lazy chunk)
    const briefing = page.getByTestId("hob-briefing");
    await expect(briefing).toBeVisible({ timeout: 10000 });

    // The critical assertion: 4 KPI tiles appear within 5 seconds of card rendering
    const tiles = page.getByTestId("hob-kpi-tile");
    await expect(tiles).toHaveCount(4, { timeout: 5000 });

    // Sanity: KPI labels in German are visible
    await expect(page.getByText("Energiekosten heute")).toBeVisible();
    await expect(page.getByText("Anwesenheit heute")).toBeVisible();
    await expect(page.getByText(/Ger\u00e4te-Uptime/)).toBeVisible();
    // "Anomalien" appears both in a KPI tile label and as a section heading —
    // scope to the KPI grid to be specific.
    await expect(
      page.getByTestId("hob-kpi-grid").getByText("Anomalien"),
    ).toBeVisible();

    // Values from the fixture show up (formatting may round — just check for an integer/decimal
    // match that the fixture data made it through)
    await expect(page.getByText("2.73").first()).toBeVisible();
  });
});
