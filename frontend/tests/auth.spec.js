import { test, expect } from '@playwright/test';

test.describe('Autenticación E2E', () => {
  test('Inicio de sesión exitoso redirige al dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'admin@dentalclinic.com');
    await page.fill('#password', 'Admin123!');
    await page.click('button[type="submit"]');

    // Debería redirigir a /dashboard o /
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1, h2')).toContainText('Dashboard');

    // La sesión se resuelve vía GET /api/auth/me: el nombre y el email
    // públicos del perfil deben renderizarse en el layout autenticado.
    await expect(page.locator('.user-dropdown')).toContainText('Bienvenido/a, Admin');
    await expect(page.locator('.user-dropdown')).toContainText('admin@dentalclinic.com');
  });

  test('Inicio de sesión fallido muestra mensaje de error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'wrong@dentalclinic.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Debería permanecer en /login y mostrar alerta de error
    await expect(page).toHaveURL(/.*login/);
    const alert = page.locator('.alert-danger');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Credenciales incorrectas');
  });

  test('El perfil de sesión no expone el JWT ni datos sensibles al cliente', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'admin@dentalclinic.com');
    await page.fill('#password', 'Admin123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // GET /api/auth/me solo debe proyectar id, firstName, lastName, email y role.
    // El JWT nunca debe llegar al HTML/PageData servido al navegador.
    const html = await page.content();
    expect(html).not.toContain('mock-admin-token');

    // La cookie authToken es httpOnly: no debe ser legible desde JS de cliente.
    const clientCookies = await page.evaluate(() => document.cookie);
    expect(clientCookies).not.toContain('authToken');
  });
});
