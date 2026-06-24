/**
 * TDD — Client token handling: authToken removed from localStorage repo-wide
 * (frontend-xss-token-hardening, PR3/Phase 4)
 *
 * Spec: openspec/changes/frontend-xss-token-hardening/specs/client-token-handling/spec.md
 *
 * The JWT must never be written to or read from localStorage anywhere in the
 * client — the httpOnly `authToken` cookie (PR1's backend cookie-fallback
 * filter) carries authentication instead. The five non-sensitive identity
 * keys (userRole, userEmail, userId, userFirstName, userLastName) must
 * continue to be written/read unchanged.
 *
 * Strategy: static source analysis (fs.readFileSync + string/regex
 * assertions), same pattern as auth-srp-split.test.js / appointment-srp-split.test.js
 * / slice-a-fixes.test.js / slice-b-fixes.test.js — this repo's established
 * convention for testing ESM browser modules without a bundler/jsdom
 * pipeline (see those files' header comments).
 */

const fs = require("fs");
const path = require("path");

function read(relPath) {
  return fs.readFileSync(path.join(__dirname, "..", relPath), "utf8");
}

const FILES = {
  configJs: "public/js/api/config.js",
  authApiJs: "public/js/api/auth-api.js",
  authDataManagerJs: "public/js/auth/modules/data-manager.js",
  appointmentEnricherJs: "public/js/appointment/modules/appointment-enricher.js",
  appointmentDataManagerJs: "public/js/appointment/modules/data-manager.js",
  appointmentUiManagerJs: "public/js/appointment/modules/ui-manager.js",
};

describe("processLogin writes the five non-sensitive keys but NEVER authToken to localStorage", () => {
  let source;
  beforeAll(() => {
    source = read(FILES.authDataManagerJs);
  });

  test("does NOT call localStorage.setItem(\"authToken\", ...)", () => {
    expect(source).not.toMatch(/localStorage\.setItem\(\s*["']authToken["']/);
  });

  test("still writes the five non-sensitive identity keys", () => {
    const expectedKeys = ["userRole", "userEmail", "userId", "userFirstName", "userLastName"];
    expectedKeys.forEach((key) => {
      expect(source).toMatch(new RegExp(`localStorage\\.setItem\\(\\s*["']${key}["']`));
    });
  });
});

describe("refreshToken does NOT write authToken to localStorage", () => {
  test("data-manager.js's refreshToken method body has no authToken localStorage write", () => {
    const source = read(FILES.authDataManagerJs);
    const methodIdx = source.indexOf("async refreshToken()");
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(methodIdx, methodIdx + 600);
    expect(methodBody).not.toMatch(/localStorage\.setItem\(\s*["']authToken["']/);
  });
});

describe("hasActiveSession / getCurrentUserData do not depend on a localStorage authToken read", () => {
  test("hasActiveSession() does not read localStorage.getItem(\"authToken\")", () => {
    const source = read(FILES.authDataManagerJs);
    const methodIdx = source.indexOf("hasActiveSession()");
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(methodIdx, methodIdx + 300);
    expect(methodBody).not.toMatch(/localStorage\.getItem\(\s*["']authToken["']/);
  });

  test("getAuthToken() no longer reads localStorage.getItem(\"authToken\")", () => {
    const source = read(FILES.authDataManagerJs);
    const methodIdx = source.indexOf("getAuthToken()");
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(methodIdx, methodIdx + 200);
    expect(methodBody).not.toMatch(/localStorage\.getItem\(\s*["']authToken["']/);
  });
});

describe("api/config.js getAuthHeaders stops attaching an Authorization header sourced from localStorage", () => {
  let source;
  beforeAll(() => {
    source = read(FILES.configJs);
  });

  test("getAuthHeaders() does not read localStorage.getItem(\"authToken\")", () => {
    const fnIdx = source.indexOf("export function getAuthHeaders()");
    expect(fnIdx).toBeGreaterThanOrEqual(0);
    const fnBody = source.slice(fnIdx, fnIdx + 300);
    expect(fnBody).not.toMatch(/localStorage\.getItem\(\s*["']authToken["']/);
  });

  test("getAuthHeaders() no longer attaches an Authorization header", () => {
    const fnIdx = source.indexOf("export function getAuthHeaders()");
    const fnBody = source.slice(fnIdx, fnIdx + 300);
    expect(fnBody).not.toMatch(/Authorization/);
  });
});

describe("api/auth-api.js no longer writes or reads authToken from localStorage", () => {
  let source;
  beforeAll(() => {
    source = read(FILES.authApiJs);
  });

  test("login() does not write authToken to localStorage", () => {
    const idx = source.indexOf("async login(email, password)");
    expect(idx).toBeGreaterThanOrEqual(0);
    const body = source.slice(idx, idx + 700);
    expect(body).not.toMatch(/localStorage\.setItem\(\s*["']authToken["']/);
  });

  test("register() does not write authToken to localStorage", () => {
    const idx = source.indexOf("async register(");
    expect(idx).toBeGreaterThanOrEqual(0);
    const body = source.slice(idx, idx + 900);
    expect(body).not.toMatch(/localStorage\.setItem\(\s*["']authToken["']/);
  });

  test("isAuthenticated() keeps the cookie-presence check, drops the localStorage token check", () => {
    const idx = source.indexOf("isAuthenticated()");
    expect(idx).toBeGreaterThanOrEqual(0);
    const body = source.slice(idx, idx + 400);
    expect(body).not.toMatch(/localStorage\.getItem\(\s*["']authToken["']/);
    expect(body).toMatch(/document\.cookie/);
  });

  test("getToken() no longer reads authToken from localStorage", () => {
    const idx = source.indexOf("getToken()");
    expect(idx).toBeGreaterThanOrEqual(0);
    const body = source.slice(idx, idx + 150);
    expect(body).not.toMatch(/localStorage\.getItem\(\s*["']authToken["']/);
  });
});

describe("appointment modules no longer read authToken from localStorage to build Authorization headers", () => {
  test("appointment-enricher.js fallback fetch no longer reads localStorage.getItem(\"authToken\")", () => {
    const source = read(FILES.appointmentEnricherJs);
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["']authToken["']/);
  });

  test("appointment-enricher.js fallback fetch no longer sends an Authorization header", () => {
    const source = read(FILES.appointmentEnricherJs);
    expect(source).not.toMatch(/Authorization:/);
  });

  test("appointment/modules/data-manager.js loadPatients/loadCurrentUserData no longer read localStorage.getItem(\"authToken\")", () => {
    const source = read(FILES.appointmentDataManagerJs);
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["']authToken["']/);
  });

  test("appointment/modules/data-manager.js no longer sends an Authorization header built from a stored token", () => {
    const source = read(FILES.appointmentDataManagerJs);
    expect(source).not.toMatch(/Authorization:\s*`Bearer/);
  });

  test("appointment/modules/ui-manager.js loadPatientDataForAppointments no longer reads localStorage.getItem(\"authToken\")", () => {
    const source = read(FILES.appointmentUiManagerJs);
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["']authToken["']/);
  });
});

describe("repo-wide: zero authToken localStorage writers/readers remain in production code", () => {
  // Cookie name strings (postLogin.js's res.cookie("authToken", ...), the
  // backend filter's cookie name, logout.js's res.clearCookie) are NOT
  // localStorage calls and are explicitly out of scope — only
  // localStorage.setItem/getItem("authToken") call sites are the target.
  const productionFiles = [
    FILES.configJs,
    FILES.authApiJs,
    FILES.authDataManagerJs,
    FILES.appointmentEnricherJs,
    FILES.appointmentDataManagerJs,
    FILES.appointmentUiManagerJs,
  ];

  test.each(productionFiles)("%s has no localStorage.setItem/getItem(\"authToken\") call", (relPath) => {
    const source = read(relPath);
    expect(source).not.toMatch(/localStorage\.(setItem|getItem)\(\s*["']authToken["']/);
  });
});
