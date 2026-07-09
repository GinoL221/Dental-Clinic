# Exploration: authz-cleanup-round-2

Follow-up cleanup to the 2026-06-22 `backend-authz-hardening` SDD change
(archived at `openspec/changes/archive/2026-06-22-backend-authz-hardening/`).
That change's ARCHIVE.md flagged two non-blocking WARNING items as tech debt,
deferred at the time. Both re-confirmed as still present in the current
codebase.

## Item 1 — `hasRole()` duplication (R2)

`AppointmentController.hasRole()`
(`backend/src/main/java/com/dh/dentalClinicMVC/controller/AppointmentController.java:227-230`):

```java
private boolean hasRole(Authentication auth, String role) {
  return auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(role));
}
```

It's `private`/instance-scoped, parametrized by role-string, null-safe on
`auth`. No shared `@Component`/static utility/base class exists anywhere for
this logic. It's correctly reused 4x inside `AppointmentController` (save,
findById, update, updateStatus).

Inline duplicates confirmed via grep across all 5 controllers
(Dashboard/Specialty have zero occurrences — scope is genuinely just 3 files):

1. `PatientController.update()` L58-59 — `isAdmin = ...ROLE_ADMIN...`, no
   null-guard on `auth` (hasRole() has one).
2. `PatientController.findById()` L104-109 — `privileged =
   ...ROLE_ADMIN... || ...ROLE_DENTIST...`, a compound 2-role check not
   reducible to a single `hasRole()` call.
3. `DentistController.update()` L59-60 — identical pattern to #1.
4. `AppointmentController.findAll()` L160-166 — a 4th duplicate, in the very
   file that owns `hasRole()`, which doesn't use its own helper here. This is
   the "3rd controller" the archived ARCHIVE.md's R2 note referred to
   (Patient, Dentist, and Appointment-itself).

## Item 2 — `findByEmail`-miss edge case (R3)

`GlobalExceptionHandler` maps `IllegalArgumentException`→400,
`AccessDeniedException`→403, generic `Exception`→500 (no handler for
`NoSuchElementException`/`UsernameNotFoundException`).

`Patient extends User` / `Dentist extends User` via
`@Inheritance(strategy = InheritanceType.JOINED)` (shared `users` parent
table, PK-linked child tables). Confirmed `PatientServiceImpl.delete()` /
`DentistServiceImpl.delete()` delete via the child repository, which JPA
correctly cascades to both joined rows — so the orphaned state (parent
`users` row survives, child row gone) is **not reachable through any current
app code path**; only manual DB action, a migration bug, or a test/seed
script touching only the child table.

Given that orphaned state, exact status codes today:

- **400** (`IllegalArgumentException`): `AppointmentController.save()` (PATIENT branch),
  `.findById()` (DENTIST branch), `.update()` (DENTIST branch),
  `.updateStatus()` (DENTIST branch), and
  `AppointmentServiceImpl.findAllForCurrentUser()` (PATIENT branch and DENTIST
  branch — 2 separate `.orElseThrow()` sites, reached from
  `GET /appointments`) — 6 call sites.
- **403** (`AccessDeniedException`): `PatientController.update()`,
  `PatientController.findById()`, `DentistController.update()` — 3 call
  sites.

Same underlying condition ("authenticated principal has no backing
Patient/Dentist row"), inconsistent exception choice per controller family.

Two additional structurally distinct paths found beyond the original debt
note's scope:

- `JwtAuthenticationFilter.doFilterInternal()` calls
  `userDetailsService.loadUserByUsername()` (backed by
  `IUserRepository.findByEmail`, the `users` table itself). If that row is
  gone (not just the child row), it throws `UsernameNotFoundException`,
  which is NOT caught by the filter's
  `catch (JwtException | IllegalArgumentException ex)` block and propagates
  out. The filter runs via
  `addFilterBefore(..., UsernamePasswordAuthenticationFilter.class)`, i.e.
  before Spring Security's `ExceptionTranslationFilter`, so it isn't
  translated to 401/403, and `@RestControllerAdvice` doesn't catch
  filter-chain exceptions either — a third, uninvestigated-live status
  outcome (likely container-level 500).
- `AuthenticationService.login()` L167-170:
  `userRepository.findByEmail(...).orElseThrow()` with no exception type →
  defaults to `NoSuchElementException` → falls to the generic 500 handler.
  Adjacent race-condition scenario, not stale-JWT itself, but same "no row
  for this email" condition producing yet another status code.

Test coverage: confirmed zero — grepped `backend/src/test` for
`findByEmail` and the exact denial messages; only match
(`AuthenticationControllerTest.java`) is unrelated (registration/role-
persistence assertions).

## Affected Areas

- `backend/src/main/java/com/dh/dentalClinicMVC/controller/AppointmentController.java`
  — owns `hasRole()`; 1 inline duplicate in `findAll()`; 4
  findByEmail-miss→400 sites
- `backend/src/main/java/com/dh/dentalClinicMVC/controller/PatientController.java`
  — 2 inline duplicates; 2 findByEmail-miss→403 sites
- `backend/src/main/java/com/dh/dentalClinicMVC/controller/DentistController.java`
  — 1 inline duplicate; 1 findByEmail-miss→403 site
- `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/AppointmentServiceImpl.java`
  (L244-268) — 2 more findByEmail-miss→400 sites
- `backend/src/main/java/com/dh/dentalClinicMVC/configuration/JwtAuthenticationFilter.java`
  — uncaught `UsernameNotFoundException` path (authentication layer, not
  authorization)
- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationService.java`
  (login, L167-170) — adjacent 500-producing path
- `backend/src/main/java/com/dh/dentalClinicMVC/exception/GlobalExceptionHandler.java`
  — defines the 400/403/500 mappings
- `backend/src/main/java/com/dh/dentalClinicMVC/entity/User.java` /
  `Patient.java` — JOINED inheritance explains why orphaning needs manual DB
  action

## Ready for Proposal

Yes for structural mapping. No fix proposed (out of scope for read-only
exploration). Design phase should decide: shared role-check utility
placement + whether a multi-role variant is needed for
`PatientController.findById()`'s compound check; which status code (400,
403, or other) is correct for the findByEmail-miss condition across all 9
call sites; and whether the `JwtAuthenticationFilter`/
`AuthenticationService.login()` adjacent paths belong in this same cleanup
or a separate ticket.

## Open Questions for Proposal

- Should the shared role-check helper live as a `@Component` bean, a static
  utility class, or move onto a shared base controller?
- Does `PatientController.findById()`'s compound
  `ADMIN || DENTIST` check need a multi-role-capable variant of the helper,
  or is a single extra call acceptable?
- What's the correct HTTP status for "authenticated principal has no
  backing Patient/Dentist row" — 403, 404, or something else — and should
  it be unified across all 9 call sites?
- Are the `JwtAuthenticationFilter` and `AuthenticationService.login()`
  adjacent paths in scope for this change, or split into a separate
  follow-up?

**Limitation**: the `JwtAuthenticationFilter` uncaught-exception path was
identified structurally but not exercised live (no test/curl repro); its
exact resulting HTTP status is inferred, not confirmed.
