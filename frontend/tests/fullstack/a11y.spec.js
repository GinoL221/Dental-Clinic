// Automated WCAG 2.0/2.1 A/AA accessibility audit across primary routes and
// interactive dialogs using @axe-core/playwright.
import { test, expect, expectNoA11yViolations } from "./fixtures/e2e.js";
import { ListPage } from "./pages/lists.js";

test("public routes (/login and /users/register) have zero WCAG A/AA violations", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.locator("#email")).toBeVisible();
  await expectNoA11yViolations(page);

  await page.goto("/users/register");
  await expect(page.locator("#firstName")).toBeVisible();
  await expectNoA11yViolations(page);
});

test("authenticated admin views (/dashboard, /patients, /dentists, /appointments, /appointments/add) have zero WCAG A/AA violations", async ({
  adminPage,
}) => {
  const routes = [
    "/dashboard",
    "/patients",
    "/dentists",
    "/appointments",
    "/appointments/add",
  ];

  for (const route of routes) {
    await adminPage.goto(route);
    await expect(adminPage.locator("main, h1").first()).toBeVisible();
    await expectNoA11yViolations(adminPage);
  }
});

test("open delete ConfirmDialog has zero WCAG A/AA violations", async ({
  adminPage,
}) => {
  const list = new ListPage(adminPage, "/patients");
  await list.goto();

  await list.row(0).locator('button[title="Eliminar"]').click();
  const dialog = adminPage.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await expectNoA11yViolations(adminPage);

  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(dialog).toBeHidden();
});
