/**
 * TDD — Dentist SRP split (Chapter 1 SRP / Chapter 13 barrels audit fix)
 *
 * DentistController in public/js/dentist/modules/index.js was flagged as a
 * god-class misnamed as a barrel: it mixed page detection, init lifecycle,
 * search, CSV/JSON export + file download, CRUD orchestration, and ~10
 * window.* global wirings in one class.
 *
 * This is a pure refactor: extract export and search concerns into their
 * own files. No behavior change. Mirrors the already-merged Patient SRP
 * split (see patient-srp-split.test.js).
 *
 * Strategy: static source analysis (fs.readFileSync + string/regex
 * assertions), same pattern as patient-srp-split.test.js. No DOM/jsdom
 * runtime harness — that gap is documented, separate technical debt.
 */

const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '..', 'public', 'js', 'dentist', 'modules');
const indexPath = path.join(modulesDir, 'index.js');
const exportUtilsPath = path.join(modulesDir, 'export-utils.js');
const searchControllerPath = path.join(modulesDir, 'search-controller.js');

// ─── export-utils.js: new file must exist and export the three functions ────

describe('export-utils.js exists and exports buildDentistsCSV/buildDentistsJSON/downloadFile', () => {
  test('export-utils.js file exists', () => {
    expect(fs.existsSync(exportUtilsPath)).toBe(true);
  });

  test('exports buildDentistsCSV, buildDentistsJSON, downloadFile', () => {
    const source = fs.readFileSync(exportUtilsPath, 'utf8');
    expect(source).toContain('export function buildDentistsCSV');
    expect(source).toContain('export function buildDentistsJSON');
    expect(source).toContain('export function downloadFile');
  });

  test('buildDentistsCSV builds the same header/columns as before', () => {
    const source = fs.readFileSync(exportUtilsPath, 'utf8');
    expect(source).toContain('ID');
    expect(source).toContain('Matrícula');
    expect(source).toContain('Nombre');
    expect(source).toContain('Apellido');
    expect(source).toContain('Especialidad');
    expect(source).toContain('registrationNumber');
  });

  // The "Especialidad" column used to read dentist.specialty (singular),
  // which never matched the real API shape (specialties, a plural array
  // of {id, name}), so the column was always empty. Pin the fixed mapping
  // and make sure the old broken field access is gone.
  test('buildDentistsCSV reads dentist.specialties (array), not dentist.specialty (singular)', () => {
    const source = fs.readFileSync(exportUtilsPath, 'utf8');
    expect(source).not.toMatch(/dentist\.specialty\b(?!ies)/);
    expect(source).toMatch(/dentist\.specialties/);
    expect(source).toMatch(/\.map\(\s*\(?s\)?\s*=>\s*s\.name\s*\)/);
  });

  test('downloadFile creates a Blob and triggers an anchor click', () => {
    const source = fs.readFileSync(exportUtilsPath, 'utf8');
    expect(source).toContain('new Blob(');
    expect(source).toContain('URL.createObjectURL');
    expect(source).toContain('a.click()');
    expect(source).toContain('URL.revokeObjectURL');
  });
});

// ─── search-controller.js: new file must exist and export search class ─────

describe('search-controller.js exists and exports a search controller with setup/clearSearch', () => {
  test('search-controller.js file exists', () => {
    expect(fs.existsSync(searchControllerPath)).toBe(true);
  });

  test('exports a default class DentistSearchController', () => {
    const source = fs.readFileSync(searchControllerPath, 'utf8');
    expect(source).toContain('export default class DentistSearchController');
  });

  test('constructor accepts (dataManager, uiManager)', () => {
    const source = fs.readFileSync(searchControllerPath, 'utf8');
    const ctorIdx = source.indexOf('constructor(');
    expect(ctorIdx).toBeGreaterThanOrEqual(0);
    const ctorSignature = source.slice(ctorIdx, ctorIdx + 80);
    expect(ctorSignature).toContain('dataManager');
    expect(ctorSignature).toContain('uiManager');
  });

  test('exposes setup() and clearSearch() methods', () => {
    const source = fs.readFileSync(searchControllerPath, 'utf8');
    expect(source).toMatch(/\bsetup\s*\(/);
    expect(source).toContain('clearSearch(');
  });

  test('uses dataManager.searchDentists and uiManager.displaySearchResults/renderDentistsTable', () => {
    const source = fs.readFileSync(searchControllerPath, 'utf8');
    expect(source).toContain('.searchDentists(');
    expect(source).toContain('.displaySearchResults(');
    expect(source).toContain('.renderDentistsTable(');
  });

  test('debounces search input with setTimeout (300ms), same as before', () => {
    const source = fs.readFileSync(searchControllerPath, 'utf8');
    expect(source).toContain('setTimeout');
    expect(source).toContain('300');
  });

  // Pins the one divergence from the Patient pattern: Dentist's performSearch()
  // returns the results array (dentist-controller.js depends on this), unlike
  // Patient's, which returns nothing. A regression here (dropping the return)
  // would NOT be caught by a loose `.toContain("performSearch(")` check, so
  // this isolates the method body and asserts the `return` keyword is present
  // immediately before the dataManager results are produced.
  test('performSearch() returns the search results array, not void', () => {
    const source = fs.readFileSync(searchControllerPath, 'utf8');
    const methodIdx = source.indexOf('performSearch() {');
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(methodIdx, methodIdx + 400);
    expect(methodBody).toMatch(/return\s+results\s*;/);
  });
});

// ─── index.js: god-class logic removed, delegates to new modules ───────────

describe('modules/index.js no longer contains the extracted CSV/search logic inline', () => {
  let source = '';
  beforeAll(() => {
    source = fs.readFileSync(indexPath, 'utf8');
  });

  test('does NOT contain the literal CSV header-join construction inline', () => {
    expect(source).not.toContain('["ID", "Matrícula", "Nombre", "Apellido", "Especialidad"]');
  });

  test('does NOT contain the searchTimeout debounce logic inline', () => {
    expect(source).not.toContain('searchTimeout');
  });

  test('downloadFile method no longer builds the Blob/anchor inline — delegates to export-utils', () => {
    // The controller's downloadFile wrapper must not contain the Blob/anchor
    // construction itself; that logic now lives in export-utils.js.
    const downloadFileIdx = source.indexOf('downloadFile(content, filename, mimeType) {');
    expect(downloadFileIdx).toBeGreaterThanOrEqual(0);
    const downloadFileBody = source.slice(downloadFileIdx, downloadFileIdx + 300);
    expect(downloadFileBody).not.toContain('new Blob(');
    expect(downloadFileBody).not.toContain('URL.createObjectURL');
  });

  test('imports from export-utils.js', () => {
    expect(source).toMatch(/from\s+["']\.\/export-utils\.js["']/);
  });

  test('imports from search-controller.js', () => {
    expect(source).toMatch(/from\s+["']\.\/search-controller\.js["']/);
  });
});

describe('modules/index.js preserves public behavior: same window.* wiring and method names', () => {
  let source = '';
  beforeAll(() => {
    source = fs.readFileSync(indexPath, 'utf8');
  });

  test('still wires window.searchDentists and window.clearDentistSearch', () => {
    expect(source).toContain('window.searchDentists');
    expect(source).toContain('window.clearDentistSearch');
  });

  test('still wires window.exportDentists', () => {
    expect(source).toContain('window.exportDentists');
  });

  test('still exposes exportDentists(format) dispatcher method', () => {
    expect(source).toMatch(/exportDentists\s*\(\s*format/);
  });

  test('still exposes setupSearch/performSearch/clearSearch entry points on the controller', () => {
    expect(source).toContain('setupSearch(');
    expect(source).toContain('performSearch(');
    expect(source).toContain('clearSearch(');
  });

  test('keeps a searchController instance field', () => {
    expect(source).toMatch(/this\.searchController/);
  });

  test('exposes a searchTerm get/set proxy delegating to searchController', () => {
    expect(source).toMatch(/get\s+searchTerm\s*\(\s*\)/);
    expect(source).toMatch(/set\s+searchTerm\s*\(/);
    expect(source).toContain('this.searchController.getSearchTerm()');
    expect(source).toContain('this.searchController.setSearchTerm(');
  });

  // dentist-controller.js:111 does `return dentistController.performSearch();`
  // — the wrapper MUST forward the return value, not just call through.
  test('performSearch() wrapper forwards the return value from searchController', () => {
    const methodIdx = source.indexOf('performSearch() {');
    expect(methodIdx).toBeGreaterThanOrEqual(0);
    const methodBody = source.slice(methodIdx, methodIdx + 150);
    expect(methodBody).toMatch(/return\s+this\.searchController\.performSearch\(\)/);
  });
});
