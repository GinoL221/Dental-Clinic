// Page object for /appointments/add (frontend/src/routes/appointments/add/+page.svelte).
export class BookingPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/appointments/add');
  }

  /** @param {string} text — substring of the option's visible label */
  async selectPatientContaining(text) {
    const value = await this.page
      .locator('#patientSelect option', { hasText: text })
      .getAttribute('value');
    await this.page.selectOption('#patientSelect', value ?? '');
  }

  /** @param {string} text — substring of the option's visible label */
  async selectDentistContaining(text) {
    const value = await this.page
      .locator('#dentistId option', { hasText: text })
      .getAttribute('value');
    await this.page.selectOption('#dentistId', value ?? '');
  }

  /** @param {{ date: string, time: string, description: string }} slot */
  async fillSlot({ date, time, description }) {
    await this.page.fill('#appointmentDate', date);
    await this.page.fill('#appointmentTime', time);
    await this.page.fill('#description', description);
  }

  async submit() {
    // Scoped to the booking form: an authenticated navbar also renders a
    // `button[type="submit"]` (the logout form in +layout.svelte's user
    // dropdown), which an unscoped selector matches ambiguously.
    await this.page.click('form.auth-form button[type="submit"]');
  }

  errorMessage() {
    return this.page.locator('.alert-danger');
  }
}
