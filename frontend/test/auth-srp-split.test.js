/**
 * TDD — Auth SRP split (Chapter 1 SRP / Chapter 13 barrels audit fix)
 *
 * AuthController in public/js/auth/modules/index.js was flagged by the audit:
 * "auth/modules/index.js (line 492) makes it worse by also doing
 * `export { UIManager, ValidationManager, FormManager, DataManager }`
 * — mixing real barrel re-export with ~490 lines of implementation in the
 * same file, which Chapter13 explicitly warns against."
 *
 * Unlike the Patient/Dentist slices, Auth has no search or CSV/JSON export.
 * This slice instead: (1) deletes the dead barrel re-export (verified via
 * repo-wide grep — only the default export AuthController is ever imported),
 * and (2) extracts route-guard and http-interceptor concerns into their own
 * files. Pure refactor, no behavior change.
 *
 * Strategy: static source analysis (fs.readFileSync + string/regex
 * assertions), same pattern as patient-srp-split.test.js / dentist-srp-split.test.js.
 */

const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '..', 'public', 'js', 'auth', 'modules');
const indexPath = path.join(modulesDir, 'index.js');
const routeGuardPath = path.join(modulesDir, 'route-guard.js');
const httpInterceptorPath = path.join(modulesDir, 'http-interceptor.js');

// ─── route-guard.js: new file must exist and export the guard class ────────

describe('route-guard.js exists and exports AuthRouteGuard', () => {
  test('route-guard.js file exists', () => {
    expect(fs.existsSync(routeGuardPath)).toBe(true);
  });

  test('exports a default class AuthRouteGuard', () => {
    const source = fs.readFileSync(routeGuardPath, 'utf8');
    expect(source).toContain('export default class AuthRouteGuard');
  });

  test('constructor accepts (uiManager)', () => {
    const source = fs.readFileSync(routeGuardPath, 'utf8');
    const ctorIdx = source.indexOf('constructor(');
    expect(ctorIdx).toBeGreaterThanOrEqual(0);
    const ctorSignature = source.slice(ctorIdx, ctorIdx + 60);
    expect(ctorSignature).toContain('uiManager');
  });

  test('isPublicRoute(path) checks against the same public route list', () => {
    const source = fs.readFileSync(routeGuardPath, 'utf8');
    expect(source).toMatch(/isPublicRoute\s*\(\s*path\s*\)/);
    expect(source).toMatch(/['"]\/['"]/);
    expect(source).toMatch(/['"]\/users\/login['"]/);
    expect(source).toMatch(/['"]\/users\/register['"]/);
    expect(source).toMatch(/['"]\/users\/logout['"]/);
    expect(source).toMatch(/['"]\/public['"]/);
  });

  // Pins the return value: isPublicRoute must actually return the boolean
  // check, not just contain the route list somewhere in the file.
  test('isPublicRoute() returns the publicRoutes.some(...) check, not void', () => {
    const source = fs.readFileSync(routeGuardPath, 'utf8');
    const methodIdx = source.search(/isPublicRoute\s*\(\s*path\s*\)\s*{/);
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(methodIdx, methodIdx + 300);
    expect(methodBody).toMatch(/return\s+publicRoutes\.some\(/);
  });

  test('checkRouteProtection(currentPath, isAuthenticated) takes explicit params, not window/this.state', () => {
    const source = fs.readFileSync(routeGuardPath, 'utf8');
    const sigMatch = source.match(
      /checkRouteProtection\s*\(\s*currentPath\s*,\s*isAuthenticated\s*\)/,
    );
    expect(sigMatch).not.toBeNull();
  });

  test('checkRouteProtection preserves sessionStorage, uiManager.showInfo, and 2s redirect side effects', () => {
    const source = fs.readFileSync(routeGuardPath, 'utf8');
    const methodIdx = source.indexOf('checkRouteProtection(');
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(methodIdx, methodIdx + 700);
    expect(methodBody).toMatch(/sessionStorage\.setItem\(['"]returnUrl['"]/);
    expect(methodBody).toContain('.showInfo(');
    expect(methodBody).toContain('setTimeout(');
    expect(methodBody).toContain('2000');
    expect(methodBody).toMatch(/['"]\/users\/login['"]/);
  });

  // Pins the return value: callers depend on true/false to decide whether
  // navigation should proceed.
  test('checkRouteProtection() returns false when blocked and true otherwise', () => {
    const source = fs.readFileSync(routeGuardPath, 'utf8');
    const methodIdx = source.indexOf('checkRouteProtection(');
    const methodBody = source.slice(methodIdx, methodIdx + 700);
    expect(methodBody).toMatch(/return\s+false\s*;/);
    expect(methodBody).toMatch(/return\s+true\s*;/);
  });
});

// ─── http-interceptor.js: new file must exist and export setup function ────

describe('http-interceptor.js exists and exports setupHttpInterceptors', () => {
  test('http-interceptor.js file exists', () => {
    expect(fs.existsSync(httpInterceptorPath)).toBe(true);
  });

  test('exports function setupHttpInterceptors', () => {
    const source = fs.readFileSync(httpInterceptorPath, 'utf8');
    expect(source).toContain('export function setupHttpInterceptors');
  });

  test('destructures { getAuthToken, isAuthenticated, onUnauthorized } as its parameter', () => {
    const source = fs.readFileSync(httpInterceptorPath, 'utf8');
    const sigIdx = source.indexOf('setupHttpInterceptors(');
    expect(sigIdx).toBeGreaterThanOrEqual(0);
    const sig = source.slice(sigIdx, sigIdx + 120);
    expect(sig).toContain('getAuthToken');
    expect(sig).toContain('isAuthenticated');
    expect(sig).toContain('onUnauthorized');
  });

  test('is a plain function, not a class', () => {
    const source = fs.readFileSync(httpInterceptorPath, 'utf8');
    expect(source).not.toContain('class ');
  });

  test('wraps window.fetch and adds Authorization header for /auth/ URLs when a token exists', () => {
    const source = fs.readFileSync(httpInterceptorPath, 'utf8');
    expect(source).toContain('window.fetch');
    expect(source).toMatch(/['"]\/auth\/['"]/);
    expect(source).toContain('getAuthToken()');
    expect(source).toMatch(/Authorization:\s*`Bearer\s*\$\{token\}`/);
  });

  test('on 401 response, awaits onUnauthorized() only when isAuthenticated() is true', () => {
    const source = fs.readFileSync(httpInterceptorPath, 'utf8');
    expect(source).toContain('response.status === 401');
    expect(source).toContain('isAuthenticated()');
    expect(source).toContain('await onUnauthorized()');
  });

  test('returns the response from the wrapped fetch', () => {
    const source = fs.readFileSync(httpInterceptorPath, 'utf8');
    expect(source).toMatch(/return\s+response\s*;/);
  });
});

// ─── index.js: dead barrel removed, god-class logic delegates ──────────────

describe('modules/index.js no longer has the dead barrel re-export', () => {
  let source = '';
  beforeAll(() => {
    source = fs.readFileSync(indexPath, 'utf8');
  });

  test('does NOT export UIManager/ValidationManager/FormManager/DataManager from index.js', () => {
    expect(source).not.toMatch(
      /export\s*{\s*UIManager,\s*ValidationManager,\s*FormManager,\s*DataManager\s*}/,
    );
  });

  test('still exports AuthController as default', () => {
    expect(source).toContain('export default AuthController');
  });
});

describe('modules/index.js no longer contains the extracted route-guard/http-interceptor logic inline', () => {
  let source = '';
  beforeAll(() => {
    source = fs.readFileSync(indexPath, 'utf8');
  });

  test('does NOT contain the public routes array literal inline anymore', () => {
    expect(source).not.toMatch(
      /['"]\/['"],\s*['"]\/users\/login['"],\s*['"]\/users\/register['"],\s*['"]\/users\/logout['"],\s*['"]\/public['"],/,
    );
  });

  test('does NOT build the fetch-wrapping closure inline anymore', () => {
    const setupIdx = source.indexOf('setupHttpInterceptors()');
    expect(setupIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(setupIdx, setupIdx + 400);
    expect(methodBody).not.toContain('const originalFetch = window.fetch');
    expect(methodBody).not.toContain('window.fetch = async');
  });

  test('imports from route-guard.js', () => {
    expect(source).toMatch(/from\s+["']\.\/route-guard\.js["']/);
  });

  test('imports from http-interceptor.js', () => {
    expect(source).toMatch(/from\s+["']\.\/http-interceptor\.js["']/);
  });

  test('keeps a routeGuard instance field', () => {
    expect(source).toMatch(/this\.routeGuard/);
  });
});

describe('modules/index.js preserves public behavior: same method names and signatures', () => {
  let source = '';
  beforeAll(() => {
    source = fs.readFileSync(indexPath, 'utf8');
  });

  test('isPublicRoute(path) wrapper delegates to routeGuard and forwards the return value', () => {
    const methodIdx = source.indexOf('isPublicRoute(path) {');
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(methodIdx, methodIdx + 150);
    expect(methodBody).toMatch(/return\s+this\.routeGuard\.isPublicRoute\(path\)/);
  });

  // checkRouteProtection() MUST keep its zero-arg signature: both
  // setupAutomaticRouteProtection's beforeunload listener and init()'s
  // default case call it with no arguments. It must also stay async —
  // the original method was `async checkRouteProtection()`; dropping
  // `async` would be an (benign but real) signature change outside this
  // PR's "pure refactor" scope. Pin the DEFINITION specifically (with the
  // trailing brace) so this can't accidentally match a call site instead.
  test('checkRouteProtection() wrapper keeps the zero-arg, async signature', () => {
    const methodIdx = source.indexOf('checkRouteProtection() {');
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const precedingText = source.slice(Math.max(0, methodIdx - 10), methodIdx);
    expect(precedingText).toMatch(/async\s+$/);
  });

  test('checkRouteProtection() wrapper forwards window.location.pathname and this.state.isAuthenticated to routeGuard, and returns its result', () => {
    const methodIdx = source.indexOf('checkRouteProtection() {');
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(methodIdx, methodIdx + 250);
    expect(methodBody).toMatch(
      /return\s+this\.routeGuard\.checkRouteProtection\(\s*window\.location\.pathname\s*,\s*this\.state\.isAuthenticated,?\s*\)/,
    );
  });

  test('setupHttpInterceptors() wrapper delegates to the extracted function with getAuthToken/isAuthenticated/onUnauthorized callbacks', () => {
    const methodIdx = source.indexOf('setupHttpInterceptors() {');
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(methodIdx, methodIdx + 600);
    // Calls the imported function under an aliased name (setupFetchInterceptors)
    // to avoid a same-name class-method-vs-free-function naming collision with
    // the wrapper method itself, which would read as unqualified self-recursion.
    expect(methodBody).toContain('setupFetchInterceptors({');
    expect(methodBody).toMatch(/getAuthToken:\s*\(\)\s*=>\s*this\.getAuthToken\(\)/);
    expect(methodBody).toMatch(/isAuthenticated:\s*\(\)\s*=>\s*this\.state\.isAuthenticated/);
    expect(methodBody).toContain('onUnauthorized:');
  });

  // The 401-handling body must be moved verbatim into the onUnauthorized
  // callback: processLogout(), showError, and redirect to /users/login.
  test('onUnauthorized callback preserves processLogout + showError + redirect side effects verbatim', () => {
    const methodIdx = source.indexOf('setupHttpInterceptors() {');
    const methodBody = source.slice(methodIdx, methodIdx + 600);
    expect(methodBody).toContain('await this.processLogout()');
    expect(methodBody).toMatch(/this\.uiManager\.showError\(['"]Su sesión ha expirado['"]\)/);
    expect(methodBody).toMatch(/window\.location\.href\s*=\s*['"]\/users\/login['"]/);
  });

  test('still wires setupAutomaticRouteProtection calling checkRouteProtection with no args', () => {
    expect(source).toContain('setupAutomaticRouteProtection(');
    const setupIdx = source.indexOf('setupAutomaticRouteProtection() {');
    expect(setupIdx).toBeGreaterThanOrEqual(0);
    const setupBody = source.slice(setupIdx, setupIdx + 300);
    expect(setupBody).toMatch(/this\.checkRouteProtection\(\)/);
  });

  test("init()'s default case still calls checkRouteProtection with no args", () => {
    const defaultIdx = source.indexOf('default:');
    expect(defaultIdx).toBeGreaterThanOrEqual(0);
    const defaultBody = source.slice(defaultIdx, defaultIdx + 200);
    expect(defaultBody).toMatch(/this\.checkRouteProtection\(\)/);
  });
});

describe('modules/index.js leaves unrelated behavior untouched', () => {
  let source = '';
  beforeAll(() => {
    source = fs.readFileSync(indexPath, 'utf8');
  });

  test('still has getCurrentPage, processLogin, processRegister, processLogout', () => {
    expect(source).toContain('getCurrentPage(');
    expect(source).toContain('processLogin(');
    expect(source).toContain('processRegister(');
    expect(source).toContain('processLogout(');
  });

  test('still wires window.login, window.register, window.logout, window.isAuthenticated', () => {
    expect(source).toContain('window.login');
    expect(source).toContain('window.register');
    expect(source).toContain('window.logout');
    expect(source).toContain('window.isAuthenticated');
  });

  test('still has the DOMContentLoaded auto-init block with the existing-instance reuse guard', () => {
    expect(source).toMatch(/document\.addEventListener\(['"]DOMContentLoaded['"]/);
    expect(source).toContain('window.authController');
  });
});
