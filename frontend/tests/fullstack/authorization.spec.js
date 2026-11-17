// Full-stack authorization journeys (task 3.4): unauthenticated redirect, and
// non-admin denial in BOTH the browser and a direct API request — the latter
// proves DashboardController's real @PreAuthorize("hasRole('ADMIN')"), not
// just the SvelteKit route guard (design.md's "Authorization" decision).
import { test, expect, backendUrl, readAuthToken } from "./fixtures/e2e.js";

test("unauthenticated access to a protected route is redirected and exposes no protected data", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("#stats-cards")).toHaveCount(0);
});

test("non-admin access is denied in the browser and the API enforces the same boundary", async ({
  nonAdminPage,
}) => {
  const response = await nonAdminPage.goto("/dashboard");
  expect(response?.status()).toBe(403);
  await expect(nonAdminPage.locator("#stats-cards")).toHaveCount(0);
  await expect(nonAdminPage.locator("h1.error-title")).toHaveText(
    "Acceso denegado",
  );
  await expect(nonAdminPage.locator(".error-message")).toBeVisible();
  await expect(nonAdminPage.locator("a.error-btn-primary")).toHaveText(
    "Volver al inicio",
  );

  const token = await readAuthToken(nonAdminPage);
  const apiResponse = await nonAdminPage.request.get(
    `${backendUrl()}/api/dashboard/snapshot`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  expect(apiResponse.status()).toBe(403);
});

test("unknown route renders SvelteKit 404 error boundary", async ({
  adminPage,
}) => {
  const response = await adminPage.goto("/ruta-inexistente-e2e");
  expect(response?.status()).toBe(404);
  await expect(adminPage.locator("h1.error-title")).toHaveText(
    "Página no encontrada",
  );
  await expect(adminPage.locator(".error-message")).toBeVisible();
  await expect(adminPage.locator("a.error-btn-primary")).toHaveText(
    "Volver al inicio",
  );
});
