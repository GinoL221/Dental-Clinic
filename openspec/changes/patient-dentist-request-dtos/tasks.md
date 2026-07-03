# Tasks: Patient/Dentist Request DTOs

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines (combined) | ~950-1050 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Slice A) -> PR 2 (Slice B) -> PR 3 (Slice C) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (ask user) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Est. lines | Notes |
|------|------|-----------|-----------|-------|
| 1 | Slice A - Patient vertical (DTOs, mapper, controller, `patient-api.js`, test rework) | PR 1 | ~380-430 | Backend+frontend land together (URL+payload change); base = main/tracker |
| 2 | Slice B - Dentist vertical (same shape for Dentist) | PR 2 | ~330-400 | Independent of Slice A; base per chosen chain strategy |
| 3 | Slice C - `ValidationAuditRunner` + test | PR 3 | ~120-180 | Independent, lowest risk, can land any time |

## Phase 1: Slice A - Patient Foundation (mapper + DTOs)

- [x] 1.1 RED: `backend/src/test/java/com/dh/dentalClinicMVC/dto/PatientRequestMapperTest.java` - plain JUnit, no Spring context, asserts `toEntity`/`toRequestDTO` field mapping (fails: classes don't exist)
- [x] 1.2 GREEN: Create `dto/AddressRequestDTO.java` (`street`, `number`, `location`, `province`, `@NotBlank`/`@NotNull @Positive`)
- [x] 1.3 GREEN: Create `dto/PatientRequestDTO.java` (fields per design contract, `@Valid AddressRequestDTO address` optional)
- [x] 1.4 GREEN: Create `dto/PatientRequestMapper.java` static `toEntity(dto)`/`toRequestDTO(entity)`; run 1.1 to green

## Phase 2: Slice A - Patient Controller + Frontend

- [x] 2.1 RED: Rework `PatientControllerTest` to DTO shape, `put("/patients/{id}", targetId)`, full editable field set on update (fails against current controller)
- [x] 2.2 RED: Rework `PatientControllerAuthzTest`: non-admin mismatched-id PUT -> assert 403 + target row unchanged; body-injected `id`/`role` -> assert ignored
- [x] 2.3 RED: Add validation-rejection tests to `PatientControllerTest`: blank/missing required field, malformed email, negative `cardIdentity`, blank `address.location` -> 400
- [x] 2.4 GREEN: Modify `controller/PatientController.java` - bind `PatientRequestDTO` on save, `@PutMapping("/{id}")` + `@Valid` on update, path-id vs own-id 403 check, mapper usage, drop id/role strip code
- [x] 2.5 Update `frontend/public/js/api/patient-api.js` - `update()` -> `PUT /api/patients/{id}` without `id` in body, full editable set; `createFromUser()` -> rename `city`->`location`, drop `postalCode`, omit `address` when empty
- [x] 2.6 Run `cd backend && mvn test -Dtest='PatientControllerTest,PatientControllerAuthzTest'` until green

## Phase 3: Slice B - Dentist Foundation (mapper + DTO)

- [x] 3.1 RED: `backend/src/test/java/com/dh/dentalClinicMVC/dto/DentistRequestMapperTest.java` - plain JUnit, no Spring context
- [x] 3.2 GREEN: Create `dto/DentistRequestDTO.java` (fields per design contract)
- [x] 3.3 GREEN: Create `dto/DentistRequestMapper.java` static `toEntity`/`toRequestDTO`; run 3.1 to green

## Phase 4: Slice B - Dentist Controller + Frontend

- [x] 4.1 RED: Rework `DentistControllerTest` to DTO shape + path id + full editable set
- [x] 4.2 RED: Rework `DentistControllerNegativeTest` to DTO shape/validation-rejection expectations
- [x] 4.3 RED: Rework `DentistControllerAuthzTest`: mismatched-id PUT -> 403; body-injected `id`/`role` -> ignored
- [x] 4.4 GREEN: Modify `controller/DentistController.java` - same shape as PatientController with `DentistRequestDTO`, `hasAnyRole('ADMIN','DENTIST')`
- [x] 4.5 Update `frontend/public/js/api/dentist-api.js` - `update()` -> `PUT /api/dentists/{id}` without `id`, full editable set
- [x] 4.6 Run `cd backend && mvn test -Dtest='DentistControllerTest,DentistControllerNegativeTest,DentistControllerAuthzTest'` until green

## Phase 5: Slice C - Validation Audit Runner

- [x] 5.1 RED: `backend/src/test/java/com/dh/dentalClinicMVC/audit/ValidationAuditRunnerTest.java` - flag-off: runner does not execute; flag-on: seeded invalid row logged as violation, row NOT mutated
- [x] 5.2 GREEN: Create `audit/ValidationAuditRunner.java` - `@Component ApplicationRunner`, `@ConditionalOnProperty(name="app.validation-audit.enabled", havingValue="true")`, read-only, uses existing mappers + `Validator#validate`
- [x] 5.3 Run `cd backend && mvn test -Dtest='ValidationAuditRunnerTest'` until green

## Phase 6: Full Verification

- [x] 6.1 Run `cd backend && mvn test` (full suite) - confirm no regressions in unrelated controllers/services
- [x] 6.2 Manual check: `patient-api.js`/`dentist-api.js` payloads contain `location`, never `city`/`postalCode`, never `id` in update body
