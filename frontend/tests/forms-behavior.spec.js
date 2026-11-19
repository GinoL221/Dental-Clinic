import { test, expect } from "@playwright/test";

const BACKEND_URL = `http://127.0.0.1:${process.env.E2E_BACKEND_PORT || 8080}`;

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
async function loginAs(page, email, password, forceSubmit = false) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('.auth-form button[type="submit"]', { force: forceSubmit });
}

test.describe("Formularios con campos bloqueados por rol (Mock E2E)", () => {
  test.beforeEach(async ({ request }) => {
    await request.post(`${BACKEND_URL}/api/__test/reset`);
  });

  test("DENTIST en /dentists/edit/2 tiene matrícula y email bloqueados y envía valores únicos por hidden mirrors", async ({
    page,
    request,
  }) => {
    await loginAs(page, "dentist@dentalclinic.com", "Dentist123!");
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/dentists/edit/2");

    const regInput = page.locator("#registrationNumber");
    const emailInput = page.locator("#email");
    await expect(regInput).toBeDisabled();
    await expect(emailInput).toBeDisabled();
    await expect(page.locator("#registrationNumber-role-note")).toContainText(
      "Solo lectura para el odontólogo",
    );
    await expect(page.locator("#email-role-note")).toContainText(
      "Solo lectura para el odontólogo",
    );

    await page.fill("#firstName", "María Editada");
    await page.click('form[action="?/update"] button[type="submit"]');

    await expect(page).toHaveURL(/\/dentists$/);

    const inspectRes = await request.get(
      `${BACKEND_URL}/api/__test/last-requests`,
    );
    expect(inspectRes.ok()).toBe(true);
    const { lastDentistUpdate } = await inspectRes.json();
    expect(lastDentistUpdate).toEqual({
      firstName: "María Editada",
      lastName: "González",
      email: "dentist@dentalclinic.com",
      registrationNumber: "MAT-2002",
    });
  });

  test("DENTIST en /appointments/edit/1 tiene odontólogo bloqueado y envía dentistId único por hidden mirror", async ({
    page,
    request,
  }) => {
    await loginAs(page, "dentist@dentalclinic.com", "Dentist123!");
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/appointments/edit/1");

    const dentistSelect = page.locator("#dentistId");
    await expect(dentistSelect).toBeDisabled();
    await expect(page.locator("#dentistId-role-note")).toContainText(
      "No podés reasignar el odontólogo del turno.",
    );

    await page.fill("#description", "Control actualizado");
    await page.click('.auth-form button[type="submit"]');

    await expect(page).toHaveURL(/\/appointments$/);

    const inspectRes = await request.get(
      `${BACKEND_URL}/api/__test/last-requests`,
    );
    expect(inspectRes.ok()).toBe(true);
    const { lastAppointmentUpdate } = await inspectRes.json();
    expect(lastAppointmentUpdate.dentistId).toBe(2);
    expect(lastAppointmentUpdate.description).toBe("Control actualizado");
  });
});

test.describe("appointments/edit/1 preserva oldData sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("Tras fallo del servidor en SSR, conserva patientId, dentistId, status y description", async ({
    page,
    request,
  }) => {
    await request.post(`${BACKEND_URL}/api/__test/reset`);

    await loginAs(page, "admin@dentalclinic.com", "Admin123!", true);
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/appointments/edit/1");

    await page.selectOption("#patientSelect", "2");
    await page.selectOption("#dentistId", "1");
    await page.selectOption("#statusSelect", "IN_PROGRESS");
    await page.fill("#description", "TRIGGER_ERROR");
    await page.click('.auth-form button[type="submit"]', { force: true });

    const alert = page.locator(".alert-danger");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Horario no disponible");

    await expect(page.locator("#patientSelect")).toHaveValue("2");
    await expect(page.locator("#dentistId")).toHaveValue("1");
    await expect(page.locator("#statusSelect")).toHaveValue("IN_PROGRESS");
    await expect(page.locator("#description")).toHaveValue("TRIGGER_ERROR");
  });
});
