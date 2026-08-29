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

// PR 4 — breakdown charts (status/dentist) and the reactive-refill fix.
// The unfiltered/default dashboard always has at least one seeded appointment
// (E2eDataInitializer) plus whatever booking.spec.js has booked, so the
// default view is guaranteed to have both a non-zero status entry and at
// least one active dentist — real rendered data, not just an empty guard.

test('status breakdown chart renders when data exists', async ({ adminPage }) => {
  const dashboard = new DashboardPage(adminPage);
  await dashboard.goto();

  await expect(dashboard.statusChartRendered()).toBeVisible();
  await expect(dashboard.statusChartEmpty()).toHaveCount(0);
  await expect(dashboard.monthlyChartRendered()).toBeVisible();

  const statusLabels = await dashboard.xAxisLabels('statusChart');
  expect(statusLabels).toEqual(['Programada', 'En curso', 'Completada', 'Cancelada']);

  const monthLabels = await dashboard.xAxisLabels('appointmentsChart');
  expect(monthLabels.length).toBeGreaterThan(0);
  expect(new Set(monthLabels).size).toBe(monthLabels.length);
});

test('dentist breakdown chart renders when data exists', async ({ adminPage }) => {
  const dashboard = new DashboardPage(adminPage);
  await dashboard.goto();

  await expect(dashboard.dentistChartRendered()).toBeVisible();
  await expect(dashboard.dentistChartEmpty()).toHaveCount(0);

  const dentistLabels = await dashboard.xAxisLabels('dentistChart');
  expect(dentistLabels.length).toBeGreaterThan(0);
  expect(new Set(dentistLabels).size).toBe(dentistLabels.length);
});

test('an empty breakdown renders the empty state without an uncaught JS error', async ({
  adminPage,
}) => {
  const pageErrors = /** @type {Error[]} */ ([]);
  adminPage.on('pageerror', (err) => pageErrors.push(err));

  const dashboard = new DashboardPage(adminPage);
  await dashboard.goto();

  // A far-future range matches zero appointments, so the dentist breakdown
  // (unlike the status breakdown, which always zero-fills all 4 statuses)
  // is genuinely empty.
  await dashboard.applyDateRangeFilter({ from: NO_MATCH_FROM, to: NO_MATCH_TO });

  await expect(dashboard.dentistChartEmpty()).toBeVisible();
  await expect(dashboard.dentistChart()).toBeHidden();
  await expect(adminPage.locator('#stats-cards')).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('widening a filter that emptied the dentist chart brings it back (reactive-refill fix)', async ({
  adminPage,
}) => {
  const dashboard = new DashboardPage(adminPage);
  await dashboard.goto();
  await expect(dashboard.dentistChartRendered()).toBeVisible();

  // Narrow to a range with zero matches: the chart is destroyed and the
  // empty state takes over.
  await dashboard.applyDateRangeFilter({ from: NO_MATCH_FROM, to: NO_MATCH_TO });
  await expect(dashboard.dentistChartEmpty()).toBeVisible();
  await expect(dashboard.dentistChartRendered()).toHaveCount(0);

  // Widen back to the unfiltered view: the latent defect this design fixes
  // is a reactive block gated on the chart already being non-null, which
  // would leave the chart permanently absent here.
  await Promise.all([adminPage.waitForURL(/\/dashboard$/), dashboard.clearFiltersLink().click()]);
  await expect(dashboard.dentistChartRendered()).toBeVisible();
  await expect(dashboard.dentistChartEmpty()).toHaveCount(0);
});
