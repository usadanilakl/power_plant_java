import { defineConfig, devices } from '@playwright/test';
import { config } from './test.config';

/**
 * Playwright configuration for Power Plant Java E2E tests
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  use: {
    // Host of the served app. By default the Spring-Boot-served prod bundle
    // (single port). Per-page navigation goes through BasePage.goto, which
    // also prepends config.angularBasePath, so this is mainly used for
    // Playwright's own response auto-resolution.
    baseURL: config.frontendUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  timeout: 60000,

  expect: {
    timeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
