import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  webServer: [
    {
      command: 'node tests/mock-backend.js',
      port: 8080,
      reuseExistingServer: !process.env.CI
    },
    {
      command: 'npm run build && npm run preview',
      port: 4173,
      reuseExistingServer: !process.env.CI,
      env: {
        BACKEND_URL: 'http://localhost:8080'
      }
    }
  ],
  testDir: 'tests',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
