# Design: Backend Authorization Hardening

## Technical Approach

Close object-level authz holes by moving authorization decisions off attacker-controlled
request-body fields and onto the authenticated principal (`authentication.name` == email,
confirmed in `JwtAuthenticationFilter` line 54). Resolution is done **in the controller layer**
(services keep their current single-arg signatures), and privileged/identity fields (`role`,
`email`) are **stripped before the service call** so the service never sees attacker-supplied
authorization data. No schema/entity changes — `role` already lives on `User` (JOINED inheritance,
`User.java:42`) and is inherited by `Patient`/`Dentist`. All error paths reuse the existing
`IllegalArgumentException -> 400 ErrorResponse` and `AccessDeniedException -> 403` conventions in
`GlobalExceptionHandler`.

## Architecture Decisions

### Decision 1 — Admin registration lockdown (Item 1)

**Choice**: Keep the single public `/auth/register` endpoint; **reject** `role: ADMIN` (and any
non-self-service role) with a `400`. Do NOT add an admin-only creation endpoint. Default a
**missing/null** role to `PATIENT` (back-compat with clients that omit role).

**Mechanism**: in `AuthenticationService.register()`, before the switch, guard:

```java
Role requested = request.getRole() == null ? Role.PATIENT : request.getRole();
if (requested == Role.ADMIN) {
    throw new IllegalArgumentException("El registro público no permite crear cuentas de administrador");
}
```

Then switch on `requested` (not `request.getRole()`). The `case ADMIN` arm and `createAdmin()`
become unreachable from this path; `createAdmin()` may stay (dead but harmless) or be deleted —
prefer **delete** to shrink the privileged surface, since `DataInitializer.java:71-77` seeds the
admin directly via `userRepository.save` and does not call it.

**Alternatives considered**: (b) separate `POST /admin/users`. **Rejected** — no confirmed product
need for runtime admin creation; the seed is the sanctioned source; adding a route grows the
security surface (new wiring under `/admin/**`, new tests). Silent coercion of ADMIN→PATIENT
**rejected** — silently downgrading hides a clearly malicious/erroneous request; an explicit 400 is
better security signal and matches the codebase's loud-validation style.

**Rationale**: smallest surface that closes the hole, consistent with existing validation error
handling, no new endpoint/security config.

### Decision 2 — Patient/Dentist update IDOR + role/email mutability (Item 2a)

**Choice (target resolution)**: **Controller-level resolution**, service signatures unchanged
(`update(Patient)` / `update(Dentist)` stay as-is). For a non-admin caller, the controller resolves
the target record from the principal and **forces** `patient.setId(ownRecord.getId())`, ignoring any
body `id`. ADMIN keeps targeting by body `id`.

**Choice (role mutability)**: **Strip on the self-service path** — the controller calls
`patient.setRole(null)` for non-admin callers before delegating. The service already preserves the
existing role when the incoming role is null (`PatientServiceImpl.java:77-81`), so null-out =
preserve-existing. No service change strictly required, but harden the service too (see Risks).

**Choice (email mutability)**: **Disallowed in this change** — controller calls
`patient.setEmail(null)` for non-admin callers (email is the JWT subject; changing it would
invalidate the current token and needs a re-login flow that is out of scope). Service preserves
existing email on null. Self-service email change is a future feature.

**Exact controller shape** (PatientController.update; DentistController mirrors it):

```java
@PutMapping
@PreAuthorize("hasAnyRole('ADMIN','PATIENT')")   // was: hasAnyRole('ADMIN') or #patient.email == authentication.name
public ResponseEntity<String> update(@RequestBody Patient patient, Authentication auth) {
    boolean isAdmin = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    if (!isAdmin) {
        Patient own = patientService.findByEmail(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("No autorizado"));
        patient.setId(own.getId());   // body id is non-authoritative
        patient.setRole(null);        // role not self-settable
        patient.setEmail(null);       // email not self-changeable here
    } else if (patient.getId() == null) {
        return ResponseEntity.badRequest().body("El ID del paciente es requerido para la actualización");
    }
    Optional<Patient> existing = patientService.findById(patient.getId());
    if (existing.isPresent()) {
        patientService.update(patient);
        return ResponseEntity.ok("Paciente actualizado correctamente");
    }
    return ResponseEntity.notFound().build();
}
```

The old `#patient.email == authentication.name` SpEL is removed: it authorized on a spoofable body
field. Authorization is now: ADMIN OR (PATIENT acting on own resolved record). Same pattern in
`DentistController` (`@PreAuthorize("hasAnyRole('ADMIN','DENTIST')")`, resolve via
`dentistService.findByEmail`).

**Alternatives considered**: changing service to `update(Patient, Authentication)` — **rejected**,
larger blast radius (interface + impl + all callers + tests) for no security gain since controller
stripping already neutralizes the body. Validating body `id` against own record instead of forcing
it — **rejected**, resolve-from-principal makes body `id` fully non-authoritative (more robust).

### Decision 3 — Patient findById policy (2b) + Appointment findById PATIENT (Item 3)

**Choice (2b)**: ADMIN/DENTIST unrestricted + PATIENT self-only, mirroring `findAll`
(`PatientController.java:74` confirmed `ADMIN,DENTIST`). Self-only is **not** cleanly expressible in
declarative SpEL here (the path `id` must be compared to the caller's own record, which requires a
DB load). Use **imperative check in the controller** with a coarse `@PreAuthorize` gate:

```java
@GetMapping("/{id}")
@PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
public ResponseEntity<PatientResponseDTO> findById(@PathVariable Long id, Authentication auth) {
    boolean privileged = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_DENTIST"));
    if (!privileged) {
        Patient own = patientService.findByEmail(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("No autorizado"));
        if (!own.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    PatientResponseDTO dto = patientService.findByIdAsDTO(id);
    return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
}
```

This matches the existing imperative ownership style already used in `AppointmentController`
(`existing.getDentist_id().equals(dentist.getId())`). `@PostAuthorize` on the returned DTO was
considered but the DTO has no owner field to compare against the principal without an extra lookup,
so the pre-fetch-and-compare approach is simpler and consistent.

**Choice (Item 3)**: scope DENTIST to own appointments, ADMIN unrestricted, **PATIENT stays
excluded** from `GET /appointments/{id}` — confirmed, not overridden. The patient appointment flow
uses `GET /appointments` (`findAll`, role-filtered via `findAllForCurrentUser`) which already
returns the patient's own appointments; there is no patient detail-by-id caller, so excluding PATIENT
is not a functional regression. Implementation reuses the in-file pattern:

```java
@GetMapping("/{id}")
@PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
public ResponseEntity<AppointmentDTO> findById(@PathVariable Long id, Authentication auth) {
    Optional<AppointmentDTO> found = appointmentService.findById(id);
    if (found.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    if (hasRole(auth, "ROLE_DENTIST")) {
        Dentist dentist = dentistService.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Dentista no encontrado para el usuario autenticado"));
        if (!found.get().getDentist_id().equals(dentist.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    return ResponseEntity.ok(found.get());
}
```

## Data Flow

    Caller (JWT) ──► JwtAuthFilter sets principal(email) ──► @PreAuthorize coarse role gate
                                                                       │
                       non-admin ──► resolve own record by email ──► force id / strip role,email
                                                                       │
                       admin ─────────────────────────────────────────┤
                                                                       ▼
                                                          service.update/findById (unchanged)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `authentication/AuthenticationService.java` | Modify | Item 1 — reject ADMIN, default null→PATIENT; remove `createAdmin()` |
| `authentication/AuthenticationController.java` | Modify | Item 6 — delete `updateUserNames` + mapping |
| `controller/PatientController.java` | Modify | 2a update resolution + role/email strip; 2b findById self-check; add `Authentication` params |
| `controller/DentistController.java` | Modify | 2a update resolution + role/email strip (findById already ADMIN-only) |
| `controller/AppointmentController.java` | Modify | Item 3 — DENTIST ownership scope on findById |
| `service/impl/PatientServiceImpl.java` | Modify (defensive) | optionally ignore inbound role on update (belt-and-suspenders) |
| `service/impl/DentistServiceImpl.java` | Modify (defensive) | same |
| `resources/application-dev.properties` | Modify | Item 7 — remove committed JWT secret fallback |
| `src/test/...` | New/Modify | authz allow+deny tests; rewrite tests asserting insecure behavior |

`SecurityConfiguration.java` and `DataInitializer.java` are **not** modified (no new endpoint).

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration (MockMvc) | register ADMIN → 400; register no-role → PATIENT | `@SpringBootTest` + `/auth/register` |
| Integration | PATIENT update with body id=victim, role=ADMIN → only own record touched, role unchanged | seeded users, JWT/@WithMockUser |
| Integration | `GET /patients/{id}` PATIENT self=200, other=403; ADMIN/DENTIST=200 | per-role |
| Integration | `GET /appointments/{id}` DENTIST own=200, other=403; ADMIN any=200; PATIENT=403 | per-role |
| Integration | `PUT /auth/update-names/**` → 404 (endpoint gone) | route absent |

## Migration / Rollout

No database migration required. No new entity fields. All changes are code-level authorization logic
plus one config-line removal. Item 7 leaks remain (historical git secret) — flag JWT_SECRET rotation
as an out-of-band operational follow-up in the PR description.

## Open Questions

- [ ] Defensive service-layer role stripping: include now or rely solely on controller strip?
      Recommendation: include the cheap service guard too (defense in depth) — decided in tasks.
