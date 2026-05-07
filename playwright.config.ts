import { defineConfig, devices } from "@playwright/test";

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  fullyParallel: true,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  reporter: "./e2e/summary-reporter.ts",
  testDir: "./e2e",
  use: { baseURL: "http://localhost:5173" },
  webServer: {
    command: "pnpm run start:vite",
    reuseExistingServer: !process.env.CI,
    url: "http://localhost:5173",
  },
});
