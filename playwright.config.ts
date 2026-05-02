import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/** Default 3010 avoids clashing with a developer’s unrelated process on 3000 (wrong server → 404 on /api/*). */
function loadDotEnvIfPresent(fileName: string) {
  try {
    const p = path.join(process.cwd(), fileName);
    if (!fs.existsSync(p)) return;
    const raw = fs.readFileSync(p, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key && process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    // Best-effort: never fail config load due to env file parsing.
  }
}

// Local-only credentials for real-user Playwright projects.
loadDotEnvIfPresent(".env.e2e.local");

const port = process.env.PLAYWRIGHT_PORT ?? "3010";
// Prefer localhost over 127.0.0.1: Supabase auth cookies often align with "localhost", and mixing hostnames breaks storageState replay.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
const webServerEnv = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== undefined)
) as Record<string, string>;

const authDir = path.join(process.cwd(), "playwright", ".auth");
const jobseekerState = path.join(authDir, "jobseeker.json");
const recruiterState = path.join(authDir, "recruiter.json");

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
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },

    // Real-user mode (opt-in). Setup project writes storageState files; dependent projects reuse them.
    {
      name: "real-setup",
      testMatch: ["e2e/auth/real-login.setup.ts"],
      // Allow SW during login so cookie/session wiring matches normal browsers (global default blocks SW).
      use: { ...devices["Desktop Chrome"], serviceWorkers: "allow" },
    },
    {
      name: "real-jobseeker-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/jobseeker.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: jobseekerState },
    },
    {
      name: "real-recruiter-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/recruiter.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: recruiterState },
    },
    {
      name: "real-jobseeker-mobile",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/jobseeker.real.spec.ts"],
      // Use Chromium with mobile emulation to avoid requiring WebKit install locally.
      use: { ...devices["iPhone 12"], browserName: "chromium", storageState: jobseekerState },
    },
    {
      name: "real-recruiter-mobile",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/recruiter.real.spec.ts"],
      use: { ...devices["iPhone 12"], browserName: "chromium", storageState: recruiterState },
    },
    {
      name: "real-marketplace-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/marketplace.real.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "real-public-dynamic-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/public-dynamic.real.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "real-messages-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/messages.real.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "real-recruiter-candidates-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/recruiter-candidates.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: recruiterState },
    },
    {
      name: "real-recruiter-job-ai-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/recruiter-job-ai.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: recruiterState },
    },
    {
      name: "real-jobseeker-auto-smart-apply-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/jobseeker-auto-smart-apply.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: jobseekerState },
    },
    {
      name: "real-jobseeker-cover-letter-improve-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/jobseeker-cover-letter-improve.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: jobseekerState },
    },
    {
      name: "real-jobseeker-jobmatch-tailor-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/job-match-tailor.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: jobseekerState },
    },
    {
      name: "real-jobseeker-linkedin-import-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/linkedin-import.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: jobseekerState },
    },
    {
      name: "real-onboarding-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/onboarding.real.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "real-jobseeker-sitewide-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/jobseeker-sitewide.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: jobseekerState },
    },
    {
      name: "real-recruiter-sitewide-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/recruiter-sitewide.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: recruiterState },
    },
    {
      name: "real-jobseeker-settings-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/jobseeker-settings.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: jobseekerState },
    },
    {
      name: "real-recruiter-templates-alerts-invites-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/recruiter-templates-alerts-invites.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: recruiterState },
    },
    {
      name: "real-recruiter-jobs-crud-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/recruiter-jobs-crud.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: recruiterState },
    },
    {
      name: "real-recruiter-job-edit-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/recruiter-job-edit.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: recruiterState },
    },
    {
      name: "real-recruiter-applications-ui-stage-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/recruiter-applications-ui-stage.real.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "real-jobseeker-resume-builder-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/jobseeker-resume-builder.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: jobseekerState },
    },
    {
      name: "real-recruiter-invite-accept-ui-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/recruiter-invite-accept-ui.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: recruiterState },
    },
    {
      name: "real-jobseeker-history-drilldown-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/jobseeker-history-drilldown.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: jobseekerState },
    },
    {
      name: "real-jobseeker-messages-readsync-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/jobseeker-messages-readsync.real.spec.ts"],
      use: { ...devices["Desktop Chrome"], storageState: jobseekerState },
    },
    {
      name: "real-route-inventory-static-render-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/route-inventory-static-render.real.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "real-ui-stability-jobseeker-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/ui-stability.real.spec.ts"],
      grep: /jobseeker key routes/,
      use: { ...devices["Desktop Chrome"], storageState: jobseekerState },
    },
    {
      name: "real-ui-stability-recruiter-desktop",
      dependencies: ["real-setup"],
      testMatch: ["e2e/real/ui-stability.real.spec.ts"],
      grep: /recruiter key routes/,
      use: { ...devices["Desktop Chrome"], storageState: recruiterState },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: `npx next dev -p ${port}`,
        url: baseURL,
        // Must be false so we do not attach to an old `next dev` missing E2E_MOCK_AUTH / secret.
        reuseExistingServer: false,
        timeout: 180_000,
        env: webServerEnv,
      },
});
