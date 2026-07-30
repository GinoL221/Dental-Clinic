// Page object for /login. Selectors match the real SvelteKit markup
// (frontend/src/routes/login/+page.svelte) — same ids the mock suite uses.
export class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/login');
  }

  /**
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    await this.page.fill('#email', email);
    await this.page.fill('#password', password);
    await this.page.click('button[type="submit"]');
  }

  errorMessage() {
    return this.page.locator('.alert-danger');
  }
}
