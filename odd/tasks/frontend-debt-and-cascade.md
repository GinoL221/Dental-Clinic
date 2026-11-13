# Frontend Debt Sweep + Patient Deletion Policy

Branch `chore/frontend-debt-and-cascade` (from `main@73c78dc`). Batch closing the remaining known backlog with the decisions made this session.

## Specs

User approved "hacemos todas" over the four backlog items; product decision via questionnaire:

- S1 (T1 CSS debt): remove dead CSS (`.dentist-list-title`), remove `!important` from views/utilities ONLY where removal provably keeps the same rendered result (specificity/reorder check per rule, visual-affecting ones get a per-file reason note); tokenize `rgba()`/literal colors ONLY where an existing token in `tokens.css` matches semantics (alpha shadows/borders that have no token equivalent stay, each documented inline as a one-line English comment). No visual change intended: verify with `impeccable detect` (must stay `[]`), svelte-check 0/0, build.
- S2 (T2 fieldErrors adoption): dentists add/edit and appointments add/edit forms adopt the mechanism built for patients: actions pass `fieldErrors` through, FormCard receives it, inputs marked inline with the same `.field-error` + `aria-invalid`/`aria-describedby` pattern; map-or-message rule applied (no joined message when fieldErrors present). Validation keys from the corresponding backend request DTOs (`DentistRequestDTO`, `AppointmentRequestDTO`).
- S3 (T3 cascade decision — user chose "Bloquear borrado con turnos (como el odontólogo)"): deleting a PATIENT that has appointments must be rejected with a structured 409, consistent with the error contract. Implementation: remove `cascade = CascadeType.ALL, orphanRemoval = true` from `Patient.appointments` (Keep address cascade untouched); add a service-level guard in `PatientServiceImpl.delete` using the appointments repository (existsBy/count by patient) that throws a new `ResourceInUseException` → 409 via a new `GlobalExceptionHandler` handler returning `ErrorResponse` ("Recurso en uso"); message names the resource (e.g. "El paciente tiene turnos asociados y no puede eliminarse"). Test-first: RED test asserting a patient WITH appointments cannot be deleted (409 + body) and one WITHOUT appointments still deletes (204); existing tests that relied on cascade deletion must be adapted only if they encode the old policy — report each adaptation. Frontend delete action already surfaces the real message (U1 prior unit) — confirm no frontend change needed.
- S4 (T4 e2e fullstack run): run `npm run test:e2e:fullstack` with DISPOSABLE generated credentials (JWT_SECRET random, E2E_ADMIN_*, E2E_NON_ADMIN_* test accounts) exported only in the run's environment — never written to the repo. Verify ports 8080/4173 are free and owned by nobody else beforehand; if occupied, report and stop (shared-resource rule). Report pass/fail and counts.

## Tasks

- [x] T1 (S1) CSS debt sweep — route: worker (mwec1hes-c-1h3n) — commit: abcb161
- [x] T2 (S2) fieldErrors adoption in dentists/appointments — route: worker (mwecqs38-d-xyco) — commit: 6b7c702
- [x] T3 (S3) patient deletion blocked with appointments — route: worker (mwed4lh2-e-03g1) — commit: d85a775
- [ ] T4 (S4) e2e fullstack run with disposable credentials — route: parent (bash_background) — commit: none
- [ ] T5 Full verification + independent verify — route: gentle-ai-verify — commit: none
- [ ] T6 Merge/push with user consent — route: parent — commit: none

## Log

- L1: User: "hacemos todas". Product decision (questionnaire): patient deletion with appointments is BLOCKED like the dentist, not cascaded.
- L2: User question on e2e credentials clarified: `E2E_*`/`JWT_SECRET` are disposable seeded-account values, not production secrets; the parent will generate them in-environment and never persist them.
- L3: T1 done: !important 29→5 in scope (5 keepers vs Bootstrap-generated markup utilities in dashboard.css, each with justification comment); 0 hex outside tokens.css; rgba literals all kept (no alpha tokens exist — none invented per S1) and annotated; dead `.dentist-list-title` + paired `.dentist-list-header` deleted; dead `body.landing-page .main-content` rule deleted; footer alignment moved from Bootstrap text-end to footer.css. DEFERRED product note: the whole `.error-*` set in error.css never applies (no +error.svelte exists — SvelteKit default error page renders); kept as a documented planned view, needs parent decision only if deleted.
- L4: T2 done: four forms (dentists add/edit, appointments add/edit) adopted map-or-message + fieldErrors passthrough + inline marks (dentists: firstName/lastName/email/registrationNumber; appointments: patientId/dentistId/date/time/description — flat keys confirmed via DTOs); 8 RED→GREEN; 172/172 suite.
- L5: T3 done: Patient.appointments cascade/orphanRemoval removed (address cascade untouched); existsByPatientId guard in PatientServiceImpl.delete; ResourceInUseException → 409 Recurso en uso handler; PatientDeletionPolicyTest 3 tests RED→GREEN (204 no-turns; 409 full-text with turns; data survives failure); zero existing tests encoded the old cascade policy; full suite 295/295; frontend untouched in d85a775.
- L6: T5 verify (mwedkq8r-f-rqp6) PASS S1/S2/S3-backend with follow-ups fixed inline in the fix set: (1) REAL GAP — patients AND dentists list pages never rendered the delete action's error (native form submit + no ActionData prop), so a blocked deletion was silent; now both export form and render the 409 message in an alert; (2) color: white literals → var(--color-blanco) (6 sites); (3) two rgba lines under an annotated rule now carry the annotation too; (4) dead-rule comment translated to English. Verifier count correction: !important baseline was 27, not 29 (grep counts comment mentions).
