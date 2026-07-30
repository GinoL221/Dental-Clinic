// Full-stack auth journey (task 3.2). Always a fresh UI login via the plain,
// unauthenticated `page` fixture — this is the explicit login test that
// auth.setup.js's reusable sessions are never allowed to bypass (design.md).
import { test, expect } from './fixtures/e2e.js';
import { LoginPage } from './pages/login.js';
import { DashboardPage } from './pages/dashboard.js';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '';

test('valid admin login redirects to /dashboard and shows seeded backend data', async ({
  page,
}) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  await expect(page).toHaveURL(/\/dashboard$/);

  // Seeded by E2eDataInitializer: one admin, one dentist, one patient, one
  // appointment. Real counts, never the withDefaults()/zero-fallback shape.
  const dashboard = new DashboardPage(page);
  const stats = await dashboard.stats();
  expect(stats.totalAppointments).toBeGreaterThanOrEqual(1);
  expect(stats.totalDentists).toBe(1);
  expect(stats.totalPatients).toBe(1);
  await expect(dashboard.upcomingAppointmentItems().first()).toBeVisible();
  await expect(dashboard.emptyUpcomingMessage()).toHaveCount(0);
});

test('invalid login is rejected and dashboard access is not granted', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('wrong@e2e.dentalclinic.test', 'WrongPassword1!');
  await expect(page).toHaveURL(/\/login$/);
  await expect(login.errorMessage()).toBeVisible();
  await expect(login.errorMessage()).toContainText('Credenciales incorrectas');
});
