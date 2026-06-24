import { test, type Page } from "@playwright/test";
import {
  DEMO_STATES,
  DEMO_DISCOVERY,
  DEMO_DASHBOARD,
  DEMO_CONFIG,
  DEMO_HEALTH,
  DEMO_INSIGHTS,
} from "./_design-fixtures";

/**
 * Apple-design screenshot harness.
 *
 * Renders the REAL dashboard fully offline: every /api/* call is intercepted
 * with rich fixtures and the HA WebSocket is mocked (get_states → states_result)
 * so cards render with realistic data. Screenshots land in e2e/__shots__/ and
 * are graded by the UI-pentest agents.
 *
 * Run a single design mode via the SHOT_MODE env var ("apple" | "fiori").
 */

const MODE = (process.env.SHOT_MODE === "fiori" ? "fiori" : "apple") as "apple" | "fiori";
const OUT = "e2e/__shots__";

const json = (body: unknown) => ({
  contentType: "application/json",
  body: JSON.stringify(body),
});

async function setupRoutes(page: Page) {
  await page.route("**/api/auth/status", (r) => r.fulfill(json({ configured: true, mode: "standalone" })));
  await page.route("**/api/config", (r) => r.fulfill(json(DEMO_CONFIG)));
  await page.route("**/api/dashboard", (r) => r.fulfill(json(DEMO_DASHBOARD)));
  await page.route("**/api/discovery", (r) => r.fulfill(json(DEMO_DISCOVERY)));
  await page.route("**/api/health", (r) => r.fulfill(json(DEMO_HEALTH)));
  await page.route("**/api/insights*", (r) => r.fulfill(json(DEMO_INSIGHTS)));
  await page.route("**/api/panel/info", (r) => r.fulfill(json({ is_addon: false, message: "" })));

  // Mock the HA WebSocket: reply to get_states, swallow everything else.
  await page.routeWebSocket(/\/ws$/, (ws) => {
    ws.onMessage((message) => {
      let msg: { type?: string };
      try { msg = JSON.parse(String(message)); } catch { return; }
      if (msg.type === "get_states") {
        ws.send(JSON.stringify({ type: "states_result", result: DEMO_STATES }));
      }
    });
  });

  // Force design mode before any app code runs.
  await page.addInitScript((mode) => {
    localStorage.setItem("dh-design-mode", mode);
  }, MODE);
}

async function gotoDashboard(page: Page) {
  await setupRoutes(page);
  await page.goto("/");
  // Wait for the dashboard chrome + at least one card to render.
  await page.waitForSelector(".bottom-toolbar", { timeout: 15000 });
  await page.waitForSelector(".grid-view__grid", { timeout: 15000 });
  await page.waitForTimeout(1500); // settle animations / lazy chunks
}

test.describe(`design shots [${MODE}]`, () => {
  test("overview desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoDashboard(page);
    await page.screenshot({ path: `${OUT}/${MODE}-overview-desktop.png`, fullPage: true });
  });

  test("overview mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoDashboard(page);
    await page.screenshot({ path: `${OUT}/${MODE}-overview-mobile.png`, fullPage: true });
  });

  test("settings dialog desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoDashboard(page);
    await page.click('[title="Einstellungen"]');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/${MODE}-settings.png` });
  });

  test("weather sheet desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoDashboard(page);
    // Open a popup sheet via the first status-bar weather chip if present.
    const chip = page.locator(".status-chip").first();
    try {
      await chip.click({ timeout: 3000 });
      await page.waitForSelector(".popup-modal__sheet", { timeout: 4000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${OUT}/${MODE}-sheet.png` });
    } catch {
      // No popup chip available — skip gracefully.
    }
  });
});
