// Mobile + desktop breakpoint assertions for the three list pages (PR2,
// slice 3). Runs against the real backend/frontend (mobile-fullstack-chromium
// project, devices['Pixel 5']) via the same adminPage fixture booking.spec.js
// and dashboard.spec.js already use — real seeded data, never mocked.
// design.md's `data-label` <-> <th> parity table is the single source of
// truth this file asserts against.
import { test, expect, ADMIN_STORAGE_STATE } from './fixtures/e2e.js';
import { devices } from '@playwright/test';
import { ListPage } from './pages/lists.js';

const ROUTES = [
  {
    name: 'patients',
    path: '/patients',
    labels: ['#', 'DNI', 'Nombre Completo', 'Email', 'Fecha Admisión', 'Acciones'],
  },
  {
    name: 'dentists',
    path: '/dentists',
    labels: ['#', 'Matrícula', 'Nombre Completo', 'Email', 'Acciones'],
  },
  {
    name: 'appointments',
    path: '/appointments',
    labels: ['#', 'Fecha', 'Hora', 'Paciente', 'Odontólogo', 'Descripción', 'Estado', 'Acciones'],
  },
];

for (const route of ROUTES) {
  test(`${route.name}: page does not overflow horizontally at mobile width`, async ({
    adminPage,
  }) => {
    const list = new ListPage(adminPage, route.path);
    await list.goto();

    const noOverflow = await adminPage.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(noOverflow).toBe(true);
  });

  test(`${route.name}: thead is hidden, "#" cell is hidden, every other cell is visible`, async ({
    adminPage,
  }) => {
    const list = new ListPage(adminPage, route.path);
    await list.goto();

    await expect(list.thead()).toBeHidden();

    const firstRow = list.row(0);
    await expect(firstRow.locator('td[data-label="#"]')).toBeHidden();

    const otherCells = firstRow.locator('td:not([data-label="#"])');
    const otherCellCount = await otherCells.count();
    expect(otherCellCount).toBe(route.labels.length - 1);
    for (let i = 0; i < otherCellCount; i++) {
      await expect(otherCells.nth(i)).toBeVisible();
    }
  });

  test(`${route.name}: the first non-"#" column label is rendered via ::before, not textContent`, async ({
    adminPage,
  }) => {
    const list = new ListPage(adminPage, route.path);
    await list.goto();

    const firstLabel = route.labels[1];
    const cell = list.cellByLabel(0, firstLabel);

    const beforeContent = await cell.evaluate((el) => window.getComputedStyle(el, '::before').content);
    expect(beforeContent).toBe(`"${firstLabel}"`);

    // Pseudo-element content is invisible to textContent — the label text
    // must not silently duplicate into the real DOM text (this failed for a
    // real reason above with a naive textContent-only check; see PR2 apply-progress).
    const textContent = (await cell.textContent()) ?? '';
    expect(textContent.trim().startsWith(firstLabel)).toBe(false);
  });

  test(`${route.name}: every td[data-label] matches its column's <th> text exactly`, async ({
    adminPage,
  }) => {
    const list = new ListPage(adminPage, route.path);
    await list.goto();

    const headerCells = list.headerCells();
    const headerCount = await headerCells.count();
    expect(headerCount).toBe(route.labels.length);

    const firstRow = list.row(0);
    const dataCells = firstRow.locator('td');
    const dataCellCount = await dataCells.count();
    expect(dataCellCount).toBe(route.labels.length);

    for (let i = 0; i < headerCount; i++) {
      const thText = (await headerCells.nth(i).textContent())?.trim();
      const tdLabel = await dataCells.nth(i).getAttribute('data-label');
      expect(tdLabel).toBe(thText);
    }
  });

  test(`${route.name}: ARIA table/rowgroup/row/cell roles are present and counted correctly`, async ({
    adminPage,
  }) => {
    const list = new ListPage(adminPage, route.path);
    await list.goto();

    await expect(adminPage.getByRole('table')).toHaveCount(1);
    await expect(adminPage.getByRole('rowgroup')).toHaveCount(1);

    const rowCount = await list.rows().count();
    expect(rowCount).toBeGreaterThan(0);
    await expect(adminPage.getByRole('row')).toHaveCount(rowCount);

    // The "#" cell carries role="cell" but is display:none on mobile, so it
    // is pruned from the accessibility tree — one fewer cell per row than
    // the raw label count (a real finding, not an off-by-one bug: see PR2
    // apply-progress).
    const expectedCellCount = rowCount * (route.labels.length - 1);
    await expect(adminPage.getByRole('cell')).toHaveCount(expectedCellCount);
  });

  test(`${route.name}: edit link and delete button are each at least 44x44 (WCAG 2.5.5 AAA touch target)`, async ({
    adminPage,
  }) => {
    const list = new ListPage(adminPage, route.path);
    await list.goto();

    const firstRow = list.row(0);
    const editLink = firstRow.locator('a[title="Editar"]');
    const deleteButton = firstRow.locator('button[title="Eliminar"]');

    const editBox = await editLink.boundingBox();
    const deleteBox = await deleteButton.boundingBox();

    expect(editBox).not.toBeNull();
    expect(deleteBox).not.toBeNull();
    expect(editBox?.width).toBeGreaterThanOrEqual(44);
    expect(editBox?.height).toBeGreaterThanOrEqual(44);
    expect(deleteBox?.width).toBeGreaterThanOrEqual(44);
    expect(deleteBox?.height).toBeGreaterThanOrEqual(44);
  });

  test(`${route.name}: delete confirmation dialog fires and dismissing it never mutates the row`, async ({
    adminPage,
  }) => {
    const list = new ListPage(adminPage, route.path);
    await list.goto();

    const rowCountBefore = await list.rows().count();
    let dialogFired = false;
    adminPage.once('dialog', (dialog) => {
      dialogFired = true;
      dialog.dismiss();
    });

    await list.row(0).locator('button[title="Eliminar"]').click();
    await adminPage.waitForTimeout(300);

    expect(dialogFired).toBe(true);
    await expect(list.rows()).toHaveCount(rowCountBefore);
  });

  test(`${route.name}: a no-match search shows the empty state with no page overflow`, async ({
    adminPage,
  }) => {
    const list = new ListPage(adminPage, route.path);
    await list.goto();

    await list.searchInput().fill('zzz-no-such-match-zzz');

    await expect(list.emptyState()).toBeVisible();
    await expect(list.table()).toHaveCount(0);

    const noOverflow = await adminPage.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(noOverflow).toBe(true);
  });
}

// Desktop-reset-context checks (task 3.9/3.10), inside this same mobile
// project. browser.newContext() inherits the resolved `use` of the project
// it runs in (proven today by adminPage/nonAdminPage — fixtures/e2e.js), so
// a context created here would silently keep isMobile:true unless the
// Desktop Chrome preset is spread to reset it explicitly (design.md).
for (const route of ROUTES) {
  test(`${route.name}: desktop context (reset from mobile project) keeps the table layout, scroll fallback, and no mobile-only CSS`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      ...devices['Desktop Chrome'],
      storageState: ADMIN_STORAGE_STATE,
    });
    const page = await context.newPage();
    const list = new ListPage(page, route.path);
    await list.goto();

    const overflowX = await list.tableContainer().evaluate((el) => getComputedStyle(el).overflowX);
    expect(overflowX).toBe('auto');

    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(noOverflow).toBe(true);

    await expect(list.thead()).toBeVisible();

    const firstLabel = route.labels[1];
    const cell = list.cellByLabel(0, firstLabel);
    const beforeContent = await cell.evaluate((el) => getComputedStyle(el, '::before').content);
    expect(beforeContent).toBe('none');

    // spec.md requires table/row/cell roles present at BOTH widths, not
    // just mobile. Unlike the mobile assertion, nothing is display:none here
    // (thead is visible), so native <thead>/<tr> implicit ARIA roles now
    // also count: <thead> is an implicit rowgroup (+1) and its <tr> is an
    // implicit row (+1) — neither carries an explicit role, by design (only
    // tbody/its rows do), but implicit roles are real and Playwright's
    // getByRole reports them once no longer pruned by display:none. Header
    // <th> cells map to columnheader, not cell, so the cell count is
    // unaffected.
    await expect(page.getByRole('table')).toHaveCount(1);
    await expect(page.getByRole('rowgroup')).toHaveCount(2);
    const rowCount = await list.rows().count();
    await expect(page.getByRole('row')).toHaveCount(rowCount + 1);
    await expect(page.getByRole('cell')).toHaveCount(rowCount * route.labels.length);

    await context.close();
  });
}
