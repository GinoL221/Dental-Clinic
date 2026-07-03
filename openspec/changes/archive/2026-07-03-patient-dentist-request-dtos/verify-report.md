# Verify Report: Patient/Dentist Request DTOs

**Mode**: full spec-driven verification (proposal + spec + design + tasks + apply-progress all present).
**Scope**: synthesis pass after 3 independent per-slice gatekeeper reviews already ran (Slice A/B/C all PASS).

## Test Suite Evidence (run directly by this verify pass)

- Backend: `cd backend && mvn test` → **BUILD SUCCESS, Tests run: 87, Failures: 0, Errors: 0, Skipped: 0**.
- Frontend: `cd frontend && npm test` → **Test Suites: 17 passed / 17, Tests: 245 passed / 245**.

## Task Completeness (tasks.md)

All 21 tasks across Phases 1-6 are checked `[x]`. Spot-checked against real commits/diffs:
- Phase 1-2 (Patient) → commit `996eb47` + `2c7be07`, backend diff confirms `PatientRequestDTO`, `AddressRequestDTO`, `PatientRequestMapper`, `PatientController` changes, `PatientControllerTest`/`PatientControllerAuthzTest` reworked.
- Phase 3-4 (Dentist) → commit `64aa370`, same shape confirmed for Dentist files.
- Phase 5 (Audit) → commit `4f9e84a`, `ValidationAuditRunner` + `ValidationAuditRunnerTest` present, flag-gated (`@ConditionalOnProperty`), test log output shows flag-off = no execution, flag-on = violation reported without mutation.
- Phase 6 (6.1/6.2) → full backend suite passes; `patient-api.js`/`dentist-api.js` inspected — use `location`, never `city`/`postalCode`, never send `id` in update body.

## Spec Requirement -> Implementation Cross-Check

| Requirement | Implementation | Test evidence |
|---|---|---|
| Validated Request DTOs bind `@Valid` on save/update, no raw entity as `@RequestBody` | `PatientController.save/update` and `DentistController.save/update` bind `PatientRequestDTO`/`DentistRequestDTO` with `@Valid`; no `Patient`/`Dentist` param type remains | `PatientControllerTest`, `DentistControllerTest` pass |
| Update enforces `@Valid` (previously missing) | `update(...)` now `@Valid @RequestBody` | Validation-rejection tests pass |
| DTO structurally excludes `id`/`role` | `PatientRequestDTO`/`DentistRequestDTO` have no `id`/`role` fields; id comes from `@PathVariable Long id` | `PatientControllerAuthzTest`/`DentistControllerAuthzTest` body-injected `id`/`role` assertions pass |
| Full-replace PUT semantics | All editable fields `@NotBlank`/`@NotNull` on the single shared DTO used by POST and PUT | Partial-body update tests assert 400 |
| Canonical address field `location` | `AddressRequestDTO.location`; `patient-api.js` renamed `city`→`location`, dropped `postalCode` | `patient-api-request-shape.test.js`/`dentist-api-request-shape.test.js` pass |
| Bean Validation rejects malformed input | `@NotBlank`/`@Email`/`@NotNull @Positive` on DTO fields; `GlobalExceptionHandler.handleMethodArgumentNotValid` returns 400 | Invalid-email/missing-field/negative-cardIdentity tests pass |
| One-time read-only validation audit | `ValidationAuditRunner`, `@ConditionalOnProperty` default-off, only `repository.findAll()` reads, logs violations, no save/update/delete call in class | `ValidationAuditRunnerTest` (FlagOn/FlagOff) passes |

All 7 spec requirements and their scenarios are implemented and covered by passing runtime tests. No UNTESTED or FAILING scenario found.

## Design Coherence

Controllers, DTOs, mappers, and the audit runner match the design's contracts, file plan, and runtime data flow exactly (verified by direct source read, not inference). Notable design decisions confirmed in code:
- D3/Design-3: `PUT /{id}` with path-based target id, 403 on non-admin id mismatch (`PatientController:67-70`, `DentistController:68-71`) — matches "intentional hardening" described in design Risks.
- Design-4: email nulled on non-admin self-update before `service.update`, relying on the untouched null-merge service layer — confirmed in both controllers.
- D7 (role-setting removal, no replacement): confirmed structurally — `role` field does not exist on either DTO, so no code path can set it via these endpoints. Correctly reflected as approved in proposal.md.

## Proposal Success Criteria

All 6 success-criteria bullets are met: DTOs bound on save+update with no entity binding, `@Valid` on update, structural id/role exclusion, `location` canonical everywhere (no `city` in request payload), invalid requests rejected with tests covering acceptance/rejection/IDOR, one-time audit is read-only, backend Maven tests pass, frontend request bodies match contract.

## Scope Regression Check

`git diff --stat 836ac0f..HEAD` — 25 files changed, all within the declared scope: `dto/`, `controller/{Patient,Dentist}Controller`, `audit/ValidationAuditRunner`, `exception/GlobalExceptionHandler` (new `MethodArgumentNotValidException` handler, required for the DTO validation contract), `pom.xml` (adds `spring-boot-starter-validation`, previously absent — infra fix required to make `@Valid` non-no-op, not scope creep), backend/frontend test files, and `patient-api.js`/`dentist-api.js`. No `Appointment`, auth/security-filter, or service/entity/repository changes. No unrelated file touched.

## Findings

**CRITICAL**: none.

**WARNING**: none blocking.

**SUGGESTION**:
1. Apply-progress memory (`sdd/patient-dentist-request-dtos/apply-progress`, obs #1363) states the backend suite is "88/88 pass (corrected from an earlier self-reported 87/87)". This verify pass's own fresh `mvn test` run shows **87/87 pass, 0 failures** — the same count as the original self-report, not 88. This is a documentation discrepancy in the apply-progress note, not a code or test defect (all 87 tests genuinely pass); no functional impact. Recommend correcting the memory note at archive time rather than re-opening apply.
2. `PatientAPI.formatAddress`/`getPatientStats` (display-only helper functions, `frontend/public/js/api/patient-api.js:338-394`) still read `address.city`, which no longer exists on the entity or DTO (canonical field is `location`, per this change and the pre-existing entity). This is pre-existing dead code, explicitly out of scope per the proposal's Non-Goals ("Full frontend API-module boundary rework"), and does not affect the request payload (the only thing the spec constrains). Flagging for a future cleanup pass only.

## Verdict

**PASS**

All spec requirements are implemented and covered by passing runtime tests (87 backend + 245 frontend, 100% pass). All 21 tasks are checked and verified against real commits. Design decisions are coherently reflected in code, including the escalated D7 decision. Proposal Success Criteria are fully met. No scope regression detected. Ready for `sdd-archive`.
