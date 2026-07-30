import { defineConfig, devices } from '@playwright/test';

// Mock mode: fast feedback against tests/mock-backend.js, never full-stack
// evidence. Kept fully independent from playwright.fullstack.config.js
// (task 2.8) — no shared webServer, no shared testDir, and the project name
// below labels results as mock so they are never confused with full-stack
// runs in a merged report.
export default defineConfig({
  webServer: [
    {
      command: 'node tests/mock-backend.js',
      port: 8080,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run build && npm run preview',
      port: 4173,
      reuseExistingServer: !process.env.CI,
      env: {
        BACKEND_URL: 'http://localhost:8080',
      },
    },
  ],
  testDir: 'tests',
  testIgnore: '**/fullstack/**',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'mock-chromium', use: { ...devices['Desktop Chrome'] } }],
});
