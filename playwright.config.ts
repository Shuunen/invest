import { defineConfig, devices } from '@playwright/test'

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  fullyParallel: true,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chromium-headless-shell' } }],
  reporter: './e2e/summary-reporter.ts',
  testDir: './e2e',
  // the service worker of the PWA would intercept the requests of every test
  use: { baseURL: 'http://localhost:5273', serviceWorkers: 'block' },
  webServer: {
    // the built app, bundled and served as static files, is much lighter than the unbundled dev server for 8 browsers
    command: 'pnpm run preview --port 5273 --strictPort',
    reuseExistingServer: !process.env.CI,
    url: 'http://localhost:5273',
  },
})
