import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,

  // 1) Reporters para JUnit e HTML dentro de test-results
  reporter: [
    ['list'],
    ['junit', { outputFile: 'test-results/junit/results.xml' }],
    ['html',  { outputFolder: 'test-results/html-report', open: 'never' }]
  ],

  use: {
    baseURL: 'http://localhost:5500',
    headless: true,
    trace: 'on-first-retry',

    // 2) Capturas / vídeos / traces aqui
    outputDir: 'test-results',
  },

  webServer: {
    command: 'npm run build && npm run preview -- --port 5500',
    port: 5500,
    // Em CI você já roda preview manualmente, então podemos sempre reutilizar
    reuseExistingServer: true,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
});
