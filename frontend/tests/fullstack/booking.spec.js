// Full-stack booking journey (task 3.3). Reuses the admin session created by
// auth.setup.js (adminPage fixture) — auth.spec.js already proves login
// itself. Creates via the real UI form, then proves persistence two ways: the
// rendered /appointments row, and an authenticated GET /api/appointments/{id}
// lookup — a heading alone is never accepted as proof (design.md).
import {
  test,
  expect,
  nextUtcWeekday,
  toIsoDate,
  pickBookableTime,
  backendUrl,
  readAuthToken,
} from './fixtures/e2e.js';
import { BookingPage } from './pages/booking.js';
import { AppointmentsPage } from './pages/appointments.js';

test('UI booking proves persistence and rendering, not just a heading', async ({ adminPage }) => {
  // Same next-UTC-weekday slot as the seeded appointment, but a time that
  // never collides with the seeded 10:00 slot nor a previous run's booking
  // against the same live backend, and a unique description so this run's
  // row is unambiguous among any others.
  const date = toIsoDate(nextUtcWeekday());
  const time = pickBookableTime();
  const description = `E2E booking journey ${Date.now()}`;

  const booking = new BookingPage(adminPage);
  await booking.goto();
  await booking.selectPatientContaining('E2E Patient');
  await booking.selectDentistContaining('E2E Dentist');
  await booking.fillSlot({ date, time, description });
  await booking.submit();
  await expect(adminPage).toHaveURL(/\/appointments$/);

  const appointments = new AppointmentsPage(adminPage);
  const row = await appointments.readRow(description);
  expect(row.id, 'edit link must expose a numeric id').not.toBeNull();
  expect(row.date).toBe(date);
  expect(row.time).toBe(time);
  expect(row.description).toBe(description);

  const token = await readAuthToken(adminPage);
  const response = await adminPage.request.get(`${backendUrl()}/api/appointments/${row.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status()).toBe(200);

  const persisted = await response.json();
  expect(persisted.id).toBe(row.id);
  expect(persisted.date).toBe(date);
  expect(persisted.time).toBe(time);
  expect(persisted.description).toBe(description);
  expect(persisted.status).toBe('SCHEDULED');
});
