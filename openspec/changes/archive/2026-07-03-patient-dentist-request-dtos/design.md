# Design: Patient/Dentist Request DTOs

## Overview

Replace direct JPA-entity binding (`@Valid @RequestBody Patient` / `Dentist`) on the Patient and Dentist write endpoints with dedicated, Bean-Validated request DTOs. The DTO becomes the single enforced write contract at the HTTP boundary; mapping DTO → entity happens in the controller layer via small hand-written mappers, and `IPatientService`/`IDentistService` keep their entity-based signatures (proposal D6). The change also fixes the `address.city` → `address.location` frontend mismatch (D2), enforces full-replace PUT semantics at the contract level (D1), and ships a one-time, read-only validation audit (D4).

## Current State Findings

- `PatientController.save` (`backend/src/main/java/com/dh/dentalClinicMVC/controller/PatientController.java:36`) binds `@Valid @RequestBody Patient`; `update` (line 51) binds `@RequestBody Patient` with no `@Valid`. Same shape in `DentistController.java:37` / `:52`.
- `@Valid` is a no-op today: `Patient`, `Dentist`, `User`, `Address` carry zero `jakarta.validation` constraints.
- `PUT /patients` and `PUT /dentists` take the target `id` in the request body; controllers defensively strip `id`/`role`/`email` for non-admin self-updates (imperative IDOR guard).
- Service `update` implementations (`PatientServiceImpl.java:58`, `DentistServiceImpl.java:55`) are null-safe merges ("update only non-null fields") — NOT full-replace. The controller's `email = null` strip relies on this merge to preserve the stored email.
- `save` in both service impls already enforces required fields imperatively and derives a default password via `UserPasswordPolicy.resolveForCreate` when none is sent — so `password` is legitimately optional on create.
- DTO convention: Lombok `@Data @NoArgsConstructor @AllArgsConstructor` flat classes in `com.dh.dentalClinicMVC.dto`, Spanish `message=` strings (`SpecialtyDTO` is the only validated precedent).
- `Address` entity field is `location` (`entity/Address.java:26`); frontend `createFromUser` sends `city` and a nonexistent `postalCode` (`frontend/public/js/api/patient-api.js:241-243`).

## Design Decisions

### 1. Lombok POJO DTOs, not Java 21 records (confirms proposal D5)

**Choice**: `@Data @NoArgsConstructor @AllArgsConstructor` Lombok POJOs with `jakarta.validation.constraints.*`.
**Alternatives considered**: Java 21 records (java-21 skill recommendation: records for immutable DTOs).
**Rationale**: every existing DTO (`SpecialtyDTO`, `PatientResponseDTO`, `DentistResponseDTO`) is a Lombok POJO. Records offer immutability but no material functional benefit for two request classes, and would create a mixed convention in the `dto` package. Consistency wins; adopting records project-wide is a separate convention decision. Deviation from the java-21 skill is deliberate and scoped.

### 2. Hand-written static mapper classes, no MapStruct (confirms proposal D6)

**Choice**: two plain utility classes with static methods, flat in the `dto` package (matching "no subpackages" convention): `PatientRequestMapper` and `DentistRequestMapper`. Each exposes `toEntity(dto)` (controller use) and `toRequestDTO(entity)` (audit use only).
**Alternatives considered**: MapStruct (new dependency for 2 mappings — disproportionate blast radius); mapping inline in controllers (untestable duplication, controllers already long); moving mapping into services (changes `IPatientService`/`IDentistService` signatures — explicitly out of scope).
**Rationale**: the DTO → entity boundary lives at the controller layer; services remain the entity-domain boundary. Static stateless mappers are trivially unit-testable and reusable by the audit runner without bean wiring.

### 3. Target id moves to the path: `PUT /patients/{id}`, `PUT /dentists/{id}`

**Choice**: single request DTO per aggregate (used by POST and PUT) that structurally excludes `id` and `role`; the update target comes from a `@PathVariable Long id`.
**Alternatives considered**: keeping `PUT /patients` with `id` inside a separate update DTO — rejected because it violates the proposal's success criterion ("the request DTO contract structurally excludes `id`/`role`") and keeps the body id as an IDOR vector.
**Rationale**: with the id out of the body there is nothing to strip. Non-admin self-update: resolve own record by `auth.getName()`; if path id ≠ own id → **403 Forbidden** (plus the existing warn log), consistent with `PatientController.findById`'s existing mismatch behavior. This is an intentional hardening of the current "silently override to own id and return 200" behavior. Admin: path id is the target; 404 if not found. Unknown JSON properties (`id`, `role` sent in the body) are silently ignored by Jackson (Spring Boot default) — authz tests assert they have no effect.

### 4. Full-replace PUT enforced at the DTO layer (implements proposal D1)

**Choice**: the same constraints apply on POST and PUT because it is the same DTO — all editable fields are required (`@NotBlank`/`@NotNull`). "Omitted field = blank" is enforced as **omitted field = 400 validation error**: the contract makes it impossible to omit an editable field, which is the strongest form of full-replace.
**Rationale**: the service-layer null-merge (`PatientServiceImpl.update`) stays untouched (out of scope, and the non-admin email flow depends on it — see below); it becomes unreachable dead-defense for validated fields, not the contract.
**Email on update**: DTO `email` is required, but for non-admin self-update the controller does NOT apply it — the mapper output gets `email = null` before `service.update`, and the merge preserves the stored email (exact current behavior: email not self-changeable). Admin updates apply the DTO email.

### 5. Canonical address field is `location` (implements proposal D2)

**Choice**: `AddressRequestDTO.location` mirrors `entity/Address.java:26` (`@Column(name = "location")`). Frontend is updated to send `location` and to stop sending `postalCode` (no such field exists server-side).
**Rationale**: entity/DB column is the persisted source of truth; renaming it is a wider migration. Fixing the frontend is minimal and already in scope.

### 6. Validation audit: `ApplicationRunner` behind a property flag (implements proposal D4)

**Choice**: `ValidationAuditRunner`, a `@Component` `ApplicationRunner` in a new `com.dh.dentalClinicMVC.audit` package, gated by `@ConditionalOnProperty(name = "app.validation-audit.enabled", havingValue = "true")` (default off). It loads all patients/dentists via the existing repositories, maps each entity to its request DTO with the mappers, runs `jakarta.validation.Validator#validate`, and logs a per-row violation report. Strictly read-only — no writes, no mutation.
**Alternatives considered**: a JUnit test (runs against the test datasource, useless for auditing real rows); a standalone CLI script (new tooling surface, duplicated datasource config); an admin endpoint (permanent attack/data-exposure surface for a one-time need).
**Rationale**: the flagged runner reuses the app's own datasource and validator, costs nothing when disabled, and is invoked once via `--app.validation-audit.enabled=true`. Lowest operational risk of the four options.

## Contracts

```java
// dto/PatientRequestDTO.java  (Spanish messages per SpecialtyDTO convention)
@Data @NoArgsConstructor @AllArgsConstructor
public class PatientRequestDTO {
    @NotBlank(message = "...") @Size(min = 2, message = "...") private String firstName;
    @NotBlank(message = "...") @Size(min = 2, message = "...") private String lastName;
    @NotBlank(message = "...") @Email(message = "...")         private String email;
    @NotNull(message = "...")  @Positive(message = "...")      private Integer cardIdentity;
    @NotNull(message = "...")                                   private LocalDate admissionDate;
    @Valid                                                      private AddressRequestDTO address; // optional
    private String password; // optional; service derives default on create, preserves on update
}

// dto/DentistRequestDTO.java
@Data @NoArgsConstructor @AllArgsConstructor
public class DentistRequestDTO {
    @NotBlank @Size(min = 2) private String firstName;
    @NotBlank @Size(min = 2) private String lastName;
    @NotBlank @Email         private String email;
    @NotNull  @Positive      private Integer registrationNumber;
    private String password; // optional
}

// dto/AddressRequestDTO.java — all fields required WHEN address is present
@Data @NoArgsConstructor @AllArgsConstructor
public class AddressRequestDTO {
    @NotBlank private String street;
    @NotNull @Positive private Integer number;
    @NotBlank private String location;   // canonical name — matches entity/Address.location
    @NotBlank private String province;
}
```

No `id`, no `role`, no specialties (managed via dedicated endpoints), no appointments. `@Size(min = 2)` mirrors the frontend's existing min-length rule so the two layers agree.

Controller signatures after the change:

```java
// PatientController
@PostMapping
public ResponseEntity<PatientResponseDTO> save(@Valid @RequestBody PatientRequestDTO dto)
@PutMapping("/{id}")
@PreAuthorize("hasAnyRole('ADMIN','PATIENT')")
public ResponseEntity<String> update(@PathVariable Long id, @Valid @RequestBody PatientRequestDTO dto, Authentication auth)

// DentistController — same shape with DentistRequestDTO and hasAnyRole('ADMIN','DENTIST')
```

## Runtime Data Flow

    Client JSON ──> @Valid PatientRequestDTO ──400──> validation errors (missing/blank fields)
        │ (valid)
        ▼
    PatientController: authz (path id vs own id; mismatch -> 403)
        │  PatientRequestMapper.toEntity(dto) + set id from path; email nulled for self-update
        ▼
    IPatientService.save/update(Patient)  (signatures unchanged)
        ▼
    Repository / DB

    Audit (one-time):  Repository.findAll() ──> Mapper.toRequestDTO(entity) ──> Validator.validate ──> log report

## Planned File Changes

### Production (backend)

| File | Action | Description |
|------|--------|-------------|
| `backend/src/main/java/com/dh/dentalClinicMVC/dto/PatientRequestDTO.java` | Create | Validated request contract (fields above) |
| `backend/src/main/java/com/dh/dentalClinicMVC/dto/DentistRequestDTO.java` | Create | Validated request contract |
| `backend/src/main/java/com/dh/dentalClinicMVC/dto/AddressRequestDTO.java` | Create | Nested address contract, `location` canonical |
| `backend/src/main/java/com/dh/dentalClinicMVC/dto/PatientRequestMapper.java` | Create | Static `toEntity` / `toRequestDTO` |
| `backend/src/main/java/com/dh/dentalClinicMVC/dto/DentistRequestMapper.java` | Create | Static `toEntity` / `toRequestDTO` |
| `backend/src/main/java/com/dh/dentalClinicMVC/controller/PatientController.java` | Modify | Bind DTO on save; `@PutMapping("/{id}")` + `@Valid` on update; 403 on non-admin id mismatch; drop strip code; duplicate checks read DTO |
| `backend/src/main/java/com/dh/dentalClinicMVC/controller/DentistController.java` | Modify | Same as PatientController |
| `backend/src/main/java/com/dh/dentalClinicMVC/audit/ValidationAuditRunner.java` | Create | Flag-gated read-only audit runner |

Services, repositories, and entities: **no changes**.

### Frontend (minimal, lockstep)

| File | Change |
|------|--------|
| `frontend/public/js/api/patient-api.js` | `update()` → `PUT ${API_BASE_URL}/api/patients/${id}` with body WITHOUT `id`, always sending the full editable set (firstName, lastName, email, cardIdentity, admissionDate, address?). `createFromUser()` → rename `city` → `location`, drop `postalCode`, omit `address` entirely when no real address data (blank address now fails validation). |
| `frontend/public/js/api/dentist-api.js` | `update()` → `PUT ${API_BASE_URL}/api/dentists/${id}` with body WITHOUT `id`, full editable set (firstName, lastName, email, registrationNumber). |

## Test Design Details

Five existing files build raw `Map<String,Object>` bodies with entity field names including `id`/`role`:

- `PatientControllerTest`, `PatientControllerAuthzTest`, `DentistControllerTest`, `DentistControllerNegativeTest`, `DentistControllerAuthzTest` (all under `backend/src/test/java/com/dh/dentalClinicMVC/controller/`).

Rework rules:

1. Bodies move to the DTO shape and must carry the FULL editable field set (D1: partial bodies like `PatientControllerAuthzTest.whenPatientUpdatesOwnRecordWithOwnData_thenSucceeds` currently send only `id`/`firstName`/`lastName` — now a 400).
2. `put("/patients")` → `put("/patients/{id}", targetId)`; same for dentists.
3. IDOR assertions preserved and strengthened: non-admin PUT to another user's path id → assert **403** and target row unchanged; body-injected `"id"`/`"role"` keys → assert ignored (row's role unchanged, other row untouched).
4. New validation-rejection tests: missing/blank each required field → 400; malformed email → 400; address present with blank `location` → 400.
5. New mapper unit tests (plain JUnit, no Spring context) for `toEntity`/`toRequestDTO`.
6. Audit runner: one focused test asserting it is NOT loaded when the flag is off, and that with the flag on it logs violations for a seeded invalid row without mutating it.

## Validation Commands

```bash
cd backend && mvn test -Dtest='PatientControllerTest,PatientControllerAuthzTest,DentistControllerTest,DentistControllerNegativeTest,DentistControllerAuthzTest'
cd backend && mvn test   # full suite before completion
```

Strict TDD applies: failing tests first, minimal implementation, re-run focused command until green.

## Rollout and Work Unit Plan

Estimated diff exceeds the 400-line review budget (3 DTOs + 2 mappers + 2 controllers + audit + 2 frontend files + 5 reworked test files). Recommended slicing for the tasks phase (`delivery_strategy: ask-on-risk`):

1. **Slice A — Patient vertical**: DTOs (Patient + Address) + mapper + controller + frontend `patient-api.js` + Patient tests. Backend and frontend must land together (URL + payload shape change).
2. **Slice B — Dentist vertical**: DentistRequestDTO + mapper + controller + `dentist-api.js` + Dentist tests.
3. **Slice C — Audit runner** + its test (independent, lowest risk, can land last).

Rollback: each slice reverts cleanly to entity binding since services/entities are untouched.

## Risks and Tradeoffs

- **Behavior changes (intentional, must be visible in the PR description)**: (a) non-admin update with mismatched id now returns 403 instead of silently updating own record; (b) `PUT` moves to `/{id}`; (c) `role` can no longer be set through these endpoints at all (previously admins could) — **explicitly approved by the user as proposal D7** after the gatekeeper review escalated it as an unapproved functional regression; no replacement endpoint is in scope; (d) previously-accepted partial/invalid payloads now return 400.
- **Frontend/backend lockstep**: the URL and `city → location` changes break the frontend unless deployed together — single deployable in this repo, but slices must keep each vertical atomic.
- **Latent invalid data**: rows failing the new rules can no longer round-trip through update untouched fields-wise; the D4 audit quantifies exposure before rollout. If the audit reveals wide `admissionDate`/`cardIdentity` violations, constraint strictness (`@Positive`, required date) may need loosening before apply — check audit output first.
- **Frontend `number: ""` habit**: `createFromUser` sends `""` for `address.number`; with the DTO this is rejected — hence "omit address when empty" in the frontend change.
- **Service merge semantics remain**: the null-merge in `update` is retained by design (email preservation depends on it); do NOT "clean it up" in this change.

## Future Apply Constraints

- Backend + minimal frontend only; no service signature changes, no MapStruct, no Appointment/auth/security-filter changes, no data migration.
- Spanish validation `message=` strings per `SpecialtyDTO` convention; code identifiers and comments in English per project instructions where new code is written.
- Keep each slice under the 400 changed-line review budget; strict TDD (tests first).
- Audit runner must remain read-only and default-off.
