// Fixtures for the full-stack suite. PR2 added the process-runner env/
// readiness building blocks below; PR3 adds real-UI-login storage-state
// fixtures and journey helpers for the browser specs (auth/booking/authorization).
import { spawn } from 'node:child_process';
import net from 'node:net';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, expect } from '@playwright/test';
import { REQUIRED_ENV_VARS } from '../run-fullstack.js';

export { REQUIRED_ENV_VARS };

export function validEnv(overrides = {}) {
  return {
    JWT_SECRET: 'fixture-secret-value-never-asserted',
    E2E_ADMIN_EMAIL: 'admin@e2e.fixture',
    E2E_ADMIN_PASSWORD: 'AdminFixture123!',
    E2E_NON_ADMIN_EMAIL: 'patient@e2e.fixture',
    E2E_NON_ADMIN_PASSWORD: 'PatientFixture123!',
    ...overrides,
  };
}

export function envWithout(...names) {
  const env = validEnv();
  for (const name of names) delete env[name];
  return env;
}

// Spawns a real, disposable child process hosting a tiny HTTP responder so
// readiness/port/exit behavior is exercised against a genuine OS process,
// without depending on the real Spring Boot/SvelteKit stack (PR3's job).
export function spawnFakeService({
  port,
  statusCode = 200,
  neverReady = false,
  exitCode,
  exitAfterMs = 30,
}) {
  const script = `
    const http = require('http');
    ${exitCode === undefined ? '' : `setTimeout(() => process.exit(${exitCode}), ${exitAfterMs});`}
    ${neverReady ? '' : `http.createServer((q, r) => { r.writeHead(${statusCode}); r.end('{}'); }).listen(${port}, '127.0.0.1');`}
    setInterval(() => {}, 1000 << 20);
  `;
  return spawn(process.execPath, ['-e', script], { stdio: ['ignore', 'pipe', 'pipe'] });
}

export function occupyPort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

export const releasePort = (server) => new Promise((resolve) => server.close(() => resolve()));

export function isPortFree(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once('connect', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(true));
  });
}

// --- PR3: browser journey fixtures (auth.setup.js / auth,booking,authorization.spec.js) ---

const authDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.auth');
export const AUTH_DIR = authDir;
export const ADMIN_STORAGE_STATE = path.join(authDir, 'admin.json');
export const NON_ADMIN_STORAGE_STATE = path.join(authDir, 'patient.json');

export function backendUrl() {
  return process.env.E2E_BACKEND_URL || 'http://127.0.0.1:8080';
}

// Same algorithm as the backend's E2eProfileBoundary.nextUtcWeekday: tomorrow
// in UTC, skipping Saturday/Sunday. Keeps the booking spec's slot in step
// with the seeded appointment's date without guessing at a fixed calendar day.
/** @param {Date} [from] */
export function nextUtcWeekday(from = new Date()) {
  const date = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + 1);
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date;
}

/** @param {Date} date */
export function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

// A valid (08:30-17:59), collision-resistant time for the seeded dentist's
// next-weekday slot: the seeded appointment already owns 10:00, and repeated
// full-stack runs against the same live backend (e.g. local iteration, CI
// retries) must not collide with a previous run's booking on the same date.
// Uses genuine per-call randomness (crypto.randomInt), not a wall-clock
// derivation: a Date.now()-based bucket is deterministic per second, so
// nearby-in-time calls (the exact pattern one already-fixed RED failure hit
// with a fixed value) correlate instead of being independent.
export function pickBookableTime() {
  const bucket = crypto.randomInt(0, 570); // 0..569
  const totalMinutes = 8 * 60 + 30 + bucket; // 08:30..17:59
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  return time === '10:00' ? '10:01' : time;
}

// The authToken cookie is httpOnly (unreadable from page JS by design — see
// auth.spec.js), but Playwright's own context API can still read it so the
// booking/authorization specs can call the backend directly with the same
// bearer token the browser session is using, without a second login.
/** @param {import('@playwright/test').Page} page */
export async function readAuthToken(page) {
  const cookies = await page.context().cookies();
  return (
    cookies.find(
      (/** @type {{ name: string, value: string }} */ cookie) => cookie.name === 'authToken',
    )?.value ?? null
  );
}

// Role-based sessions created by auth.setup.js via real UI login (never
// token injection — see design.md's "Sessions" decision). Reused by
// booking.spec.js (adminPage) and authorization.spec.js (nonAdminPage);
// auth.spec.js itself always performs a fresh UI login with the plain,
// unauthenticated `page` fixture so the explicit login test is never bypassed.
/**
 * @type {import('@playwright/test').Fixtures<
 *   { adminPage: import('@playwright/test').Page, nonAdminPage: import('@playwright/test').Page },
 *   {},
 *   import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions,
 *   import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions
 * >}
 */
const roleFixtures = {
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: ADMIN_STORAGE_STATE });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  nonAdminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: NON_ADMIN_STORAGE_STATE });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
};

export const test = base.extend(roleFixtures);

export { expect };
