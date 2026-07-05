/**
 * Tests for the Appointment request-shape changes (Slice A1 of the
 * appointment-validation-orchestration SDD change).
 * Strategy: static source analysis (same pattern as
 * patient-api-request-shape.test.js / dentist-api-request-shape.test.js) —
 * these modules are browser ES modules that can't be required directly by
 * Node/Jest without heavy DOM/fetch mocking, so we assert on the source text
 * for deterministic RED/GREEN cycles.
 */

const fs = require("fs");
const path = require("path");

const appointmentApiPath = path.join(
  __dirname,
  "..",
  "public",
  "js",
  "api",
  "appointment-api.js"
);
const appointmentApiSrc = fs.readFileSync(appointmentApiPath, "utf8");

const formManagerPath = path.join(
  __dirname,
  "..",
  "public",
  "js",
  "appointment",
  "modules",
  "form-manager.js"
);
const formManagerSrc = fs.readFileSync(formManagerPath, "utf8");

const validationManagerPath = path.join(
  __dirname,
  "..",
  "public",
  "js",
  "appointment",
  "modules",
  "validation-manager.js"
);
const validationManagerSrc = fs.readFileSync(validationManagerPath, "utf8");

describe("AppointmentAPI.update: PUT /api/appointments/{id}, id not in body", () => {
  const updateBlock = appointmentApiSrc.slice(
    appointmentApiSrc.indexOf("async update("),
    appointmentApiSrc.indexOf("// Eliminar una cita")
  );

  test("targets /api/appointments/${targetId} (path id, not the bare collection URL)", () => {
    expect(updateBlock).toContain(
      "`${API_BASE_URL}/api/appointments/${targetId}`"
    );
    expect(updateBlock).not.toContain("`${API_BASE_URL}/api/appointments`");
  });

  test("strips id from the outgoing body before serializing", () => {
    expect(updateBlock).toMatch(/delete\s+\w+\.id/);
  });

  test("keeps the existing 409 conflict message", () => {
    expect(updateBlock).toContain("Ya existe una cita en esa fecha y hora");
  });
});

describe("AppointmentAPI.validateAppointmentData reads camelCase ids", () => {
  const validateBlock = appointmentApiSrc.slice(
    appointmentApiSrc.indexOf("validateAppointmentData(appointment"),
    appointmentApiSrc.indexOf("formatAppointmentDisplay")
  );

  test("reads appointment.dentistId, not appointment.dentist_id", () => {
    expect(validateBlock).toContain("appointment.dentistId");
    expect(validateBlock).not.toContain("appointment.dentist_id");
  });

  test("reads appointment.patientId, not appointment.patient_id", () => {
    expect(validateBlock).toContain("appointment.patientId");
    expect(validateBlock).not.toContain("appointment.patient_id");
  });
});

describe("AppointmentFormManager.getFormData builds camelCase payload keys", () => {
  test("builds dentistId, not dentist_id", () => {
    expect(formManagerSrc).toContain("dentistId: parseInt(dentistSelect?.value)");
    expect(formManagerSrc).not.toContain("dentist_id: parseInt(dentistSelect?.value)");
  });

  test("builds patientId, not patient_id", () => {
    expect(formManagerSrc).toContain("patientId: parseInt(patientSelect.value)");
    expect(formManagerSrc).toContain("patientId: patientId,");
    expect(formManagerSrc).not.toMatch(/patient_id:\s*parseInt\(patientSelect\.value\)/);
    expect(formManagerSrc).not.toMatch(/patient_id:\s*patientId,/);
  });

  test("validateFormData reads camelCase ids", () => {
    expect(formManagerSrc).toContain("data.dentistId");
    expect(formManagerSrc).toContain("data.patientId");
    expect(formManagerSrc).not.toContain("data.dentist_id");
    expect(formManagerSrc).not.toContain("data.patient_id");
  });
});

describe("AppointmentValidationManager.validateAppointmentData reads camelCase ids", () => {
  test("reads data.dentistId, not data.dentist_id", () => {
    expect(validationManagerSrc).toContain("data.dentistId");
    expect(validationManagerSrc).not.toContain("data.dentist_id");
  });

  test("reads data.patientId, not data.patient_id", () => {
    expect(validationManagerSrc).toContain("data.patientId");
    expect(validationManagerSrc).not.toContain("data.patient_id");
  });
});
