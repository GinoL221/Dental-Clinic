/**
 * @jest-environment jsdom
 *
 * TDD — XSS safe-DOM conversion for appointment list rendering
 * (SDD change: frontend-xss-token-hardening, Phase 3, tasks 3.4-3.6)
 *
 * displayAppointments currently builds each row as a template-literal HTML
 * string (joined and assigned via `tbody.innerHTML = htmlContent`), so a
 * patientName/patientEmail/description containing markup is parsed as live
 * HTML. The delete button is also built by string-interpolating patientName
 * directly into an inline `onclick="...patientName..."` attribute — a name
 * containing `'`, `"`, or `</script>` can break out of that attribute string
 * and alter or inject a handler.
 *
 * This test asserts: (1) markup in patientName/patientEmail/description
 * renders as inert text, no extra elements created; (2) the delete button is
 * wired via addEventListener with the appointment id + patientName passed
 * through a JS closure, never through a string-built onclick attribute; (3)
 * a patientName containing attribute-breaking characters cannot alter the
 * handler and the button still targets the correct appointment.
 */

import AppointmentUIManager from "../public/js/appointment/modules/ui-manager.js";

describe("AppointmentUIManager.displayAppointments — XSS safe-DOM rendering", () => {
  let uiManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <table>
        <tbody id="appointments-table-body"></tbody>
      </table>
      <div id="no-appointments" style="display: none;"></div>
    `;
    uiManager = new AppointmentUIManager();
    window.confirmDeleteAppointment = jest.fn();
  });

  afterEach(() => {
    delete window.confirmDeleteAppointment;
  });

  test("markup in patientName/patientEmail/description renders as inert text, no script/img element created", async () => {
    const scriptPayload = "<script>alert(1)</script>";
    const imgPayload = '"><img src=x onerror=alert(1)>';
    const descriptionPayload = "<b>bold</b><script>alert(2)</script>";

    const appointments = [
      {
        id: 10,
        dentist_id: 1,
        patient_id: 100,
        date: "2024-05-01",
        time: "10:00:00",
        description: descriptionPayload,
      },
    ];
    const dentists = [{ id: 1, firstName: "Laura", lastName: "Perez" }];
    const patients = [
      {
        id: 100,
        firstName: scriptPayload,
        lastName: "",
        email: imgPayload,
      },
    ];

    await uiManager.displayAppointments(appointments, dentists, patients);

    const tbody = document.getElementById("appointments-table-body");
    expect(tbody.querySelector("script")).toBeNull();
    expect(tbody.querySelector("img")).toBeNull();
    expect(tbody.querySelector("b")).toBeNull();

    const row = tbody.querySelector("tr");
    const cells = row.querySelectorAll("td");
    // index 1 = patient name cell, index 2 = email cell, index 6 = description cell
    expect(cells[1].textContent).toBe(scriptPayload);
    expect(cells[2].textContent).toBe(imgPayload);
    expect(cells[6].textContent).toBe(descriptionPayload);
  });

  test("delete button invokes confirmDeleteAppointment(id, patientName) via closure, with no string-built onclick attribute", async () => {
    const appointments = [
      {
        id: 42,
        dentist_id: 1,
        patient_id: 200,
        date: "2024-06-01",
        time: "11:30:00",
        description: "Checkup",
      },
    ];
    const dentists = [{ id: 1, firstName: "Laura", lastName: "Perez" }];
    const patients = [
      { id: 200, firstName: "Marta", lastName: "Lopez", email: "marta@example.com" },
    ];

    await uiManager.displayAppointments(appointments, dentists, patients);

    const tbody = document.getElementById("appointments-table-body");
    const deleteButton = tbody.querySelector("button.btn-outline-danger");

    expect(deleteButton).not.toBeNull();
    expect(deleteButton.getAttribute("onclick")).toBeNull();

    deleteButton.click();

    expect(window.confirmDeleteAppointment).toHaveBeenCalledTimes(1);
    expect(window.confirmDeleteAppointment).toHaveBeenCalledWith(
      42,
      "Marta Lopez"
    );
  });

  test("a patient name containing quotes and </script> cannot break the handler or alter the target appointment", async () => {
    const dangerousName = `Mal"'</script><script>alert(1)</script>`;

    const appointments = [
      {
        id: 7,
        dentist_id: 1,
        patient_id: 300,
        date: "2024-07-01",
        time: "09:00:00",
        description: "Limpieza",
      },
    ];
    const dentists = [{ id: 1, firstName: "Laura", lastName: "Perez" }];
    const patients = [
      { id: 300, firstName: dangerousName, lastName: "", email: "danger@example.com" },
    ];

    await uiManager.displayAppointments(appointments, dentists, patients);

    const tbody = document.getElementById("appointments-table-body");
    expect(tbody.querySelector("script")).toBeNull();

    const deleteButton = tbody.querySelector("button.btn-outline-danger");
    deleteButton.click();

    expect(window.confirmDeleteAppointment).toHaveBeenCalledWith(
      7,
      dangerousName
    );
  });

  test("a markup-free appointment row renders unchanged text and a working delete handler", async () => {
    const appointments = [
      {
        id: 5,
        dentist_id: 1,
        patient_id: 50,
        date: "2024-04-10",
        time: "08:15:00",
        description: "Consulta de rutina",
      },
    ];
    const dentists = [{ id: 1, firstName: "Laura", lastName: "Perez" }];
    const patients = [
      { id: 50, firstName: "Juan", lastName: "Diaz", email: "juan@example.com" },
    ];

    await uiManager.displayAppointments(appointments, dentists, patients);

    const tbody = document.getElementById("appointments-table-body");
    const row = tbody.querySelector("tr");
    const cells = row.querySelectorAll("td");

    expect(cells[1].textContent).toBe("Juan Diaz");
    expect(cells[2].textContent).toBe("juan@example.com");
    expect(cells[6].textContent).toBe("Consulta de rutina");

    const deleteButton = tbody.querySelector("button.btn-outline-danger");
    deleteButton.click();
    expect(window.confirmDeleteAppointment).toHaveBeenCalledWith(5, "Juan Diaz");
  });
});
