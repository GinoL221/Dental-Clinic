// Full-stack dashboard filter-controls journey (PR 3, tasks 3.8-3.9). Reuses
// the admin session created by auth.setup.js (adminPage fixture) — auth.spec.js
// already proves login itself. Uses a far-future date range (guaranteed to
// match zero seeded/booked appointments) so these assertions never depend on
// what booking.spec.js or any other spec has created in the shared backend.
import { test, expect } from './fixtures/e2e.js';
import { DashboardPage } from './pages/dashboard.js';

const NO_MATCH_FROM = '2099-01-01';
const NO_MATCH_TO = '2099-01-02';

test('filter round trip via URL params narrows the snapshot and survives a reload', async ({
  adminPage,
}) => {
  const dashboard = new DashboardPage(adminPage);
  await dashboard.goto();

  await dashboard.applyDateRangeFilter({ from: NO_MATCH_FROM, to: NO_MATCH_TO });
  await expect(adminPage).toHaveURL(
    new RegExp(`/dashboard\\?from=${NO_MATCH_FROM}&to=${NO_MATCH_TO}(&dentistId=)?$`),
  );
  const stats = await dashboard.stats();
  expect(stats.totalAppointments).toBe(0);

  // Reload: the filter bar must rehydrate from the URL, not reset.
  await adminPage.reload();
  await expect(dashboard.filterFromInput()).toHaveValue(NO_MATCH_FROM);
  await expect(dashboard.filterToInput()).toHaveValue(NO_MATCH_TO);
  const statsAfterReload = await dashboard.stats();
  expect(statsAfterReload.totalAppointments).toBe(0);
});

test('back button restores the unfiltered dashboard', async ({ adminPage }) => {
  const dashboard = new DashboardPage(adminPage);
  await dashboard.goto();
  await expect(adminPage).toHaveURL(/\/dashboard$/);

  await dashboard.applyDateRangeFilter({ from: NO_MATCH_FROM, to: NO_MATCH_TO });
  await expect(adminPage).toHaveURL(/\/dashboard\?from=/);

  await adminPage.goBack();
  await expect(adminPage).toHaveURL(/\/dashboard$/);
  await expect(dashboard.filterFromInput()).toHaveValue('');
  await expect(dashboard.filterToInput()).toHaveValue('');
});

test('Refrescar preserves the active filter', async ({ adminPage }) => {
  const dashboard = new DashboardPage(adminPage);
  await dashboard.goto();
  await dashboard.applyDateRangeFilter({ from: NO_MATCH_FROM, to: NO_MATCH_TO });
  const filteredUrl = adminPage.url();

  await dashboard.refreshButton().click();
  await expect(adminPage).toHaveURL(filteredUrl);
  await expect(dashboard.filterFromInput()).toHaveValue(NO_MATCH_FROM);
  await expect(dashboard.filterToInput()).toHaveValue(NO_MATCH_TO);
});

test('#filter-error becomes visible on an inverted date range and the page keeps rendering', async ({
  adminPage,
}) => {
  const dashboard = new DashboardPage(adminPage);
  await dashboard.goto();

  await dashboard.applyDateRangeFilter({ from: NO_MATCH_TO, to: NO_MATCH_FROM });
  await expect(dashboard.filterErrorBanner()).toBeVisible();
  await expect(adminPage.locator('#stats-cards')).toBeVisible();
});
