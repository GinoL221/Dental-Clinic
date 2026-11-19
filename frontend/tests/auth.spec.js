import { test, expect } from "@playwright/test";

const BACKEND_URL = `http://127.0.0.1:${process.env.E2E_BACKEND_PORT || 8080}`;

test.describe("Autenticación E2E", () => {
  test("Inicio de sesión exitoso redirige al dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "admin@dentalclinic.com");
    await page.fill("#password", "Admin123!");
    await page.click('button[type="submit"]');

    // Debería redirigir a /dashboard o /
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator("h1")).toContainText("Dashboard");

    // La sesión se resuelve vía GET /api/auth/me: el nombre y el email
    // públicos del perfil deben renderizarse en el layout autenticado.
    await expect(page.locator(".user-dropdown")).toContainText(
      "Bienvenido/a, Admin",
    );
    await expect(page.locator(".user-dropdown")).toContainText(
      "admin@dentalclinic.com",
    );
  });

  test("Inicio de sesión fallido muestra mensaje de error", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill("#email", "wrong@dentalclinic.com");
    await page.fill("#password", "wrongpassword");
    await page.click('button[type="submit"]');

    // Debería permanecer en /login y mostrar alerta de error
    await expect(page).toHaveURL(/.*login/);
    const alert = page.locator(".alert-danger");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Credenciales incorrectas");
  });

  test("El perfil de sesión no expone el JWT ni datos sensibles al cliente", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill("#email", "admin@dentalclinic.com");
    await page.fill("#password", "Admin123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // GET /api/auth/me solo debe proyectar id, firstName, lastName, email y role.
    // El JWT nunca debe llegar al HTML/PageData servido al navegador.
    const html = await page.content();
    expect(html).not.toContain("mock-admin-token");

    // La cookie authToken es httpOnly: no debe ser legible desde JS de cliente.
    const clientCookies = await page.evaluate(() => document.cookie);
    expect(clientCookies).not.toContain("authToken");
  });

  test("/login?registered=true muestra aviso de éxito y se reemplaza por error al fallar", async ({
    page,
  }) => {
    await page.goto("/login?registered=true");

    const successAlert = page.locator(".alert-success");
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText(
      "Cuenta creada correctamente. Ya podés iniciar sesión.",
    );

    await page.fill("#email", "wrong@dentalclinic.com");
    await page.fill("#password", "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.locator(".alert-danger")).toBeVisible();
    await expect(page.locator(".alert-danger")).toContainText(
      "Credenciales incorrectas",
    );
    await expect(successAlert).toHaveCount(0);
  });

  test("El botón de visibilidad de contraseña en /login alterna aria-pressed y type", async ({
    page,
  }) => {
    await page.goto("/login");

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

  test("Usuario con mustChangePassword es redirigido a /users/change-password y puede actualizar su clave", async ({
    page,
    request,
  }) => {
    await request.post(`${BACKEND_URL}/api/__test/reset-temp`);

    await page.goto("/login");
    await page.fill("#email", "temp@dentalclinic.com");
    await page.fill("#password", "Temp123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/users\/change-password$/);

    const notice = page.locator(".privacy-notice.auth-notice");
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("Cambio obligatorio");

    for (const fieldId of [
      "currentPassword",
      "newPassword",
      "confirmPassword",
    ]) {
      const input = page.locator(`#${fieldId}`);
      const toggle = page.locator(`#${fieldId} + .btn-eye-toggle`);
      await expect(input).toHaveAttribute("type", "password");
      await expect(toggle).toHaveAttribute("aria-pressed", "false");

      await toggle.click();
      await expect(input).toHaveAttribute("type", "text");
      await expect(toggle).toHaveAttribute("aria-pressed", "true");

      await toggle.click();
      await expect(input).toHaveAttribute("type", "password");
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
    }

    await page.fill("#currentPassword", "Temp123!");
    await page.fill("#newPassword", "NuevaClave123!");
    await page.fill("#confirmPassword", "NuevaClave123!");
    await page.click('.auth-form button[type="submit"]');

    // PATIENT role redirects to /appointments after password change
    await expect(page).toHaveURL(/\/appointments$/);

    // Navigating to / no longer redirects back to /users/change-password
    await page.goto("/");
    await expect(page).not.toHaveURL(/\/users\/change-password/);
  });
});
