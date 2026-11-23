// Page object for /login. Selectors match the real SvelteKit markup
// (frontend/src/routes/login/+page.svelte) — same ids the mock suite uses.
export class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/login");
  }

  /**
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    await this.page.fill("#email", email);
    await this.page.fill("#password", password);
    // Scope to #loginForm and wait for the POST response: .auth-card runs a
    // 0.6s slideUp animation on entry and Firefox can scroll/shift the button
    // mid-click if fired during layout settle.
    const submitButton = this.page.locator('#loginForm button[type="submit"]');
    await Promise.all([
      this.page.waitForResponse(
        (res) =>
          res.request().method() === "POST" && res.url().includes("/login"),
      ),
      submitButton.click(),
    ]);
  }

  errorMessage() {
    return this.page.locator(".alert-danger");
  }
}
