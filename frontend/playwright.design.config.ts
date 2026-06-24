import { defineConfig } from "@playwright/test";

/**
 * Dedicated config for the Apple-design screenshot harness.
 *
 * Uses the full `chromium` channel (chromium-1217, new headless mode) which is
 * already installed, avoiding a dependency on the separate headless-shell build.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "design-shots.spec.ts",
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    channel: "chromium",
    trace: "off",
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
