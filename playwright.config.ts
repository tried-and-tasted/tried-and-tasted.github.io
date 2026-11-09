import { defineConfig, devices } from '@playwright/test';

const port = 4329;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'] } }],
  // Test the built site (what gets published), not the dev server. CI builds in an earlier step.
  webServer: {
    command: process.env.CI ? `npm run preview -- --port ${port} --ignore-lock` : `npm run build && npm run preview -- --port ${port} --ignore-lock`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
