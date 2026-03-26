import { defineConfig, devices } from "@playwright/test";

/** Default 3010 avoids clashing with a developer’s unrelated process on 3000 (wrong server → 404 on /api/*). */
const port = process.env.PLAYWRIGHT_PORT ?? "3010";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    // Ensures `page.route` sees fetches; SW can intercept before Playwright routing.
    serviceWorkers: "block",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: `npx next dev -p ${port}`,
        url: baseURL,
        // Must be false so we do not attach to an old `next dev` missing E2E_MOCK_AUTH / secret.
        reuseExistingServer: false,
        timeout: 180_000,
        env: { ...process.env },
      },
});
