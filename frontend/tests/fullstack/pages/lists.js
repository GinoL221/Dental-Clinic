// Shared page object for the three mobile-responsive list pages
// (/patients, /dentists, /appointments). design.md verified all three share
// the identical table-container/table/thead/tbody/tr/td shape and differ
// only in route and column count, so one class covers all three rather than
// three near-duplicate page objects.
export class ListPage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} route e.g. '/patients'
   */
  constructor(page, route) {
    this.page = page;
    this.route = route;
  }

  async goto() {
    await this.page.goto(this.route);
  }

  tableContainer() {
    return this.page.locator('.table-container');
  }

  table() {
    return this.tableContainer().locator('table');
  }

  thead() {
    return this.table().locator('thead');
  }

  headerCells() {
    return this.thead().locator('th');
  }

  searchInput() {
    return this.page.locator('.list-search-input');
  }

  rows() {
    return this.table().locator('tbody tr');
  }

  /** @param {number} index */
  row(index) {
    return this.rows().nth(index);
  }

  /**
   * @param {number} rowIndex
   * @param {string} label byte-identical to the column's <th> text
   */
  cellByLabel(rowIndex, label) {
    return this.row(rowIndex).locator(`td[data-label="${label}"]`);
  }

  /** The "No se encontraron..." block shown when the search matches zero rows. */
  emptyState() {
    return this.page.locator('.text-center.py-5', { hasText: 'No se encontraron' });
  }
}
