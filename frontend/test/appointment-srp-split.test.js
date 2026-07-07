const { describe, test, expect, beforeAll } = require('@jest/globals');

/**
 * TDD — Appointment SRP split (Chapter 1 SRP / Chapter 13 barrels audit fix)
 *
 * AppointmentController in public/js/appointment/modules/index.js (582 lines)
 * is the 4th and LAST of 4 planned god-class extractions. Unlike Patient/
 * Dentist, it has no search and no CSV/JSON export, and unlike all 3 prior
 * entities it has NO window.* global wiring at all. Its god-class concerns
 * are: page detection, init lifecycle, server/user-data bootstrapping (3-tier
 * fallback), per-page data loading, appointment-data enrichment (with its own
 * raw fetch bypassing the API layer), list-page event binding, and CRUD-ish
 * methods.
 *
 * This slice extracts exactly two concerns:
 *   1. server-data-loader.js — loadServerData({ currentPage, getAppointmentId })
 *   2. appointment-enricher.js — enrichAppointmentData(appointment, dentists, patients)
 *
 * Originally a pure refactor test. It now also pins the later bug fix that
 * keeps the patient fallback fetch under the backend /api context path.
 *
 * Strategy: static source analysis (fs.readFileSync + string/regex
 * assertions), same pattern as auth-srp-split.test.js / patient-srp-split.test.js
 * / dentist-srp-split.test.js.
 */

const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '..', 'public', 'js', 'appointment', 'modules');
const indexPath = path.join(modulesDir, 'index.js');
const serverDataLoaderPath = path.join(modulesDir, 'server-data-loader.js');
const appointmentEnricherPath = path.join(modulesDir, 'appointment-enricher.js');

// ─── server-data-loader.js: new file must exist and export loadServerData ──

describe('server-data-loader.js exists and exports loadServerData', () => {
  test('server-data-loader.js file exists', () => {
    expect(fs.existsSync(serverDataLoaderPath)).toBe(true);
  });

  test('exports async function loadServerData', () => {
    const source = fs.readFileSync(serverDataLoaderPath, 'utf8');
    expect(source).toContain('export async function loadServerData');
  });

  test('destructures { currentPage, getAppointmentId } as its parameter', () => {
    const source = fs.readFileSync(serverDataLoaderPath, 'utf8');
    const sigIdx = source.indexOf('export async function loadServerData(');
    expect(sigIdx).toBeGreaterThanOrEqual(0);
    const sig = source.slice(sigIdx, sigIdx + 120);
    expect(sig).toContain('currentPage');
    expect(sig).toContain('getAppointmentId');
  });

  test('is a plain function, not a class', () => {
    const source = fs.readFileSync(serverDataLoaderPath, 'utf8');
    expect(source).not.toContain('class ');
  });

  test('tier 1: reuses window.serverData when present and sets currentUser/isAdmin globals', () => {
    const source = fs.readFileSync(serverDataLoaderPath, 'utf8');
    expect(source).toContain('window.serverData');
    expect(source).toMatch(/if\s*\(\s*window\.serverData\s*\)/);
    expect(source).toContain('window.currentUser = window.serverData.user');
    expect(source).toContain('window.isAdmin = window.serverData.isAdmin');
  });

  test('tier 1: returns window.serverData when present', () => {
    const source = fs.readFileSync(serverDataLoaderPath, 'utf8');
    const guardIdx = source.search(/if\s*\(\s*window\.serverData\s*\)\s*{/);
    expect(guardIdx).toBeGreaterThanOrEqual(0);
    const guardBody = source.slice(guardIdx, guardIdx + 400);
    expect(guardBody).toMatch(/return\s+window\.serverData\s*;/);
  });

  test('tier 2: fetches /appointments/server-data, appending /{id} for edit page via getAppointmentId()', () => {
    const source = fs.readFileSync(serverDataLoaderPath, 'utf8');
    expect(source).toMatch(/['"]\/appointments\/server-data['"]/);
    expect(source).toMatch(/currentPage\s*===\s*["']edit["']/);
    expect(source).toContain('getAppointmentId()');
    expect(source).toMatch(/endpoint\s*\+=\s*`\/\$\{appointmentId\}`/);
  });

  test('tier 2: fetch uses GET, credentials include, and throws on non-ok response', () => {
    const source = fs.readFileSync(serverDataLoaderPath, 'utf8');
    expect(source).toMatch(/method:\s*['"]GET['"]/);
    expect(source).toMatch(/credentials:\s*['"]include['"]/);
    expect(source).toMatch(/throw new Error\(`Error: \$\{response\.status\}/);
  });

  test('tier 2: sets window.serverData/currentUser/isAdmin and returns serverData on success', () => {
    const source = fs.readFileSync(serverDataLoaderPath, 'utf8');
    const fetchIdx = source.indexOf('const response = await fetch(endpoint');
    expect(fetchIdx).toBeGreaterThanOrEqual(0);
    const tierBody = source.slice(fetchIdx, fetchIdx + 700);
    expect(tierBody).toContain('window.serverData = serverData');
    expect(tierBody).toContain('window.currentUser = serverData.user');
    expect(tierBody).toContain('window.isAdmin = serverData.isAdmin');
    expect(tierBody).toMatch(/return\s+serverData\s*;/);
  });

  test('tier 3: falls back to window.isAdmin/window.currentUser session globals on error', () => {
    const source = fs.readFileSync(serverDataLoaderPath, 'utf8');
    const catchIdx = source.indexOf('} catch (error) {');
    expect(catchIdx).toBeGreaterThanOrEqual(0);
    const catchBody = source.slice(catchIdx, catchIdx + 700);
    expect(catchBody).toMatch(/if\s*\(\s*window\.isAdmin\s*!==\s*undefined\s*\)/);
    expect(catchBody).toContain('window.currentUser || {}');
    expect(catchBody).toContain('window.isAdmin || false');
    expect(catchBody).toContain('getAppointmentId()');
    expect(catchBody).toContain('window.serverData = fallbackData');
    expect(catchBody).toMatch(/return\s+fallbackData\s*;/);
  });

  test('tier 3: re-throws the original error when no session fallback is available', () => {
    const source = fs.readFileSync(serverDataLoaderPath, 'utf8');
    const catchIdx = source.indexOf('} catch (error) {');
    const catchBody = source.slice(catchIdx, catchIdx + 700);
    expect(catchBody).toMatch(/throw\s+error\s*;/);
  });

  test('does NOT set this.state.isAdmin directly (no `this` in a free function)', () => {
    const source = fs.readFileSync(serverDataLoaderPath, 'utf8');
    expect(source).not.toContain('this.state');
  });
});

// ─── appointment-enricher.js: new file must exist and export the function ──

describe('appointment-enricher.js exists and exports enrichAppointmentData', () => {
  test('appointment-enricher.js file exists', () => {
    expect(fs.existsSync(appointmentEnricherPath)).toBe(true);
  });

  test('exports async function enrichAppointmentData', () => {
    const source = fs.readFileSync(appointmentEnricherPath, 'utf8');
    expect(source).toContain('export async function enrichAppointmentData');
  });

  // Pins the positional API: the second argument is kept for compatibility,
  // but the implementation names it `_dentists` because it is intentionally unused.
  test('keeps the three-argument appointment enrichment signature', () => {
    const source = fs.readFileSync(appointmentEnricherPath, 'utf8');
    const sigIdx = source.indexOf('export async function enrichAppointmentData(');
    expect(sigIdx).toBeGreaterThanOrEqual(0);
    const sig = source.slice(sigIdx, sigIdx + 90);
    expect(sig).toMatch(
      /enrichAppointmentData\(\s*appointment\s*,\s*_dentists\s*,\s*patients\s*\)/,
    );
  });

  test('is a plain function, not a class', () => {
    const source = fs.readFileSync(appointmentEnricherPath, 'utf8');
    expect(source).not.toContain('class ');
  });

  test('looks up patientData in the bulk-loaded patients array first', () => {
    const source = fs.readFileSync(appointmentEnricherPath, 'utf8');
    expect(source).toMatch(
      /patients\.find\(\s*\(p\)\s*=>\s*p\.id\s*===\s*appointment\.patient_id\s*\)/,
    );
  });

  test('fallback fetch uses PatientAPI.getById for patient lookup', () => {
    const source = fs.readFileSync(appointmentEnricherPath, 'utf8');
    expect(source).toContain('PatientAPI.getById(appointment.patient_id)');
  });

  test('catches the fallback-fetch error and continues without rethrowing', () => {
    const source = fs.readFileSync(appointmentEnricherPath, 'utf8');
    const apiCallIdx = source.indexOf('PatientAPI.getById(');
    expect(apiCallIdx).toBeGreaterThanOrEqual(0);
    const afterApiCall = source.slice(apiCallIdx, apiCallIdx + 600);
    expect(afterApiCall).toMatch(/catch\s*\(\s*error\s*\)\s*{/);
    expect(afterApiCall).not.toMatch(/catch\s*\(\s*error\s*\)\s*{\s*throw/);
  });

  test('sets dentistId/appointmentDate/appointmentTime from the raw appointment fields', () => {
    const source = fs.readFileSync(appointmentEnricherPath, 'utf8');
    expect(source).toContain('enrichedAppointment.dentistId = appointment.dentist_id');
    expect(source).toContain('enrichedAppointment.appointmentDate = appointment.date');
    expect(source).toContain('enrichedAppointment.appointmentTime = appointment.time');
  });

  test('returns enrichedAppointment on success and the original appointment on outer error', () => {
    const source = fs.readFileSync(appointmentEnricherPath, 'utf8');
    expect(source).toMatch(/return\s+enrichedAppointment\s*;/);
    const outerCatchIdx = source.lastIndexOf('} catch (error) {');
    expect(outerCatchIdx).toBeGreaterThanOrEqual(0);
    const outerCatchBody = source.slice(outerCatchIdx, outerCatchIdx + 200);
    expect(outerCatchBody).toMatch(/return\s+appointment\s*;/);
  });
});

// ─── index.js: god-class methods delegate to the extracted modules ─────────

describe('modules/index.js imports from the two extracted modules', () => {
  let source = '';
  beforeAll(() => {
    source = fs.readFileSync(indexPath, 'utf8');
  });

  test('imports from server-data-loader.js', () => {
    expect(source).toMatch(/from\s+["']\.\/server-data-loader\.js["']/);
  });

  test('imports from appointment-enricher.js', () => {
    expect(source).toMatch(/from\s+["']\.\/appointment-enricher\.js["']/);
  });

  // Naming-collision guard (lesson learned from the Auth slice): the
  // imported functions must be aliased so they don't share a bare name
  // with the wrapper methods that call them.
  test('aliases the imported loadServerData to avoid colliding with the wrapper method name', () => {
    const importIdx = source.search(/import\s*{\s*loadServerData/);
    expect(importIdx).toBeGreaterThanOrEqual(0);
    const importLine = source.slice(importIdx, importIdx + 150);
    expect(importLine).toMatch(/loadServerData\s+as\s+\w+/);
  });

  test('aliases the imported enrichAppointmentData to avoid colliding with the wrapper method name', () => {
    const importIdx = source.search(/import\s*{\s*enrichAppointmentData/);
    expect(importIdx).toBeGreaterThanOrEqual(0);
    const importLine = source.slice(importIdx, importIdx + 150);
    expect(importLine).toMatch(/enrichAppointmentData\s+as\s+\w+/);
  });
});

describe('modules/index.js no longer contains the extracted logic inline', () => {
  let source = '';
  beforeAll(() => {
    source = fs.readFileSync(indexPath, 'utf8');
  });

  test('loadServerData() method body no longer builds the fetch endpoint inline', () => {
    const methodIdx = source.indexOf('async loadServerData()');
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(methodIdx, methodIdx + 400);
    expect(methodBody).not.toContain('"/appointments/server-data"');
    expect(methodBody).not.toContain('await fetch(endpoint');
  });

  test('enrichAppointmentData() method body no longer builds the patient fallback fetch inline', () => {
    const methodIdx = source.indexOf('async enrichAppointmentData(');
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(methodIdx, methodIdx + 400);
    expect(methodBody).not.toContain('localStorage.getItem("authToken")');
    expect(methodBody).not.toContain('patients.find(');
  });
});

describe('modules/index.js preserves public behavior: same method names and signatures', () => {
  let source = '';
  beforeAll(() => {
    source = fs.readFileSync(indexPath, 'utf8');
  });

  test('loadServerData() wrapper keeps the zero-arg, async signature', () => {
    const methodIdx = source.indexOf('loadServerData() {');
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const precedingText = source.slice(Math.max(0, methodIdx - 10), methodIdx);
    expect(precedingText).toMatch(/async\s+$/);
  });

  test('loadServerData() wrapper forwards currentPage and a getAppointmentId callback, and returns the result', () => {
    const methodIdx = source.indexOf('async loadServerData() {');
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(methodIdx, methodIdx + 400);
    expect(methodBody).toMatch(/currentPage:\s*this\.state\.currentPage/);
    expect(methodBody).toMatch(
      /getAppointmentId:\s*\(\)\s*=>\s*this\.getAppointmentIdFromPage\(\)/,
    );
  });

  test('loadServerData() wrapper sets this.state.isAdmin from the result and returns it', () => {
    const methodIdx = source.indexOf('async loadServerData() {');
    const methodBody = source.slice(methodIdx, methodIdx + 500);
    expect(methodBody).toMatch(/this\.state\.isAdmin\s*=\s*\w+\.isAdmin/);
    expect(methodBody).toMatch(/return\s+\w+\s*;/);
  });

  test('loadUserData() stays unchanged: calls this.loadServerData() then dataManager.loadCurrentUserData()', () => {
    const methodIdx = source.indexOf('async loadUserData() {');
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(methodIdx, methodIdx + 400);
    expect(methodBody).toMatch(/this\.loadServerData\(\)/);
    expect(methodBody).toMatch(/this\.dataManager\.loadCurrentUserData\(\)/);
  });

  test('enrichAppointmentData() wrapper keeps the (appointment, dentists, patients) signature', () => {
    const methodIdx = source.indexOf('async enrichAppointmentData(');
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const sig = source.slice(methodIdx, methodIdx + 80);
    expect(sig).toMatch(/enrichAppointmentData\(\s*appointment\s*,\s*dentists\s*,\s*patients\s*\)/);
  });

  test('enrichAppointmentData() wrapper delegates to the aliased import and returns its result', () => {
    const methodIdx = source.indexOf('async enrichAppointmentData(');
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(methodIdx, methodIdx + 200);
    expect(methodBody).toMatch(
      /return\s+\w+\(\s*appointment\s*,\s*dentists\s*,\s*patients\s*\)\s*;/,
    );
  });

  test('initEditPage still calls this.enrichAppointmentData(appointment, dentists, patients)', () => {
    const callIdx = source.indexOf('this.enrichAppointmentData(');
    expect(callIdx).toBeGreaterThanOrEqual(0);
    const callSite = source.slice(callIdx, callIdx + 150);
    expect(callSite).toMatch(/appointment\s*,\s*dentists\s*,\s*patients/);
  });
});

describe('modules/index.js leaves unrelated behavior untouched', () => {
  let source = '';
  beforeAll(() => {
    source = fs.readFileSync(indexPath, 'utf8');
  });

  test('still has getCurrentPage, init, initAddPage, initEditPage, initListPage', () => {
    expect(source).toContain('getCurrentPage(');
    expect(source).toContain('async init(');
    expect(source).toContain('async initAddPage(');
    expect(source).toContain('async initEditPage(');
    expect(source).toContain('async initListPage(');
  });

  test('still has getAppointmentIdFromPage, deleteAppointment, refreshData', () => {
    expect(source).toContain('getAppointmentIdFromPage(');
    expect(source).toContain('async deleteAppointment(');
    expect(source).toContain('async refreshData(');
  });

  // bindListEvents() was dead code: it queried .btn-edit-appointment /
  // .btn-delete-appointment, but the real rendered row template
  // (ui-manager.js) uses a plain <a href="/appointments/edit/{id}"> for
  // edit and onclick="window.confirmDeleteAppointment(...)" for delete —
  // neither element has those classes, so both querySelectorAll calls
  // always returned empty NodeLists. Confirmed live (Playwright) that
  // real edit/delete still work through window.confirmDeleteAppointment,
  // unrelated to this method. Removed entirely, not just unwired.
  test('bindListEvents() dead code was removed, not just left unwired', () => {
    expect(source).not.toContain('bindListEvents');
    expect(source).not.toContain('btn-edit-appointment');
    expect(source).not.toContain('btn-delete-appointment');
  });

  test('still has getState, clearValidations, loadList, applyFilters, clearFilters', () => {
    expect(source).toContain('getState(');
    expect(source).toContain('clearValidations(');
    expect(source).toContain('async loadList(');
    expect(source).toContain('async applyFilters(');
    expect(source).toContain('async clearFilters(');
  });

  // Updated by unify-global-wiring-source (Slice 1): the canonical's
  // self-running DOMContentLoaded listener was replaced with an exported,
  // idempotent initAppointmentController() that wrappers call instead. The
  // canonical itself no longer registers a DOMContentLoaded listener — only
  // the exported init function exists, still publishing
  // window.appointmentController BEFORE awaiting controller.init().
  test('self-running DOMContentLoaded listener removed; exported idempotent init function added', () => {
    expect(source).not.toContain('document.addEventListener("DOMContentLoaded"');
    expect(source).toContain('export async function initAppointmentController()');
    expect(source).toContain('window.appointmentController');
  });

  test('still exports AppointmentController as default', () => {
    expect(source).toContain('export default AppointmentController');
  });

  test('has NO window.* global wiring (unlike Patient/Dentist/Auth)', () => {
    expect(source).not.toMatch(
      /window\.appointmentController\s*=\s*appointmentController;[\s\S]*window\.\w+\s*=\s*\(/,
    );
  });
});
