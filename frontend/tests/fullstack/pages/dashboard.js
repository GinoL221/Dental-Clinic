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
}
