import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: isCI ? 2 : 1,
  forbidOnly: isCI,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    // Chrome système en local ; Chromium Playwright en CI
    ...(isCI ? {} : { channel: 'chrome' as const }),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: isCI
    ? [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
    : undefined,
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !isCI,
    timeout: 120000,
  },
})
