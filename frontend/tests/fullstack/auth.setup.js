// Produces the role-based storage states via a REAL UI login (never token
// injection — design.md's "Sessions" decision explicitly rejects that).
// Runs once as Playwright's "setup" project (see playwright.fullstack.config.js's
// `dependencies: ['setup']`), before booking.spec.js/authorization.spec.js,
// which reuse these sessions through fixtures/e2e.js's adminPage/nonAdminPage.
import { test as setup } from '@playwright/test';
import fs from 'node:fs';
import { LoginPage } from './pages/login.js';
import { ADMIN_STORAGE_STATE, NON_ADMIN_STORAGE_STATE, AUTH_DIR } from './fixtures/e2e.js';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '';
const NON_ADMIN_EMAIL = process.env.E2E_NON_ADMIN_EMAIL || '';
const NON_ADMIN_PASSWORD = process.env.E2E_NON_ADMIN_PASSWORD || '';

setup('authenticate as admin (ADMIN role, seeded by E2eDataInitializer)', async ({ page }) => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  const login = new LoginPage(page);
  await login.goto();
  await login.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.waitForURL((url) => url.pathname === '/dashboard');
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});

setup(
  'authenticate as non-admin (PATIENT role, seeded by E2eDataInitializer)',
  async ({ page }) => {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    const login = new LoginPage(page);
    await login.goto();
    await login.login(NON_ADMIN_EMAIL, NON_ADMIN_PASSWORD);
    await page.waitForURL((url) => url.pathname === '/');
    await page.context().storageState({ path: NON_ADMIN_STORAGE_STATE });
  },
);
