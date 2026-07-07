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
});
