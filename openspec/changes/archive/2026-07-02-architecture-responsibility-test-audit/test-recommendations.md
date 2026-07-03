# Test Recommendations

| Finding ID | Contract Type | Behavior / Boundary Protected | Candidate Test Location | Existing Related Tests | Should Precede Remediation? |
| --- | --- | --- | --- | --- | --- |
| BM-01 | Architecture-boundary | Controllers must not depend on repositories directly; `checkEmailExists` should route through the service layer | `backend/src/test/java/com/dh/dentalClinicMVC/controller/AuthenticationControllerBoundaryTest.java` or an ArchUnit-style architecture test | `authentication/AuthenticationControllerTest.java` covers register/default-role behavior only | Yes |
| BM-02 | Controller boundary + validation | Patient create/update endpoints should use explicit request DTOs and reject invalid payloads before state mutation | `backend/src/test/java/com/dh/dentalClinicMVC/controller/PatientControllerBoundaryTest.java` | `PatientControllerAuthzTest.java` covers ownership and privilege escalation | Yes |
| BM-03 | Controller boundary + validation | Dentist create/update endpoints should use explicit request DTOs and keep authoritative fields out of body mutation logic | `backend/src/test/java/com/dh/dentalClinicMVC/controller/DentistControllerBoundaryTest.java` | `DentistControllerAuthzTest.java` covers ownership and privilege escalation | Yes |
| BM-04 | Validation + controller behavior | Appointment create/update/status endpoints should validate request bodies with `@Valid` or equivalent request objects instead of ad hoc controller checks | `backend/src/test/java/com/dh/dentalClinicMVC/controller/AppointmentControllerValidationTest.java` | `AppointmentValidationTest.java` covers some invalid date cases; `AppointmentControllerTest.java` covers access rules | Yes |
| FM-03 | Frontend runtime behavior | Dashboard access control should remain a runtime route concern, not a template-only assumption | `frontend/test/dashboard-route-behavior.test.js` | `require-auth.test.js` covers other protected routes | Yes |
| FM-05 | EJS presentation boundary | Dashboard template should only bootstrap data and not own application decisions beyond rendering | `frontend/test/dashboard-view-boundary.test.js` | `global-wiring-source.test.js` and `slice-b-fixes.test.js` pin some source contracts | Yes |
| FM-06 | EJS presentation boundary + global wiring | Appointment templates should bootstrap only the minimum globals and avoid expanding view ownership | `frontend/test/appointment-view-boundary.test.js` | `appointment-srp-split.test.js` guards globals and module splits | Yes |
| FM-07 | API-module boundary | Auth data manager should keep network access behind the API module contract when practical | `frontend/test/auth-api-module-boundary.test.js` | `client-token-handling.test.js` covers token safety, not module placement | Yes |
| FM-09 | API-module boundary + runtime behavior | Server-data loading should preserve behavior while centralizing network access and globals in the appropriate module | `frontend/test/appointment-server-data-loader.test.js` | `appointment-srp-split.test.js` pins current source structure | Yes |
| FM-10 | Runtime behavior | Patient enrichment fallback must call the correct endpoint and degrade safely when the fetch fails | `frontend/test/appointment-enricher-behavior.test.js` | `appointment-srp-split.test.js` intentionally preserves the known bug in source form | Yes |
| TM-06 | Source-contract + behavior pairing | Source-shape guards should only remain when paired with behavior tests that prove the same boundary | `frontend/test/*-srp-split.test.js`, `frontend/test/global-wiring-source.test.js` | Current source-contract suite is already present | Yes, when shaping future refactors |
| TM-07 | Route behavior | Skipped route suite should become a real runtime check or be replaced with a stable equivalent | `frontend/test/app.test.js` | `require-auth.test.js` covers protection, but not view rendering | Yes, if route rendering is changed |
| TM-01 | Security/authorization | Existing access-control contracts should remain green while any controller cleanup happens | Existing controller authz tests | `PatientControllerAuthzTest.java`, `DentistControllerAuthzTest.java`, `AppointmentControllerTest.java` | Yes |
| TM-02 | Service/use-case behavior | Keep the dashboard aggregation behavior test as the canonical service-level pattern | Existing service unit test | `DashboardSnapshotServiceTest.java` | Yes |

## Notes

- Prefer behavior and boundary contracts over implementation trivia.
- Source-contract tests are acceptable only when they explicitly protect an architecture boundary.
- No new tests are added in this diagnostic change; these are future recommendations only.
