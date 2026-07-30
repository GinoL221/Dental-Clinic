// Page object for /appointments (frontend/src/routes/appointments/+page.svelte).
// The list is populated from GET /api/appointments/search; a row's cell order
// is: #, date, time, patient, dentist, description, status, actions.
export class AppointmentsPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/appointments');
  }

  /** @param {string} description */
  rowByDescription(description) {
    return this.page.locator('table tbody tr', { hasText: description });
  }

  /**
   * Reads the rendered date/time/description cells and extracts the numeric
   * id from the row's edit link — never trusts a heading alone.
   * @param {string} description
   */
  async readRow(description) {
    const row = this.rowByDescription(description);
    const cells = row.locator('td');
    const date = (await cells.nth(1).textContent())?.trim() ?? '';
    const time = (await cells.nth(2).textContent())?.trim() ?? '';
    const renderedDescription = (await cells.nth(5).textContent())?.trim() ?? '';
    const editHref = await row.locator('a[href^="/appointments/edit/"]').getAttribute('href');
    const id = editHref ? Number(editHref.split('/').pop()) : null;
    return { date, time, description: renderedDescription, id };
  }
}
