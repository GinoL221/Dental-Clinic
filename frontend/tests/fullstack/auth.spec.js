// Full-stack auth journey (task 3.2). Always a fresh UI login via the plain,
// unauthenticated `page` fixture — this is the explicit login test that
// auth.setup.js's reusable sessions are never allowed to bypass (design.md).
import { test, expect, backendUrl, readAuthToken } from "./fixtures/e2e.js";
import { LoginPage } from "./pages/login.js";
import { DashboardPage } from "./pages/dashboard.js";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "";

test("valid admin login redirects to /dashboard and shows seeded backend data", async ({
  page,
}) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  await expect(page).toHaveURL(/\/dashboard$/);

  // Seeded by E2eDataInitializer: one admin, one dentist, one patient, one
  // appointment. Real counts, never the withDefaults()/zero-fallback shape;
  // use >= 1 for appointments and patients because cross-browser runs share
  // the same live H2 backend after register.spec.js / booking.spec.js.
  const dashboard = new DashboardPage(page);
  const stats = await dashboard.stats();
  expect(stats.totalAppointments).toBeGreaterThanOrEqual(1);
  expect(stats.totalDentists).toBeGreaterThanOrEqual(1);
  expect(stats.totalPatients).toBeGreaterThanOrEqual(1);
  await expect(dashboard.upcomingAppointmentItems().first()).toBeVisible();
  await expect(dashboard.emptyUpcomingMessage()).toHaveCount(0);
});

test("invalid login is rejected and dashboard access is not granted", async ({
  page,
}) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login("wrong@e2e.dentalclinic.test", "WrongPassword1!");
  await expect(page).toHaveURL(/\/login$/);
  await expect(login.errorMessage()).toBeVisible();
  await expect(login.errorMessage()).toContainText("Credenciales incorrectas");
});

test("/login?registered=true shows success banner and password toggle swaps aria-pressed and type", async ({
  page,
}) => {
  await page.goto("/login?registered=true");

  const successBanner = page.locator(".alert-success");
  await expect(successBanner).toBeVisible();
  await expect(successBanner).toContainText(
    "Cuenta creada correctamente. Ya podés iniciar sesión.",
  );

  const passwordInput = page.locator("#password");
  const toggle = page.locator("#password + .btn-eye-toggle");
  await expect(passwordInput).toHaveAttribute("type", "password");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await toggle.click();
  await expect(passwordInput).toHaveAttribute("type", "text");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await toggle.click();
  await expect(passwordInput).toHaveAttribute("type", "password");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
});

test("patient created with blank password gets temporary password, is forced to change it, and can then navigate freely", async ({
  adminPage,
  page,
}) => {
  const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `e2e.temp.${uniqueSuffix}@dentalclinic.test`;
  const dni = String(20_000_000 + Math.floor(Math.random() * 79_999_999));

  await adminPage.goto("/patients/add");
  await adminPage.fill("#cardIdentity", dni);
  await adminPage.fill("#firstName", "TempPassword");
  await adminPage.fill("#lastName", "User");
  await adminPage.fill("#email", email);
  await adminPage.click('.auth-form button[type="submit"]');

  const tempPasswordEl = adminPage.locator("#temporary-password-value");
  await expect(tempPasswordEl).toBeVisible();
  const tempPassword = (await tempPasswordEl.textContent())?.trim() || "";
  expect(tempPassword.length).toBeGreaterThanOrEqual(8);

  try {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(email, tempPassword);

    await expect(page).toHaveURL(/\/users\/change-password$/);
    await expect(page.locator(".privacy-notice.auth-notice")).toContainText(
      "Cambio obligatorio",
    );

    const newPassword = `NewPass!${uniqueSuffix.slice(-6)}`;
    await page.fill("#currentPassword", tempPassword);
    await page.fill("#newPassword", newPassword);
    await page.fill("#confirmPassword", newPassword);
    await page.click('.auth-form button[type="submit"]');

    await expect(page).toHaveURL(/\/appointments$/);

    await page.goto("/");
    await expect(page).not.toHaveURL(/\/users\/change-password/);
  } finally {
    const adminToken = await readAuthToken(adminPage);
    if (adminToken) {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const listRes = await adminPage.request.get(
        `${backendUrl()}/api/patients`,
        { headers },
      );
      if (listRes.ok()) {
        const patients = await listRes.json();
        const created = Array.isArray(patients)
          ? patients.find((/** @type {any} */ p) => p.email === email)
          : null;
        if (created?.id) {
          await adminPage.request.delete(
            `${backendUrl()}/api/patients/${created.id}`,
            { headers },
          );
        }
      }
    }
  }
});
