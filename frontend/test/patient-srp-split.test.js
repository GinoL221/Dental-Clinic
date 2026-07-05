/**
 * TDD — Patient SRP split (Chapter 1 SRP / Chapter 13 barrels audit fix)
 *
 * PatientController in public/js/patient/modules/index.js was flagged as a
 * god-class misnamed as a barrel: it mixed page detection, init lifecycle,
 * search, CSV/JSON export + file download, CRUD orchestration, and ~10
 * window.* global wirings in one class.
 *
 * This is a pure refactor: extract export and search concerns into their
 * own files. No behavior change.
 *
 * Strategy: static source analysis (fs.readFileSync + string/regex
 * assertions), same pattern as slice-b-fixes.test.js. No DOM/jsdom runtime
 * harness — that gap is documented, separate technical debt.
 */

const fs = require("fs");
const path = require("path");

const modulesDir = path.join(
  __dirname,
  "..",
  "public",
  "js",
  "patient",
  "modules"
);
const indexPath = path.join(modulesDir, "index.js");
const exportUtilsPath = path.join(modulesDir, "export-utils.js");
const searchControllerPath = path.join(modulesDir, "search-controller.js");

// ─── export-utils.js: new file must exist and export the three functions ────

describe("export-utils.js exists and exports buildPatientsCSV/buildPatientsJSON/downloadFile", () => {
  test("export-utils.js file exists", () => {
    expect(fs.existsSync(exportUtilsPath)).toBe(true);
  });

  test("exports buildPatientsCSV, buildPatientsJSON, downloadFile", () => {
    const source = fs.readFileSync(exportUtilsPath, "utf8");
    expect(source).toContain("export function buildPatientsCSV");
    expect(source).toContain("export function buildPatientsJSON");
    expect(source).toContain("export function downloadFile");
  });

  test("buildPatientsCSV builds the same header/columns as before", () => {
    const source = fs.readFileSync(exportUtilsPath, "utf8");
    expect(source).toContain("ID");
    expect(source).toContain("DNI");
    expect(source).toContain("Nombre");
    expect(source).toContain("Apellido");
    expect(source).toContain("Email");
    expect(source).toContain("cardIdentity");
  });

  test("downloadFile creates a Blob and triggers an anchor click", () => {
    const source = fs.readFileSync(exportUtilsPath, "utf8");
    expect(source).toContain("new Blob(");
    expect(source).toContain("URL.createObjectURL");
    expect(source).toContain("a.click()");
    expect(source).toContain("URL.revokeObjectURL");
  });
});

// ─── search-controller.js: new file must exist and export search class ─────

describe("search-controller.js exists and exports a search controller with setup/clearSearch", () => {
  test("search-controller.js file exists", () => {
    expect(fs.existsSync(searchControllerPath)).toBe(true);
  });

  test("exports a default class PatientSearchController", () => {
    const source = fs.readFileSync(searchControllerPath, "utf8");
    expect(source).toContain("export default class PatientSearchController");
  });

  test("constructor accepts (dataManager, uiManager)", () => {
    const source = fs.readFileSync(searchControllerPath, "utf8");
    const ctorIdx = source.indexOf("constructor(");
    expect(ctorIdx).toBeGreaterThanOrEqual(0);
    const ctorSignature = source.slice(ctorIdx, ctorIdx + 80);
    expect(ctorSignature).toContain("dataManager");
    expect(ctorSignature).toContain("uiManager");
  });

  test("exposes setup() and clearSearch() methods", () => {
    const source = fs.readFileSync(searchControllerPath, "utf8");
    expect(source).toMatch(/\bsetup\s*\(/);
    expect(source).toContain("clearSearch(");
  });

  test("uses dataManager.searchPatients and uiManager.displaySearchResults/renderPatientsTable", () => {
    const source = fs.readFileSync(searchControllerPath, "utf8");
    expect(source).toContain(".searchPatients(");
    expect(source).toContain(".displaySearchResults(");
    expect(source).toContain(".renderPatientsTable(");
  });

  test("debounces search input with setTimeout (300ms), same as before", () => {
    const source = fs.readFileSync(searchControllerPath, "utf8");
    expect(source).toContain("setTimeout");
    expect(source).toContain("300");
  });
});

// ─── index.js: god-class logic removed, delegates to new modules ───────────

describe("modules/index.js no longer contains the extracted CSV/search logic inline", () => {
  let source = '';
  beforeAll(() => {
    source = fs.readFileSync(indexPath, "utf8");
  });

  test("does NOT contain the literal CSV header-join construction inline", () => {
    expect(source).not.toContain('["ID", "DNI", "Nombre", "Apellido", "Email"]');
  });

  test("does NOT contain the searchTimeout debounce logic inline", () => {
    expect(source).not.toContain("searchTimeout");
  });

  test("downloadFile method no longer builds the Blob/anchor inline — delegates to export-utils", () => {
    // The controller's downloadFile wrapper must not contain the Blob/anchor
    // construction itself; that logic now lives in export-utils.js.
    const downloadFileIdx = source.indexOf("downloadFile(content, filename, mimeType) {");
    expect(downloadFileIdx).toBeGreaterThanOrEqual(0);
    const downloadFileBody = source.slice(downloadFileIdx, downloadFileIdx + 300);
    expect(downloadFileBody).not.toContain("new Blob(");
    expect(downloadFileBody).not.toContain("URL.createObjectURL");
  });

  test("imports from export-utils.js", () => {
    expect(source).toMatch(/from\s+["']\.\/export-utils\.js["']/);
  });

  test("imports from search-controller.js", () => {
    expect(source).toMatch(/from\s+["']\.\/search-controller\.js["']/);
  });
});

describe("modules/index.js preserves public behavior: same window.* wiring and method names", () => {
  let source = '';
  beforeAll(() => {
    source = fs.readFileSync(indexPath, "utf8");
  });

  test("still wires window.searchPatients and window.clearPatientSearch", () => {
    expect(source).toContain("window.searchPatients");
    expect(source).toContain("window.clearPatientSearch");
  });

  test("still wires window.exportPatients", () => {
    expect(source).toContain("window.exportPatients");
  });

  test("still exposes exportPatients(format) dispatcher method", () => {
    expect(source).toMatch(/exportPatients\s*\(\s*format/);
  });

  test("still exposes setupSearch/performSearch/clearSearch entry points on the controller", () => {
    expect(source).toContain("setupSearch(");
    expect(source).toContain("performSearch(");
    expect(source).toContain("clearSearch(");
  });

  test("keeps a searchController instance field", () => {
    expect(source).toMatch(/this\.searchController/);
  });
});
