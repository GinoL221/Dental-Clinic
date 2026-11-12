# Backend API Consistency & Controller-Service Boundary Refactor

Branch refactor/backend-api-consistency (from main 2f92b32). Solves issues 1, 2, and 3 from the backend architectural audit:

1. Controller-service boundary: `PatientController` and `DentistController` receive DTOs, delegate to service, and return DTOs without touching JPA entities.
2. Business logic & duplicate checks: duplicate checks (email, DNI, registrationNumber) move into services throwing `DuplicateResourceException`, handled consistently as HTTP 409 Conflict.
3. HTTP responses standardization:
   - POST (create) -> 201 Created + ResponseDTO (`AppointmentController.save` standardized from 200 to 201).
   - PUT (update) -> 200 OK + ResponseDTO (`PatientController.update` and `DentistController.update` standardized from raw String to ResponseDTO).
   - DELETE (delete) -> 204 No Content + empty body (`PatientController.delete`, `DentistController.delete`, `AppointmentController.delete` standardized to 204).
   - Resource not found -> `ResourceNotFoundException` handled consistently by `GlobalExceptionHandler`.

## Specs

- S1: `PatientController` and `DentistController` must receive DTOs and return DTOs on `save` and `update`, without converting or returning JPA entities in the controller.
- S2: Move duplicate validation (email, DNI, registrationNumber) from controllers to `PatientServiceImpl` and `DentistServiceImpl`, throwing `DuplicateResourceException`.
- S3: Standardize HTTP responses across all controllers:
  - `POST /appointments` returns `201 Created` with `AppointmentDTO`.
  - `PUT /patients/{id}` returns `200 OK` with `PatientResponseDTO`.
  - `PUT /dentists/{id}` returns `200 OK` with `DentistResponseDTO`.
  - `DELETE` on `/patients/{id}`, `/dentists/{id}`, `/appointments/{id}` returns `204 No Content`.
  - Remove redundant `@Autowired` annotations from constructors in `PatientController`, `DentistController`, and `DashboardServiceImpl`.
- S4: Update backend tests and frontend routes/tests for updated HTTP statuses (201 for appointment create, 204 for deletes).
- S5: Full verification: backend `./mvnw spotless:check` and `./mvnw test`, frontend `npm test`, `npm run check`, `npm run typecheck`, and `npm run build`.

## Tasks

- [x] T1 (S1, S2, S3) Refactor `PatientController`, `DentistController`, `PatientServiceImpl`, `DentistServiceImpl`, and `AppointmentController` — route: inline — commit: this commit
- [x] T2 (S4) Update backend tests and frontend actions/mocks for standardized status codes — route: inline — commit: this commit
- [x] T3 (S5) Full verification and reviewable commit — route: inline — commit: this closing commit

## Log

- L1: User approved: "si" to unifying issues 1, 2, and 3. Created branch refactor/backend-api-consistency from main (2f92b32).
- L2: T1 implemented: updated IPatientService, IDentistService, PatientServiceImpl, DentistServiceImpl, PatientController, DentistController, AppointmentController, and DashboardServiceImpl.
- L3: T2 implemented: updated AppointmentControllerTest, AppointmentDentistReassignmentTest, AppointmentStatusTransitionControllerTest, AppointmentValidationTest, AppointmentConflictTest, ApiIntegrationTest, and frontend mocks.
- L4: T3 verified: backend spotless clean, all surefire test suites pass (56/56 in primary integration suite), frontend svelte-check 0 errors 0 warnings, tsc clean, 150 vitest tests pass, 14 process runner tests pass, vite build clean, and impeccable detect 0 findings ([]).
- L5: Independent verifier (gentle-ai-verify task mwd2f9yn-4-ax8t) found PatientController and DentistController still imported JPA entities for ownership checks. Fixed in 4e1830a: controllers now resolve the caller via findByEmailAsDTO / findByRegistrationNumberAsDTO; zero Patient/Dentist entity imports remain in controller/.
- L6: Second independent verification (gentle-ai-verify task mwd31tfx-5-n5ll) passed all 4 checks: 109 backend tests across 14 suites, spotless clean, 150 frontend tests, tsc clean. Advisory finding: findByEmailAsDTO for patients issued a duplicate DB query; fixed in c71aa82 by converting the entity directly (map(this::convertToDTO)).
- L7: Known remaining scope (documented, not in this change): AppointmentController still imports entity.User (used for auth.getPrincipal() instanceof User), entity.Role, and entity.AppointmentStatus; the service interfaces still expose Optional<Patient>/Optional<Dentist> entity-returning methods used by other call sites.
