import { defineConfig, devices } from '@playwright/test';

// Full-stack mode: the process runner (tests/fullstack/run-fullstack.js)
// starts and tears down the real backend/frontend, so this config does NOT
// declare a `webServer` — that would double-manage the same services and
// silently reintroduce the reuse/readiness gaps the runner exists to close.
// Kept fully independent from playwright.config.js (mock mode, task 2.8):
// separate testDir, separate report/output directories, one worker.
export default defineConfig({
  testDir: 'tests/fullstack',
  testMatch: /.*\.spec\.js/,
  // process-runner.spec.js is a node:test file (task 2.1-2.6), not a
  // Playwright spec: importing 'node:test' auto-runs its tests as a side
  // effect of module evaluation, so it must never be collected here.
  testIgnore: '**/process-runner.spec.js',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report-fullstack', open: 'never' }]],
  outputDir: 'test-results-fullstack',
  use: {
    baseURL: process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'fullstack-chromium', use: { ...devices['Desktop Chrome'] } }],
});
