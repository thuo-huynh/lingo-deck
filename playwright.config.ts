import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  // Mobile-first app: run as an iPhone-sized touch device.
  projects: [{ name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } }],
  webServer: {
    command: "npx next build && node scripts/e2e-server.mjs",
    url: "http://localhost:3100/login",
    timeout: 300_000,
    reuseExistingServer: false,
  },
});
