// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['list'],
    ['junit', { outputFile: 'test-results/junit/results.xml' }],
    ['html',  { outputFolder: 'html-report', open: 'never' }]
  ],

  use: {
    baseURL: 'http://localhost:5500',
    headless: true,
    trace: 'on-first-retry',
    outputDir: 'test-results',
  },

  webServer: {
    command: 'npm run dev:ci',
    port: 5500,
    reuseExistingServer: true,
    timeout: 120_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
});
