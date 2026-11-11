# Frontend Permissions, Flows and Known Gaps Remediation

Branch feat/frontend-permissions-and-flows (from main 63ff174). Remediation of frontend 500 loaders, dentist own-profile access, role-based button visibility, and accessibility warnings (Phase 3 of project plan).

## Specs

- S1 (Brecha G2): `/appointments/add` loader must not call `GET /api/patients` when the authenticated user has role `PATIENT`. The view must display the patient's own information and bind their ID, avoiding 500 errors.
- S2: `DentistController.findById` (`GET /api/dentists/{id}`) must permit `hasAnyRole('ADMIN','DENTIST')` with IDOR check, enabling dentists to read their own profile for `/dentists/edit/[id]`.
- S3 (Brechas G3 & G4): List views (`/patients`, `/dentists`, `/appointments`) must only render action buttons («Agregar», «Eliminar») when the current user has backend authorization for that operation.
- S4 (Brecha G7): Add `aria-label="Editar turno"` to the icon-only edit button in `dashboard/+page.svelte:637`, resolving the Svelte compiler a11y warning.
- S5 (Brecha G1): Align demo credentials in `frontend/src/routes/+page.svelte` with actual seeded users in `DataInitializer.java` (`admin@dentalclinic.com` / `admin123`, `maria.gonzalez@dentalclinic.com` / `maria123`, `juan.perez@email.com` / `juan123`).

## Tasks

- [x] T1 (S1) Fix G2: appointments/add loader for PATIENT and form binding — route: inline — commit: this commit
- [x] T2 (S2) Allow DENTIST self-lookup on GET /api/dentists/{id} with IDOR guard and test — route: inline — commit: this commit
- [x] T3 (S3) Hide unauthorized action buttons by role in list views — route: inline — commit: this commit
- [x] T4 (S4) Fix G7: accessible aria-label on dashboard edit button — route: inline — commit: this commit
- [x] T5 (S5) Fix G1: align landing demo credentials with seed users — route: inline — commit: this commit
- [x] T6 (S1-S5) Full verification, format checks, and work-unit commits — route: inline — commit: this closing commit

## Log

- L1: User approved Phase 3: "si" to create feat/frontend-permissions-and-flows from main (63ff174).
- L2: T1 implemented: appointments/add loader avoids /api/patients for PATIENT role, and page auto-binds user.id; verified with 6 unit tests.
- L3: T2 implemented: DentistController.findById permits hasAnyRole('ADMIN','DENTIST') with IDOR guard; verified with 10 tests in DentistControllerAuthzTest.
- L4: T3 implemented: list views patients, dentists, appointments hide unauthorized Add/Delete/Edit buttons by user role; server tests updated.
- L5: T4 implemented: aria-label added to edit button in dashboard/+page.svelte:637, svelte-check now reports 0 errors and 0 warnings.
- L6: T5 implemented: landing page demo credentials aligned with DataInitializer seed users.
- L7: T6 verified: 266 backend tests pass, 132 frontend tests pass, svelte-check 0 errors 0 warnings, Prettier passes.
