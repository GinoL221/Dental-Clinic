/**
 * @jest-environment jsdom
 *
 * TDD — XSS safe-DOM conversion for patient list rendering
 * (SDD change: frontend-xss-token-hardening, Phase 3, tasks 3.1-3.3)
 *
 * createPatientTableRow currently builds the row via a single template-literal
 * `row.innerHTML = \`...${formattedPatient.fullName}...${patient.email}...\``.
 * A patient record whose fullName/email contains markup is parsed as live HTML
 * by the browser. This test asserts the safe-DOM contract: no <script> element
 * is ever created from row content, and the rendered text equals the raw
 * payload string verbatim (proving it went through a text-only channel such
 * as textContent, never HTML parsing).
 */

import PatientUIManager from "../public/js/patient/modules/ui-manager.js";

describe("PatientUIManager.createPatientTableRow — XSS safe-DOM rendering", () => {
  let uiManager;

  beforeEach(() => {
    uiManager = new PatientUIManager();
  });

  test("a <script> payload in fullName renders as inert text, not as an executable element", () => {
    const payload = "<script>alert(1)</script>";
    const patient = {
      id: 1,
      firstName: payload,
      lastName: "",
      email: "safe@example.com",
      cardIdentity: 12345678,
      admissionDate: "2024-01-15",
    };

    const row = uiManager.createPatientTableRow(patient, 0);

    expect(row.querySelector("script")).toBeNull();
    const nameCell = row.querySelector(".patient-full-name");
    expect(nameCell.textContent).toBe(payload);
  });

  test("an onerror img payload in email renders as inert text and creates no img element", () => {
    const payload = '"><img src=x onerror=alert(1)>';
    const patient = {
      id: 2,
      firstName: "Ana",
      lastName: "Gomez",
      email: payload,
      cardIdentity: 87654321,
      admissionDate: "2024-02-20",
    };

    const row = uiManager.createPatientTableRow(patient, 1);

    expect(row.querySelector("img")).toBeNull();
    const emailCell = row.querySelector(".patient-email-text");
    expect(emailCell.textContent).toBe(payload);
  });

  test("a markup-free patient still renders the expected visible text and action buttons", () => {
    const patient = {
      id: 3,
      firstName: "Carlos",
      lastName: "Diaz",
      email: "carlos.diaz@example.com",
      cardIdentity: 30111222,
      admissionDate: "2024-03-10",
    };

    const row = uiManager.createPatientTableRow(patient, 2);

    expect(row.querySelector(".patient-full-name").textContent).toBe(
      "Carlos Diaz"
    );
    expect(row.querySelector(".patient-email-text").textContent).toBe(
      "carlos.diaz@example.com"
    );
    expect(row.querySelector(".patient-id").textContent).toBe("3");

    const editButton = row.querySelector(
      'button[onclick="editPatient(3)"]'
    );
    const deleteButton = row.querySelector(
      'button[onclick="deletePatient(3)"]'
    );
    expect(editButton).not.toBeNull();
    expect(deleteButton).not.toBeNull();
  });
});

describe("PatientUIManager.displayStats — XSS safe-DOM rendering for province labels", () => {
  let uiManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="patientStats">
        <div id="statsContent"></div>
      </div>
    `;
    uiManager = new PatientUIManager();
  });

  test("an <img onerror> payload as a byProvince key renders as inert escaped text, not as an executable element", () => {
    const payload = "<img src=x onerror=alert(1)>";
    const stats = {
      total: 5,
      withAddress: 3,
      recentAdmissions: 1,
      byProvince: {
        [payload]: 2,
      },
    };

    uiManager.displayStats(stats);

    const statsContent = document.getElementById("statsContent");
    expect(statsContent.querySelector("img")).toBeNull();
    expect(statsContent.textContent).toContain(payload);
  });

  test("a normal province key still renders its label and count correctly", () => {
    const stats = {
      total: 5,
      withAddress: 3,
      recentAdmissions: 1,
      byProvince: {
        "Buenos Aires": 4,
        Cordoba: 1,
      },
    };

    uiManager.displayStats(stats);

    const statsContent = document.getElementById("statsContent");
    expect(statsContent.textContent).toContain("Buenos Aires: 4");
    expect(statsContent.textContent).toContain("Cordoba: 1");
  });
});

describe("PatientUIManager.createPatientTableRow — null/undefined field resilience", () => {
  let uiManager;

  beforeEach(() => {
    uiManager = new PatientUIManager();
  });

  test("an undefined email renders as empty text, not the literal string 'undefined'", () => {
    const patient = {
      id: 4,
      firstName: "Lucas",
      lastName: "Fernandez",
      email: undefined,
      cardIdentity: 11223344,
      admissionDate: "2024-04-05",
    };

    const row = uiManager.createPatientTableRow(patient, 3);

    const emailCell = row.querySelector(".patient-email-text");
    expect(emailCell.textContent).toBe("");
  });
});
