/**
 * Tests for the Patient request-shape changes (Slice A of the
 * patient-dentist-request-dtos SDD change).
 * Strategy: static source analysis (same pattern as dashboard-api.test.js /
 * slice-a-fixes.test.js) — patient-api.js is a browser ES module that can't
 * be required directly by Node/Jest without heavy DOM/fetch mocking, so we
 * assert on the source text for deterministic RED/GREEN cycles.
 */

const fs = require('fs');
const path = require('path');

const patientApiPath = path.join(__dirname, '..', 'public', 'js', 'api', 'patient-api.js');
const src = fs.readFileSync(patientApiPath, 'utf8');

describe('PatientAPI.update: PUT /api/patients/{id}, id not in body', () => {
  const updateBlock = src.slice(
    src.indexOf('async update('),
    src.indexOf('// Eliminar un paciente'),
  );

  test('targets /api/patients/${targetId} (path id, not the bare collection URL)', () => {
    expect(updateBlock).toContain('`${API_BASE_URL}/api/patients/${targetId}`');
    expect(updateBlock).not.toContain('`${API_BASE_URL}/api/patients`');
  });

  test('strips id from the outgoing body before serializing', () => {
    expect(updateBlock).toContain('delete patient.id');
  });
});

describe('PatientAPI.createFromUser: canonical `location` field, no city/postalCode, address omitted when empty', () => {
  const createFromUserBlock = src.slice(
    src.indexOf('async createFromUser('),
    src.indexOf('// Validar datos del paciente'),
  );

  test('does not send a `city` key in the address payload', () => {
    expect(createFromUserBlock).not.toMatch(/\bcity:/);
  });

  test('does not send a `postalCode` key', () => {
    expect(createFromUserBlock).not.toContain('postalCode');
  });

  test('uses `location` as the canonical address field', () => {
    expect(createFromUserBlock).toContain('location');
  });

  test('omits address entirely when there is no real address data', () => {
    expect(createFromUserBlock).toMatch(
      /if\s*\(\s*street\s*\|\|\s*number\s*\|\|\s*location\s*\|\|\s*province\s*\)/,
    );
  });
});
