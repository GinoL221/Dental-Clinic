// Full-stack clinical workflow journeys: confirmed deletion + 409 conflict
// feedback, appointment status transitions, dentist specialty management,
// and end-to-end logout cookie clearing.
import {
  test,
  expect,
  nextUtcWeekday,
  toIsoDate,
  pickBookableTime,
  backendUrl,
  readAuthToken,
} from "./fixtures/e2e.js";
import { LoginPage } from "./pages/login.js";
import { BookingPage } from "./pages/booking.js";
import { AppointmentsPage } from "./pages/appointments.js";
import { ListPage } from "./pages/lists.js";

test("logout clears session cookies, revokes backend JWT, and blocks subsequent access", async ({
  page,
  request,
}) => {
  // Use an isolated disposable account so server-side logout token revocation
  // does not invalidate the shared E2E_ADMIN_EMAIL storageState used by other tests.
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `e2e.logout.${suffix}@dentalclinic.test`;
  const password = "LogoutE2e123!";
  const cardIdentity = Number(suffix.slice(-8));

  const regRes = await request.post(`${backendUrl()}/api/auth/register`, {
    data: {
      firstName: "Logout",
      lastName: "Tester",
      email,
      password,
      cardIdentity,
    },
  });
  expect(regRes.status()).toBe(200);

  const login = new LoginPage(page);
  await login.goto();
  await login.login(email, password);
  await expect(page).toHaveURL(/\/$/);

  const tokenBeforeLogout = await readAuthToken(page);
  expect(tokenBeforeLogout).toBeTruthy();

  await page.locator(".user-dropdown > button.dropdown-toggle").click();
  await page
    .locator('form[action="/users/logout"] button[type="submit"]')
    .click();

  await expect(page).toHaveURL(/\/$/);
  const tokenAfterLogout = await readAuthToken(page);
  expect(tokenAfterLogout).toBeNull();

  // Backend JWT issued before logout must be rejected with 401
  const meAfterLogout = await request.get(`${backendUrl()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${tokenBeforeLogout}` },
  });
  expect(meAfterLogout.status()).toBe(401);

  await page.goto("/appointments");
  await expect(page).toHaveURL(/\/login$/);
});

test("appointment status transition (SCHEDULED -> IN_PROGRESS -> COMPLETED) persists and removes status selector on terminal state", async ({
  adminPage,
}) => {
  const date = toIsoDate(nextUtcWeekday());
  const time = pickBookableTime();
  const description = `E2E status transition ${Date.now()}`;

  const booking = new BookingPage(adminPage);
  await booking.goto();
  await booking.selectPatientContaining("E2E Patient");
  await booking.selectDentistContaining("E2E Dentist");
  await booking.fillSlot({ date, time, description });
  await booking.submit();
  await expect(adminPage).toHaveURL(/\/appointments$/);

  const appointments = new AppointmentsPage(adminPage);
  const row = await appointments.readRow(description);
  expect(row.id).not.toBeNull();

  const token = await readAuthToken(adminPage);
  expect(token).toBeTruthy();
  const headers = { Authorization: `Bearer ${token}` };

  try {
    // SCHEDULED -> IN_PROGRESS
    await adminPage.goto(`/appointments/edit/${row.id}`);
    await adminPage.selectOption("#statusSelect", "IN_PROGRESS");
    await adminPage.click('.auth-form button[type="submit"]');
    await expect(adminPage).toHaveURL(/\/appointments$/);

    let apiRes = await adminPage.request.get(
      `${backendUrl()}/api/appointments/${row.id}`,
      { headers },
    );
    expect(apiRes.ok()).toBe(true);
    expect((await apiRes.json()).status).toBe("IN_PROGRESS");

    // IN_PROGRESS -> COMPLETED (terminal)
    await adminPage.goto(`/appointments/edit/${row.id}`);
    await adminPage.selectOption("#statusSelect", "COMPLETED");
    await adminPage.click('.auth-form button[type="submit"]');
    await expect(adminPage).toHaveURL(/\/appointments$/);

    apiRes = await adminPage.request.get(
      `${backendUrl()}/api/appointments/${row.id}`,
      { headers },
    );
    expect(apiRes.ok()).toBe(true);
    expect((await apiRes.json()).status).toBe("COMPLETED");

    // Terminal state renders read-only badge and no #statusSelect
    await adminPage.goto(`/appointments/edit/${row.id}`);
    await expect(adminPage.locator("#statusSelect")).toHaveCount(0);
    await expect(
      adminPage.locator(".auth-help-text", { hasText: "estado final" }),
    ).toBeVisible();
  } finally {
    await adminPage.request.delete(
      `${backendUrl()}/api/appointments/${row.id}`,
      { headers },
    );
  }
});

test("confirmed deletion removes an appointment and deleting a patient with appointments surfaces 409 error", async ({
  adminPage,
}) => {
  const date = toIsoDate(nextUtcWeekday());
  const time = pickBookableTime();
  const description = `E2E delete flow ${Date.now()}`;

  const booking = new BookingPage(adminPage);
  await booking.goto();
  await booking.selectPatientContaining("E2E Patient");
  await booking.selectDentistContaining("E2E Dentist");
  await booking.fillSlot({ date, time, description });
  await booking.submit();
  await expect(adminPage).toHaveURL(/\/appointments$/);

  const appointments = new AppointmentsPage(adminPage);
  const createdRow = appointments.rowByDescription(description);
  await expect(createdRow).toBeVisible();

  await createdRow.locator('button[title="Eliminar"]').click();
  const dialog = adminPage.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Confirmar" }).click();

  await expect(appointments.rowByDescription(description)).toHaveCount(0);

  // Seeded E2E Patient still has the seeded 10:00 appointment -> DELETE must return 409 feedback
  const patients = new ListPage(adminPage, "/patients");
  await patients.goto();
  const seededPatientRow = adminPage.locator("table tbody tr", {
    hasText: "E2E Patient",
  });
  await seededPatientRow.locator('button[title="Eliminar"]').click();

  const patientDialog = adminPage.getByRole("dialog");
  await expect(patientDialog).toBeVisible();
  await patientDialog.getByRole("button", { name: "Confirmar" }).click();

  const alert = adminPage.locator('.alert-danger[role="alert"]');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(/turno|asociad|eliminar/i);
  await expect(seededPatientRow).toBeVisible();
});

test("ADMIN can create, assign, and remove a specialty on /dentists/edit/{id}", async ({
  adminPage,
}) => {
  const token = await readAuthToken(adminPage);
  expect(token).toBeTruthy();
  const headers = { Authorization: `Bearer ${token}` };

  const dentistsRes = await adminPage.request.get(
    `${backendUrl()}/api/dentists`,
    { headers },
  );
  expect(dentistsRes.ok()).toBe(true);
  const dentists = await dentistsRes.json();
  const dentist = dentists.find(
    (/** @type {any} */ d) => d.email === "e2e.dentist@dentalclinic.test",
  );
  expect(dentist?.id).toBeTruthy();

  const specialtyName = `Ortodoncia E2E ${Date.now()}`;

  try {
    await adminPage.goto(`/dentists/edit/${dentist.id}`);
    await adminPage
      .getByRole("button", { name: "+ Nueva especialidad" })
      .click();
    await adminPage.fill("#newSpecialtyName", specialtyName);
    await adminPage.fill(
      "#newSpecialtyDescription",
      "Especialidad de prueba E2E",
    );
    await adminPage.getByRole("button", { name: "Crear y asignar" }).click();

    const chip = adminPage.locator(".auth-specialty-chip", {
      hasText: specialtyName,
    });
    await expect(chip).toBeVisible();

    await chip
      .getByRole("button", { name: `Quitar especialidad ${specialtyName}` })
      .click();
    await expect(chip).toHaveCount(0);
  } finally {
    const specsRes = await adminPage.request.get(
      `${backendUrl()}/api/specialties`,
      { headers },
    );
    if (specsRes.ok()) {
      const specs = await specsRes.json();
      const created = Array.isArray(specs)
        ? specs.find((/** @type {any} */ s) => s.name === specialtyName)
        : null;
      if (created?.id) {
        await adminPage.request.delete(
          `${backendUrl()}/api/specialties/dentists/${dentist.id}/specialties/${created.id}`,
          { headers },
        );
        await adminPage.request.delete(
          `${backendUrl()}/api/specialties/${created.id}`,
          { headers },
        );
      }
    }
  }
});
