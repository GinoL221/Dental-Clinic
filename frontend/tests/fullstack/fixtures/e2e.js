// Playwright browser-journey fixtures for the full-stack suite (PR3):
// role-based storage-state sessions, and helpers for auth.setup.js /
// auth,booking,authorization.spec.js. PR2's process-runner-only helpers
// (spawnFakeService, occupyPort, isPortFree, validEnv, etc.) live in
// ./process-runner-fixtures.js instead — split out for one coherent
// purpose per file.
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, expect } from '@playwright/test';

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
