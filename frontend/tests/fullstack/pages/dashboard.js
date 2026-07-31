// Page object for /dashboard (frontend/src/routes/dashboard/+page.svelte).
// Reads seeded backend values from the four stats cards and the upcoming
// appointments panel — never a bare heading, per design.md.
export class DashboardPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  /** @param {number} index */
  statsCard(index) {
    return this.page.locator('#stats-cards .card').nth(index).locator('h4');
  }

  async stats() {
    return {
      totalAppointments: Number((await this.statsCard(0).textContent())?.trim() || '0'),
      totalDentists: Number((await this.statsCard(1).textContent())?.trim() || '0'),
      totalPatients: Number((await this.statsCard(2).textContent())?.trim() || '0'),
      todayAppointments: Number((await this.statsCard(3).textContent())?.trim() || '0'),
    };
  }

  upcomingAppointmentItems() {
    return this.page.locator('#upcoming-appointments .appointment-item');
  }

  emptyUpcomingMessage() {
    return this.page.locator('#upcoming-appointments', { hasText: 'No hay citas próximas' });
  }

  filterFromInput() {
    return this.page.locator('#filter-from');
  }

  filterToInput() {
    return this.page.locator('#filter-to');
  }

  filterDentistSelect() {
    return this.page.locator('#filter-dentist');
  }

  applyFiltersButton() {
    return this.page.locator('#apply-filters');
  }

  filterErrorBanner() {
    return this.page.locator('#filter-error');
  }

  refreshButton() {
    return this.page.getByRole('button', { name: /Refrescar/ });
  }

  clearFiltersLink() {
    return this.page.getByRole('link', { name: /Limpiar/ });
  }

  statusChart() {
    return this.page.locator('#statusChart');
  }

  statusChartRendered() {
    return this.page.locator('#statusChart .uplot');
  }

  statusChartEmpty() {
    return this.page.locator('#statusChart-empty');
  }

  dentistChart() {
    return this.page.locator('#dentistChart');
  }

  dentistChartRendered() {
    return this.page.locator('#dentistChart .uplot');
  }

  dentistChartEmpty() {
    return this.page.locator('#dentistChart-empty');
  }

  /**
   * Fills the date-range inputs and submits the filter form, waiting for the
   * resulting navigation (native GET form submission → new URL with the
   * filter query params).
   * @param {{ from?: string, to?: string }} range
   */
  async applyDateRangeFilter({ from, to }) {
    if (from !== undefined) await this.filterFromInput().fill(from);
    if (to !== undefined) await this.filterToInput().fill(to);
    await Promise.all([this.page.waitForURL(/\/dashboard\?/), this.applyFiltersButton().click()]);
  }
}
