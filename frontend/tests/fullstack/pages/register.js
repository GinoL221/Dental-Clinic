// Page object for /users/register. Selectors match the real SvelteKit markup
// (frontend/src/routes/users/register/+page.svelte) — same field ids the
// client validation module (src/lib/validation/registerForm.js) validates.
export class RegisterPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/users/register');
  }

  /** @param {Record<string, string>} values */
  async fill(values) {
    for (const [name, value] of Object.entries(values)) {
      await this.page.fill(`#${name}`, value);
    }
  }

  async submit() {
    await this.page.click('button[type="submit"]');
  }

  /** @param {Record<string, string>} values */
  async register(values) {
    await this.fill(values);
    await this.submit();
  }

  /** Blurs a field by clicking it, then clicking away — real user focus/blur, not JS-triggered. */
  /** @param {string} name */
  async blurField(name) {
    await this.page.click(`#${name}`);
    await this.page.click('body');
  }

  errorMessage() {
    return this.page.locator('.alert-danger');
  }

  /** @param {string} name */
  fieldError(name) {
    return this.page.locator(`#${name}-error`);
  }
}
