// Full-stack register journey (Phase 5, register-page-redesign PR 3). Runs
// against the real backend (Spring Boot, `e2e` profile) + real frontend
// (build+preview) via run-fullstack.js — never the mock backend. Proves the
// client validation module + Svelte wiring shipped in PR1/PR2 (already on
// main) actually works end-to-end: inline blur errors, client-side
// confirmPassword blocking, the real backend's duplicate-email message, and
// a successful redirect off /users/register.
import { test, expect } from './fixtures/e2e.js';
import { RegisterPage } from './pages/register.js';

/** Unique per test run so repeated full-stack runs against the same live
 * backend never collide on the users.email unique constraint. */
function uniqueEmail() {
  return `e2e.register.${Date.now()}.${Math.floor(Math.random() * 1_000_000)}@dentalclinic.test`;
}

/** @param {Partial<Record<string, string>>} [overrides] */
function validRegisterValues(overrides = {}) {
  return {
    firstName: 'E2E',
    lastName: 'Register',
    email: uniqueEmail(),
    cardIdentity: String(10_000_000 + Math.floor(Math.random() * 89_999_999)),
    street: 'Calle Falsa',
    number: '123',
    location: 'Ciudad',
    province: 'Provincia',
    password: 'Secret123',
    confirmPassword: 'Secret123',
    ...overrides,
  };
}

test('blur on an empty required field shows an inline error', async ({ page }) => {
  const register = new RegisterPage(page);
  await register.goto();

  await register.blurField('firstName');

  await expect(register.fieldError('firstName')).toBeVisible();
});

test('confirmPassword mismatch blocks submission client-side', async ({ page }) => {
  const register = new RegisterPage(page);
  await register.goto();

  await register.register(validRegisterValues({ confirmPassword: 'Different123' }));

  // Client-side cancel() must prevent navigation entirely.
  await expect(page).toHaveURL(/\/users\/register$/);
  await expect(register.fieldError('confirmPassword')).toBeVisible();
});

test('successful registration with valid unique data redirects away from /users/register', async ({
  page,
}) => {
  const register = new RegisterPage(page);
  await register.goto();

  await register.register(validRegisterValues());

  // Real +page.server.js success path: redirect(303, '/login?registered=true').
  await expect(page).toHaveURL(/\/login\?registered=true$/);
});

test('duplicate-email registration surfaces the real backend error message', async ({ page }) => {
  const register = new RegisterPage(page);
  const email = uniqueEmail();

  await register.goto();
  await register.register(validRegisterValues({ email }));
  await expect(page).toHaveURL(/\/login\?registered=true$/);

  await register.goto();
  await register.register(validRegisterValues({ email }));

  await expect(page).toHaveURL(/\/users\/register$/);
  await expect(register.errorMessage()).toBeVisible();
  await expect(register.errorMessage()).toContainText('El email ya está registrado');
});
