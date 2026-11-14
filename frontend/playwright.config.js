import { defineConfig, devices } from "@playwright/test";

const BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT || 8080);
const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT || 4173);

// Mock mode: fast feedback against tests/mock-backend.js, never full-stack
// evidence. Kept fully independent from playwright.fullstack.config.js
// (task 2.8) — no shared webServer, no shared testDir, and the project name
// below labels results as mock so they are never confused with full-stack
// runs in a merged report.
export default defineConfig({
  webServer: [
    {
      command: "node tests/mock-backend.js",
      port: BACKEND_PORT,
      reuseExistingServer: false,
      env: {
        E2E_BACKEND_PORT: String(BACKEND_PORT),
      },
    },
    {
      command: `npm run build && npm run preview -- --port ${FRONTEND_PORT}`,
      port: FRONTEND_PORT,
      reuseExistingServer: false,
      env: {
        BACKEND_URL: `http://127.0.0.1:${BACKEND_PORT}`,
      },
    },
  ],
  retries: process.env.CI ? 2 : 0,
  testDir: "tests",
  testMatch: /.*\.spec\.js/,
  testIgnore: "**/fullstack/**",
  use: {
    baseURL: `http://127.0.0.1:${FRONTEND_PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "mock-chromium", use: { ...devices["Desktop Chrome"] } }],
});
