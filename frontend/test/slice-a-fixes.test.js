/**
 * Tests for Slice A surgical fixes (frontend-surgical-fixes SDD change).
 * Strategy: static source analysis (same pattern as dashboard-api.test.js)
 * plus pure-logic extraction for isValidPhone. Browser modules cannot be
 * required by Node without heavy mocking; static analysis gives deterministic
 * RED/GREEN cycles for these one-line and structural fixes.
 */

const fs = require('fs');
const path = require('path');

// --- A1.1: auth-api.js uses named import `apiConfig`, not `window.apiConfig` ---
describe('A1.1 auth-api.js: registerPatient uses named apiConfig (not window.apiConfig)', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'js', 'api', 'auth-api.js'),
    'utf8',
  );

  test('does NOT reference window.apiConfig anywhere', () => {
    expect(src).not.toContain('window.apiConfig');
  });

  test('uses named import apiConfig.headers in registerPatient', () => {
    // The named import is on line 2; registerPatient must use `apiConfig.headers`
    const registerPatientBlock = src.slice(
      src.indexOf('async registerPatient'),
      src.indexOf('async registerPatient') + 600,
    );
    expect(registerPatientBlock).toContain('apiConfig.headers');
  });
});

// --- A1.2: patient/modules/data-manager.js has isValidPhone method ---
describe('A1.2 PatientDataManager.isValidPhone exists and validates correctly', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'js', 'patient', 'modules', 'data-manager.js'),
    'utf8',
  );

  test('isValidPhone method is defined on the class', () => {
    expect(src).toContain('isValidPhone(');
  });

  test('isValidPhone uses a phone validation regex (contains digit/length pattern)', () => {
    // The method must contain a regex that tests phone format
    expect(src).toMatch(/isValidPhone[\s\S]{0,200}\/.*\\d[\s\S]{0,50}test\(/);
  });

  // Test the logic by extracting the regex literal from source and running it
  test('isValidPhone accepts valid phone numbers and rejects invalid ones', () => {
    // Find the METHOD DEFINITION (not the call site) — "  isValidPhone(phone)"
    const methodStart = src.indexOf('  isValidPhone(phone)');
    const methodSrc = src.slice(methodStart, methodStart + 200);
    const regexMatch = methodSrc.match(/(\/[^\n]+\/[gimsuy]*)\s*\.test\(/);
    expect(regexMatch).not.toBeNull();

    const regex = eval(regexMatch[1]); // safe: extracted from our own source file
    expect(regex.test('+54 11 1234-5678')).toBe(true);
    expect(regex.test('1112345678')).toBe(true);
    expect(regex.test('abc')).toBe(false);
    expect(regex.test('12')).toBe(false); // too short
  });
});

// --- A1.3: dentist/modules/data-manager.js uses DentistAPI.getById, not findById ---
describe('A1.3 DentistDataManager: uses DentistAPI.getById (not findById)', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'js', 'dentist', 'modules', 'data-manager.js'),
    'utf8',
  );

  test('does NOT call DentistAPI.findById', () => {
    expect(src).not.toContain('DentistAPI.findById');
  });

  test('calls DentistAPI.getById in loadDentistById', () => {
    const block = src.slice(src.indexOf('loadDentistById'), src.indexOf('loadDentistById') + 900);
    expect(block).toContain('DentistAPI.getById');
  });
});

// --- A1.4: appointment-api.js has credentials:"include" on ALL fetch calls ---
describe('A1.4 appointment-api.js: all fetch calls include credentials:"include"', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'js', 'api', 'appointment-api.js'),
    'utf8',
  );

  // Count fetch calls and credentials occurrences
  const fetchCallCount = (src.match(/await fetch\(/g) || []).length;
  const credentialsCount = (src.match(/credentials:\s*["']include["']/g) || []).length;

  test('has at least 7 fetch calls (getAll, getById, create, update, delete, getByDentist, getByPatient, getByDate)', () => {
    expect(fetchCallCount).toBeGreaterThanOrEqual(7);
  });

  test('every fetch call has credentials:"include" (count must match)', () => {
    expect(credentialsCount).toBe(fetchCallCount);
  });
});

// --- A2.2: config.js does NOT log raw JWT token on 403 ---
describe('A2.2 api/config.js: no raw JWT logged on 403 response', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'js', 'api', 'config.js'),
    'utf8',
  );

  test('does NOT call logger.error with authToken', () => {
    // The removed line was: logger.error("Token actual:", localStorage.getItem("authToken"))
    expect(src).not.toMatch(/logger\.error\([^)]*authToken[^)]*\)/);
  });

  test('still logs the role on 403 (safe line must remain)', () => {
    expect(src).toMatch(/localStorage\.getItem\(['"]userRole['"]\)/);
  });
});
