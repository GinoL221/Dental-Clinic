import { test, expect, backendUrl, readAuthToken } from "./fixtures/e2e.js";

test("PATIENT en /patients/edit/{id} tiene DNI y email bloqueados y preserva valores al actualizar nombre", async ({
  nonAdminPage,
}) => {
  const token = await readAuthToken(nonAdminPage);
  expect(token).toBeTruthy();
  const headers = { Authorization: `Bearer ${token}` };

  const meRes = await nonAdminPage.request.get(`${backendUrl()}/api/auth/me`, {
    headers,
  });
  expect(meRes.ok()).toBe(true);
  const me = await meRes.json();
  const patientId = me.id;

  const origRes = await nonAdminPage.request.get(
    `${backendUrl()}/api/patients/${patientId}`,
    { headers },
  );
  expect(origRes.ok()).toBe(true);
  const originalPatient = await origRes.json();

  try {
    await nonAdminPage.goto(`/patients/edit/${patientId}`);

    await expect(nonAdminPage.locator("#cardIdentity")).toBeDisabled();
    await expect(nonAdminPage.locator("#email")).toBeDisabled();
    await expect(nonAdminPage.locator("#cardIdentity-role-note")).toContainText(
      "Solo lectura para el paciente",
    );
    await expect(nonAdminPage.locator("#email-role-note")).toContainText(
      "Solo lectura para el paciente",
    );

    const updatedFirstName = "PacienteEditadoE2E";
    await nonAdminPage.fill("#firstName", updatedFirstName);
    await expect(nonAdminPage.locator("#firstName")).toHaveValue(
      updatedFirstName,
    );
    await nonAdminPage.click('.auth-form button[type="submit"]');

    await expect(nonAdminPage).toHaveURL(/\/patients$/);

    const afterRes = await nonAdminPage.request.get(
      `${backendUrl()}/api/patients/${patientId}`,
      { headers },
    );
    expect(afterRes.ok()).toBe(true);
    const updatedPatient = await afterRes.json();
    expect(updatedPatient.firstName).toBe(updatedFirstName);
  } finally {
    const restoreRes = await nonAdminPage.request.put(
      `${backendUrl()}/api/patients/${patientId}`,
      {
        headers,
        data: {
          firstName: originalPatient.firstName,
          lastName: originalPatient.lastName,
          email: originalPatient.email,
          cardIdentity: originalPatient.cardIdentity,
          admissionDate: originalPatient.admissionDate,
          ...(originalPatient.address
            ? { address: originalPatient.address }
            : {}),
        },
      },
    );
    expect(restoreRes.ok()).toBe(true);
  }
});

test("DENTIST en /dentists/edit/{id} tiene matrícula y email bloqueados y preserva valores al actualizar nombre", async ({
  dentistPage,
}) => {
  const token = await readAuthToken(dentistPage);
  expect(token).toBeTruthy();
  const headers = { Authorization: `Bearer ${token}` };

  const meRes = await dentistPage.request.get(`${backendUrl()}/api/auth/me`, {
    headers,
  });
  expect(meRes.ok()).toBe(true);
  const me = await meRes.json();
  const dentistId = me.id;

  const origRes = await dentistPage.request.get(
    `${backendUrl()}/api/dentists/${dentistId}`,
    { headers },
  );
  expect(origRes.ok()).toBe(true);
  const originalDentist = await origRes.json();

  try {
    await dentistPage.goto(`/dentists/edit/${dentistId}`);

    await expect(dentistPage.locator("#registrationNumber")).toBeDisabled();
    await expect(dentistPage.locator("#email")).toBeDisabled();
    await expect(
      dentistPage.locator("#registrationNumber-role-note"),
    ).toContainText("Solo lectura para el odontólogo");
    await expect(dentistPage.locator("#email-role-note")).toContainText(
      "Solo lectura para el odontólogo",
    );

    const updatedFirstName = "OdontologoEditadoE2E";
    await dentistPage.fill("#firstName", updatedFirstName);
    await expect(dentistPage.locator("#firstName")).toHaveValue(
      updatedFirstName,
    );
    await dentistPage.click('form[action="?/update"] button[type="submit"]');

    await expect(dentistPage).toHaveURL(/\/dentists$/);

    const afterRes = await dentistPage.request.get(
      `${backendUrl()}/api/dentists/${dentistId}`,
      { headers },
    );
    expect(afterRes.ok()).toBe(true);
    const updatedDentist = await afterRes.json();
    expect(updatedDentist.firstName).toBe(updatedFirstName);
    expect(updatedDentist.email).toBe(originalDentist.email);
    expect(updatedDentist.registrationNumber).toBe(
      originalDentist.registrationNumber,
    );
  } finally {
    const restoreRes = await dentistPage.request.put(
      `${backendUrl()}/api/dentists/${dentistId}`,
      {
        headers,
        data: {
          firstName: originalDentist.firstName,
          lastName: originalDentist.lastName,
          email: originalDentist.email,
          registrationNumber: originalDentist.registrationNumber,
        },
      },
    );
    expect(restoreRes.ok()).toBe(true);
  }
});

test("DENTIST en /appointments/edit/{id} tiene odontólogo bloqueado y preserva dentistId al actualizar descripción", async ({
  dentistPage,
}) => {
  const token = await readAuthToken(dentistPage);
  expect(token).toBeTruthy();
  const headers = { Authorization: `Bearer ${token}` };

  const listRes = await dentistPage.request.get(
    `${backendUrl()}/api/appointments`,
    { headers },
  );
  expect(listRes.ok()).toBe(true);
  const appointments = await listRes.json();
  expect(Array.isArray(appointments) && appointments.length > 0).toBe(true);
  const originalAppointment = appointments[0];
  const appointmentId = originalAppointment.id;

  try {
    await dentistPage.goto(`/appointments/edit/${appointmentId}`);

    await expect(dentistPage.locator("#dentistId")).toBeDisabled();
    await expect(dentistPage.locator("#dentistId-role-note")).toContainText(
      "No podés reasignar el odontólogo del turno.",
    );

    const updatedDescription = "Descripción actualizada por odontólogo E2E";
    await dentistPage.fill("#description", updatedDescription);
    await expect(dentistPage.locator("#description")).toHaveValue(
      updatedDescription,
    );
    await dentistPage.click('.auth-form button[type="submit"]');

    await expect(dentistPage).toHaveURL(/\/appointments$/);

    const afterRes = await dentistPage.request.get(
      `${backendUrl()}/api/appointments/${appointmentId}`,
      { headers },
    );
    expect(afterRes.ok()).toBe(true);
    const updatedAppointment = await afterRes.json();
    expect(updatedAppointment.description).toBe(updatedDescription);
    expect(updatedAppointment.dentistId).toBe(originalAppointment.dentistId);
  } finally {
    const restoreRes = await dentistPage.request.put(
      `${backendUrl()}/api/appointments/${appointmentId}`,
      {
        headers,
        data: {
          patientId: originalAppointment.patientId,
          dentistId: originalAppointment.dentistId,
          date: originalAppointment.date,
          time: originalAppointment.time,
          description: originalAppointment.description,
        },
      },
    );
    expect(restoreRes.ok()).toBe(true);
  }
});
