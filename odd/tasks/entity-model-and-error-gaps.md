# Entity Model and Error-Contract Gaps

Branch `refactor/entity-model-and-error-gaps` (from `main@56955ec`). Closes the remaining empty-body error responses, removes the JPA entity from `AppointmentController`, and hardens the `User`/`Patient`/`Dentist` entity model.

## Specs

Approved proposal (user: "bien", then "si sumalas"), quoted from the plan the user approved:

- S1 (Unit A): "Unificar los cuerpos vacíos restantes con `ErrorResponse`." Every controller branch that today returns a 4xx with an empty body (`ResponseEntity.status(HttpStatus.FORBIDDEN|NOT_FOUND|UNAUTHORIZED).build()` or `ResponseEntity.notFound().build()`) must instead produce the `ErrorResponse` JSON through `GlobalExceptionHandler`, keeping the same HTTP status. Known sites include IDOR 403s in `PatientController.findById`/`update`, `DentistController.findById`/`update`, dentist ownership 403s in `AppointmentController.update`/`updateStatus`, 404s in `AppointmentController.findById`, `PatientController.findById`, `DentistController.findById`/`findByRegistrationNumber`, and defensive 401s in `AppointmentController.findAll`/`searchAppointments`. Existing `log.warn` IDOR/reassignment lines stay.
- S2 (Unit A): "borrar la 'Excepciones conocidas' de `docs/api-errors.md` porque deja de ser verdad". README and CONEXION.md stop mentioning empty-body exceptions.
- S3 (Unit B): "Sacar `entity.User`/`Role` de `AppointmentController`." `findAll` and `searchAppointments` derive identity and role only from `Authentication` (name + authorities via `AuthorizationUtils`), never from `auth.getPrincipal() instanceof User`. Value enums (`Role`, `AppointmentStatus`) used in service signatures and request params may stay; the `entity.User` import must go.
- S4 (Unit C1): "Reemplazar `@Data` por `@Getter`/`@Setter` con `equals`/`hashCode` basados en el `id`" on JPA entities `User`, `Patient`, `Dentist`, `Address`, `Specialty`. `toString` must not traverse lazy collections (`appointments`, `specialties`).
- S5 (Unit C2): "Garantizar la consistencia entre `role` y `user_type` en la base, con un `CHECK` constraint vía migración Flyway". Discovery: Flyway runs only in `prod` (`application-prod.properties:8`); dev/test/e2e use `ddl-auto=create-drop`. Therefore C2 also adds an entity-level guard (testable under H2) that rejects persisting/updating a `User` whose `role` does not match its subclass (`Patient`↔`PATIENT`, `Dentist`↔`DENTIST`, plain `User`↔`ADMIN`), and, if H2 can run V1-V4, a migration test proving the V4 SQL applies.

Out of scope (product decision noted, not decided): `Patient.appointments` `cascade = ALL` + `orphanRemoval` vs `Dentist.appointments` without cascade.

## Tasks

- [x] T1 (S1, S2) Unit A: empty-body 4xx → ErrorResponse, test-first; docs update — route: worker (mwdy7952-3-p54r) — commit: 1b293e2
- [x] T2 (S3) Unit B: remove entity.User principal dependency from AppointmentController — route: worker (mwdykex3-4-o0qi) — commit: 650b699
- [x] T3 (S4) Unit C1: Lombok-safe entities with id-based equals/hashCode — route: worker (mwdyr221-5-o379) — commit: 202799a
- [x] T4 (S5) Unit C2: role/user_type consistency (V4 CHECK + entity guard + migration test) — route: worker (mwdz6lou-6-u8qq + mwdznun9-7-ou6i) — commit: 1973f0a
- [x] T5 (S1-S5) Full verification + independent gentle-ai-verify — route: gentle-ai-verify (mwdzwzrh-8-h76s PASS) — commit: pending doc-fix commit
- [ ] T6 Vault sync (referencia-verificada + milestones), merge/push with user consent — route: parent — commit: none

## Log

- L1: User request: "si seguimos" → plan proposed (A: empty bodies, B: entity.User out of AppointmentController, vault sync). User: "bien, antes de seguir como tenemos organizado el user con patient y dentist?" then "es correcto como esta?" then "si sumalas" (add Unit C: Lombok entities + role/user_type consistency).
- L2: Parent corrected an earlier claim: `user_type` IS applied by Hibernate 6 (HHH000457) and is `NOT NULL` in V1; `role` and `user_type` are two sources of truth for the user kind.
- L3: Discovery before T4: Flyway disabled in dev/test/e2e (`spring.flyway.enabled=false`, `ddl-auto=create-drop`); a V4-only CHECK would never be exercised by tests. Added entity-level guard + migration test to S5.
- L4: T1 done by worker: 14 sites converted (7 AppointmentController, 3 PatientController, 4 DentistController incl. by-registration 404); 12 RED asserts (empty body) then GREEN; 78 controller tests pass; defensive 401s unreachable in tests (security chain answers first) — changed without fake tests; docs known-exceptions section removed. Commit 1b293e2. (Count corrected 13→14 by verifier mwdzwzrh-8-h76s.)
- L5: T2 done by worker: single currentRole(Authentication) helper derives role from authorities; zero entity.User references in controller/; 54 focused tests green. Commit 650b699.
- L6: T3 done by worker: @Data/@EqualsAndHashCode replaced by @Getter @Setter + hand-written id-based equals/hashCode on all five entities; no generated toString (lazy collections never traversed); EntityIdentityTest RED (2/3 failed against @Data) then GREEN 3/3; full suite 286/0. Commit 202799a.
- L7: T4 done by workers: discriminator discovery pinned 'User'/'Patient'/'Dentist'; @PrePersist/@PreUpdate guard in User rejects role↔user_type mismatch; V4__enforce_user_role_matches_user_type.sql named CHECK; FlywayV4UserTypeCheckTest proves V1→V4 apply on H2 MySQL mode and the CHECK rejects inconsistent UPDATEs (bounded attempt succeeded first try). Guard caught a pre-existing inconsistent fixture (Patient with Role.ADMIN in JwtCookieAuthIntegrationTest): parent approved fix; worker found the role was endpoint-relevant (GET /patients requires ADMIN/DENTIST) and switched the cookie-only test to GET /patients/{own-id} as PATIENT — deviation verified by parent, intent preserved. Full suite 292/292. Commit 1973f0a.
- L8: T5 done: independent verify mwdzwzrh-8-h76s PASS on S1-S5 (79 backend focused tests incl. 10 contract classes, 150/150 frontend, diff scope clean, no frontend changes); full suite job-5 292/292; frontend build + impeccable [] (job-6). Verifier doc leftovers fixed inline (CONEXION.md:67 pointer, api-errors.md heading level) + log miscount corrected. Verifier advisories recorded: prod data must be consistent before V4 deploy (query users for role/user_type mismatches pre-deploy); latent service-layer guard path unreachable over HTTP; User.equals asymmetry vs subclass documented trade-off.
