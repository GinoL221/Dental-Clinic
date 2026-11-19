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
