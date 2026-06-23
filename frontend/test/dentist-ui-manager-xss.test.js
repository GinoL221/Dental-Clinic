/**
 * @jest-environment jsdom
 *
 * TDD — XSS safe-DOM conversion for dentist list rendering
 * (SDD change: frontend-xss-token-hardening, Phase 3, tasks 3.7-3.9)
 *
 * renderDentistsTable already wraps registrationNumber/firstName/lastName in
 * this.escapeHtml(...) before interpolating them into the row's innerHTML, so
 * it is already mitigated against XSS today (per proposal: "confirmed
 * mitigated"). This is a consistency conversion — same createElement +
 * textContent pattern as patient/appointment, and removal of the now-unused
 * escapeHtml helper — not an urgent fix. Task 3.7 requires noting the
 * pass/fail baseline against the CURRENT escapeHtml-wrapped code BEFORE
 * editing.
 *
 * Baseline (recorded before any edit to dentist/modules/ui-manager.js):
 * Ran this exact test file against the untouched escapeHtml-wrapped
 * renderDentistsTable — all 3 cases ALREADY PASSED. escapeHtml correctly
 * neutralizes <script>/<img onerror> payloads via HTML-entity escaping
 * before interpolation, so querySelector("script"/"img") is null and the
 * cell shows the escaped-then-unescaped-by-the-browser text, which equals
 * the raw payload string when read back via textContent. This is expected:
 * the dentist sink was never the urgent vector (proposal explicitly says so).
 * The conversion below changes the MECHANISM (escapeHtml string concatenation
 * -> createElement/textContent) without changing this passing behavior.
 */

import DentistUIManager from "../public/js/dentist/modules/ui-manager.js";

describe("DentistUIManager.renderDentistsTable — XSS safe-DOM rendering", () => {
  let uiManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <table>
        <tbody id="dentistTableBody"></tbody>
      </table>
    `;
    uiManager = new DentistUIManager();
  });

  test("a <script> payload in firstName renders as inert text, no script element created", () => {
    const payload = "<script>alert(1)</script>";
    const dentists = [
      {
        id: 1,
        registrationNumber: "MN12345",
        firstName: payload,
        lastName: "Gomez",
      },
    ];

    uiManager.renderDentistsTable(dentists);

    const tableBody = document.getElementById("dentistTableBody");
    expect(tableBody.querySelector("script")).toBeNull();
    const row = tableBody.querySelector("tr");
    const cells = row.querySelectorAll("td");
    expect(cells[2].textContent).toBe(payload);
  });

  test("an onerror img payload in lastName renders as inert text, no img element created", () => {
    const payload = '"><img src=x onerror=alert(1)>';
    const dentists = [
      {
        id: 2,
        registrationNumber: "MN54321",
        firstName: "Lucia",
        lastName: payload,
      },
    ];

    uiManager.renderDentistsTable(dentists);

    const tableBody = document.getElementById("dentistTableBody");
    expect(tableBody.querySelector("img")).toBeNull();
    const row = tableBody.querySelector("tr");
    const cells = row.querySelectorAll("td");
    expect(cells[3].textContent).toBe(payload);
  });

  test("a markup-free dentist still renders the expected visible text and action buttons unchanged", () => {
    const dentists = [
      {
        id: 3,
        registrationNumber: "MN99999",
        firstName: "Ricardo",
        lastName: "Suarez",
      },
    ];

    uiManager.renderDentistsTable(dentists);

    const tableBody = document.getElementById("dentistTableBody");
    const row = tableBody.querySelector("tr");
    const cells = row.querySelectorAll("td");

    expect(cells[0].textContent).toBe("1");
    expect(cells[1].textContent).toBe("MN99999");
    expect(cells[2].textContent).toBe("Ricardo");
    expect(cells[3].textContent).toBe("Suarez");

    const editButton = row.querySelector('button[onclick="editDentist(3)"]');
    const deleteButton = row.querySelector(
      'button[onclick="deleteDentist(3)"]'
    );
    expect(editButton).not.toBeNull();
    expect(deleteButton).not.toBeNull();
  });
});
