import { defineConfig } from "@playwright/test";

/**
 * Playwright config for home-ops-briefing E2E.
 *
 * We do NOT spin up the backend — the single critical path test intercepts
 * all /api/* calls via page.route() and serves fixtures, so we only need
 * the Vite dev server for the frontend bundle.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm dev",
      port: 3000,
      reuseExistingServer: true,
      timeout: 60000,
    },
  ],
});
