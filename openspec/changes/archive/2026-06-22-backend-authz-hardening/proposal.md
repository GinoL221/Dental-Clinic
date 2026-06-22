# Proposal: Backend Authorization Hardening (object-level authz + admin provisioning lockdown)

## Intent

A security audit (engram `security/audit-2026-06-21`, re-verified against current `main`) confirmed
that the Spring Boot backend trusts client-supplied authorization data on several write and read
paths. Two of these are **CRITICAL and remotely exploitable by any anonymous or low-privilege caller**:

- **Anyone can mint an admin account** with a single anonymous request, because the public
  registration endpoint trusts a client-supplied `role` field.
- **Any logged-in patient can overwrite any other user's record AND escalate themselves to ADMIN**,
  because the update endpoints authorize on the request body's `email` but mutate the record selected
  by the request body's `id` — two different, both attacker-controlled, fields.

Three lower-severity but same-category gaps round out the surface: an unauthorized PII read on
`GET /patients/{id}`, an over-broad cross-tenant read on `GET /appointments/{id}` for dentists, a
dead public endpoint that rewrites any user's name with no auth, and a JWT signing secret whose
fallback value is committed in git history.

These are not hypothetical. The audit records concrete exploit payloads with exact file:line
evidence. This change closes the backend authorization holes. **Success** = the privileged
operations (admin creation, role changes, cross-record writes/reads) can no longer be driven by
attacker-controlled request data; legitimate self-service and admin flows keep working; and the
existing test suite plus new authz tests stay green.

This proposal covers items **1, 2, 3, 6, 7** of the audit's 7-item remediation plan. Items 4 and 5
(frontend stored-XSS escaping in `ui-manager.js` files and JWT-in-`localStorage` vs httpOnly cookie)
are explicitly a **separate, later SDD change** and are out of scope here — see Out of Scope.

## Scope

### In Scope (backend, Java / Spring Boot)

1. **Admin self-registration — CRITICAL.**
   - Current behavior (verified): `RegisterRequest.role` (`RegisterRequest.java:20`) is client-set.
     `AuthenticationService.register()` (`AuthenticationService.java:33-57`) switches on it and calls
     `createAdmin()` (`:59-72`), creating a `Role.ADMIN` user with zero authorization gate.
     `SecurityConfiguration.java:37` makes `/auth/**` `permitAll()`.
   - Exploit (audit): `POST /api/auth/register {"role":"ADMIN", ...}` → instant admin JWT, no
     prerequisites, fully anonymous.
   - Fix: the public registration path must NOT be able to create an ADMIN.

2. **IDOR + privilege escalation in Patient/Dentist update — CRITICAL.**
   - Current behavior (verified): `PatientController.update()` (`PatientController.java:42-55`) and
     `DentistController.update()` (`DentistController.java:44-57`) carry
     `@PreAuthorize("hasAnyRole('ADMIN') or #patient.email == authentication.name")`. The guard checks
     the **body's `email`** against the caller, but the service then loads/overwrites the record by
     the **body's `id`** (`patientService.findById(patient.getId())` then `patientService.update(patient)`),
     and the `Patient`/`Dentist` body carries a `role` field that is persisted.
   - Exploit (audit): a logged-in PATIENT sends
     `PUT {"id": <victim_id>, "email": "<their-own-email>", "role": "ADMIN"}` — the `@PreAuthorize`
     passes (email matches caller), then the VICTIM's row is overwritten with the attacker's email +
     ADMIN role. Same pattern in both controllers/services.
   - Also in scope: **`PatientController.findById` (`:66-70`) has NO `@PreAuthorize`** — any
     authenticated user reads any patient's full PII (via `findByIdAsDTO`) by incrementing the id.
   - Fix: target record must be resolved/validated against the authenticated principal, not the body
     `id`; `role` must not be settable via self-service update; and the patient read-by-id must be
     authorized. (Note: `DentistController.findById` (`:68-70`) already has `@PreAuthorize("hasRole('ADMIN')")`.)

3. **Over-broad appointment read — MEDIUM (same category as 1-2).**
   - Current behavior (verified): `AppointmentController.findById` (`AppointmentController.java:66-76`)
     carries `@PreAuthorize("hasAnyRole('ADMIN','DENTIST')")` and returns the appointment with no
     ownership check — any DENTIST reads any other dentist's/patient's appointment by id.
   - Fix: scope the DENTIST read to their own appointments (ADMIN stays unrestricted), reusing the
     ownership pattern **already present** in this same controller's `update`/`updateStatus`
     (inline "Fix 3/4" — `existing.getDentist_id().equals(dentist.getId())`).

6. **Dead, unauthenticated name-rewrite endpoint — delete.**
   - Current behavior (verified): `PUT /auth/update-names/{email}`
     (`AuthenticationController.java:29-41`) loads any user by path email and overwrites their
     `firstName`/`lastName` with request params, under `permitAll()`, no auth. Audit confirmed
     **zero frontend callers** (added as "temporal" debug code, never removed).
   - Fix: delete the endpoint outright.

7. **Hardcoded JWT secret fallback — remove the fallback.**
   - Current behavior (verified): `application-dev.properties:15` is
     `app.jwt.secret=${JWT_SECRET:8ad092...49f36294}` — the fallback is committed to git history.
     (`application-prod.properties` has no fallback and fails fast — good.)
   - Fix (code): remove the committed fallback so a missing `JWT_SECRET` fails fast even under the
     `dev` profile. **Secret rotation is a non-code operational action item** flagged as a risk, not
     fixed by this change (see Risks).

### Out of Scope

- **Item 4 — frontend stored XSS escaping** in `appointment/`, `patient/`, `dentist/`
  `modules/ui-manager.js` (template-literal `innerHTML` with unescaped user fields) and
  `postLogin.js`'s inline `<script>` interpolation. **Sibling change** — frontend, different blast
  radius and test surface. Noted here so it is not forgotten; not touched.
- **Item 5 — JWT double-storage** (`localStorage` vs httpOnly cookie) in `auth-api.js` /
  `postLogin.js`. **Sibling change** — frontend/transport concern, pairs with item 4. Not touched.
- **`AppointmentController` write-path ownership** (`save`/`update`/`updateStatus`) — already
  remediated in a prior session (inline "Fix 1/3/4"). Do NOT redo; only the `findById` read gap
  (item 3) remains open there.
- **`DentistController.findById` authorization** — already `ADMIN`-only; not touched.
- **Any change to authentication mechanics** (JWT issuance, login, password encoding, the filter
  chain structure) beyond removing the dev secret fallback. No new auth framework, no session model
  change.

## Capabilities

> This section is the CONTRACT between proposal and specs phases.

### New Capabilities

- **Admin account provisioning (privileged-creation boundary).** A defined, authorization-gated way
  to create ADMIN accounts that is NOT the public registration path. The seed already exists
  (`DataInitializer.java:56-77` idempotently creates `admin@dentalclinic.com`); this capability makes
  that the *only* sanctioned admin-creation route, optionally plus a future admin-only endpoint.

### Modified Capabilities

- **Object-level (record-ownership) authorization.** Today authorization is role-level (`hasRole`)
  plus a spoofable body-field email check; the target record is chosen by client-supplied `id`. This
  capability changes to: privileged/owned operations resolve or validate the target record against
  the authenticated principal, and reject mutation of authorization-relevant fields (`role`) on
  self-service paths.
- **Public registration contract.** Changes from "caller picks any role including ADMIN" to "public
  registration can only produce non-privileged roles (PATIENT/DENTIST)".

## Approach

Per-item fix DIRECTION at proposal granularity. Exact code mechanics (annotations, service
signatures, DTO shapes) are **`sdd-design`'s job** — flagged design questions are called out inline.

### Item 1 — Admin self-registration

**Recommended direction:** strip the public registration path of any ability to create ADMIN. The
public `register` flow should only ever produce `PATIENT` or `DENTIST`. Admin accounts come from the
already-existing idempotent seed (`DataInitializer`) and, if runtime admin creation is needed, from a
**separate admin-only endpoint** under the existing `/admin/**` (already `hasRole('ADMIN')` in
`SecurityConfiguration.java:47`) — never from `permitAll()` `/auth/register`.

**Design question for `sdd-design` (real ambiguity):** two viable shapes —
  (a) keep one `register` endpoint but reject/ignore `ADMIN` in the `role` switch (treat ADMIN as an
      invalid public role, `400`), leaving DataInitializer as the only admin source; or
  (b) additionally add an authenticated `POST /admin/users` (admin-only) for runtime admin creation.
Recommendation: ship (a) now (closes the hole with the smallest surface); treat (b) as optional and
only if a product need for runtime admin creation is confirmed. `sdd-design` finalizes.

### Item 2 — Patient/Dentist update IDOR + priv-esc, and patient read-by-id

This is the highest-design-content item. Two distinct sub-fixes:

**2a — the update IDOR/priv-esc.** The body-`email` vs body-`id` mismatch must be closed AND `role`
must not be self-settable.

**Design questions for `sdd-design` (must be answered before apply):**
  - *Target resolution:* should `update` resolve the target record **from the authenticated
    principal** (load the caller's own record by `authentication.name`, ignore body `id` entirely for
    non-admins), or **validate** body `id` against the caller's own record before trusting it?
    Recommendation: resolve-from-principal for non-admin self-service (most robust — body `id` becomes
    non-authoritative); ADMIN may still target by `id`.
  - *Role mutability:* should `role` ever be settable via this self-service endpoint? Recommendation:
    **no** — strip/ignore `role` (and other privileged/identity fields) on the self-service path;
    role changes, if needed at all, belong to a separate admin-only operation. `sdd-design` decides
    whether that is "ignore the field" vs "reject the request if present".
  - *Email mutability:* changing your own `email` is also identity-relevant (it is the JWT subject).
    `sdd-design` should decide whether self-service email change is allowed here or deferred.

**2b — `PatientController.findById` authorization.** Add object-level authorization so a patient can
read only their own record while ADMIN/DENTIST keep the read access they legitimately need.
**Design question:** exact policy — `ADMIN`/`DENTIST` unrestricted + `PATIENT` self-only, vs
`ADMIN`-only like the dentist endpoint? Recommendation: ADMIN/DENTIST + PATIENT-self, mirroring the
`findAll` role set (`PatientController.java:74` allows `ADMIN,DENTIST`), since dentists already list
patients. `sdd-design` confirms.

### Item 3 — Appointment read ownership

Reuse the ownership pattern already in `AppointmentController` (`update`/`updateStatus` "Fix 3/4"):
for a DENTIST caller, load the appointment and return `403` unless `existing.getDentist_id()` equals
the caller's dentist id; ADMIN unrestricted. Low design content — mechanical reuse of existing code
in the same file. `sdd-design` confirms whether PATIENT should also read their own appointments here
(currently the endpoint excludes PATIENT entirely; keeping that exclusion is the minimal change).

### Item 6 — Delete dead endpoint

Delete `updateUserNames` (`AuthenticationController.java:29-41`) and its mapping. Confirm no
references remain (audit already verified zero frontend callers; `sdd-apply` re-greps backend + tests
before deleting). No design content.

### Item 7 — JWT secret fallback

Remove the `:8ad092...` fallback from `application-dev.properties:15`, leaving
`app.jwt.secret=${JWT_SECRET}` so a missing env var fails fast under `dev` too (matching prod). No
design content for the code change. **Rotation is operational, not in this diff** (see Risks).

## Affected Areas

| Area | Impact | Notes |
|------|--------|-------|
| `backend/.../authentication/RegisterRequest.java` | Modified | Item 1 — `role` no longer authoritative for public registration (design picks ignore vs reject ADMIN) |
| `backend/.../authentication/AuthenticationService.java` | Modified | Item 1 — `register()`/role switch can no longer reach `createAdmin()` via public path |
| `backend/.../authentication/AuthenticationController.java` | Modified | Item 6 — delete `updateUserNames` + mapping; possibly Item 1 if an admin-only create endpoint is added (design) |
| `backend/.../controller/PatientController.java` | Modified | Item 2a (`update` authz/resolution) + Item 2b (`findById` `@PreAuthorize`) |
| `backend/.../controller/DentistController.java` | Modified | Item 2a (`update` authz/resolution); `findById` already ADMIN-only |
| `backend/.../service/impl/PatientServiceImpl.java` | Modified | Item 2a — update must not blindly overwrite by body `id`/`role` |
| `backend/.../service/impl/DentistServiceImpl.java` | Modified | Item 2a — same as patient service |
| `backend/.../controller/AppointmentController.java` | Modified | Item 3 — ownership scope on `findById` (reuse existing pattern) |
| `backend/src/main/resources/application-dev.properties` | Modified | Item 7 — remove committed secret fallback |
| `backend/.../configuration/SecurityConfiguration.java` | Possibly modified | Item 1 only if a new `/admin/**` create route needs wiring (design-dependent) |
| `backend/src/test/...` (authz tests) | New / Modified | New tests per item + existing auth tests likely need updating (see Risks) |

~7-8 production files plus tests. `DataInitializer.java` is referenced (admin seed) but not
necessarily modified.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **Regression locks out legitimate users** — over-tightening `update`/`findById` blocks valid self-service or admin flows (auth code is unforgiving) | Medium-High | TDD: write authz tests (allow + deny cases) per item BEFORE changing behavior; verify the existing demo seed users still work end-to-end |
| **Existing tests encode the vulnerable behavior** — current tests may pass `role` in update bodies or rely on body-`id` resolution, and will break | Medium | `sdd-spec`/`sdd-apply` must inventory existing auth/controller tests first; failing tests that asserted insecure behavior are expected and must be rewritten, not "fixed" by relaxing the code |
| **Test coverage gap** — current coverage of these exact authz paths is unknown; fixing without coverage risks silent regressions | Medium | Treat new authz tests as part of the change's definition of done, not optional; Strict TDD is active on this repo |
| **Item 7: secret already in git history** — removing the fallback does NOT un-expose the leaked key | High (already happened) | **Non-blocking, non-code action item for the user/team: rotate `JWT_SECRET` out-of-band.** This change cannot and does not fix the historical leak; flag it explicitly in the PR description |
| **Item 1 direction churn** — if `sdd-design` chooses the admin-only-endpoint shape, scope grows (new endpoint + security wiring + tests) | Low-Medium | Default to the minimal shape (reject ADMIN in public register, rely on seed); only expand if a product need is confirmed |
| **Item 2 design ambiguity unresolved** — apply could pick the wrong target-resolution strategy | Medium | `sdd-design` MUST answer the flagged target-resolution / role-mutability / email-mutability questions before `sdd-apply` starts |
| **Hidden callers of `update-names`** beyond frontend (scripts, tests, docs) | Low | `sdd-apply` re-greps the whole repo before deleting |

## Size / Delivery Shape (feeds Review Workload Guard)

Five fix areas across ~7-8 production files plus tests. The items are **largely independent** and of
mixed risk:

- **Item 6** (delete dead endpoint) and **Item 7** (remove secret fallback) are trivial, isolated,
  near-zero-risk one-liners.
- **Item 3** (appointment read ownership) is a small, mechanical reuse of an existing in-file pattern.
- **Item 1** (admin registration lockdown) is small but security-load-bearing.
- **Item 2** (IDOR + priv-esc + patient read) is the bulk of the design and test work and touches 4
  files (2 controllers + 2 services).

**Read:** the total changed-line count is likely **under the 400-line budget**, so this *can* fit a
single PR. HOWEVER, because this is security-sensitive auth code and touches the `**/auth/**` and
`**/security/**` hot paths, the pre-PR risk lenses (4R review) are strongly indicated regardless of
size. If the Review Workload Guard or the team prefers tighter review diffs, a natural split is:
**Slice A** (items 6 + 7, trivial cleanup), **Slice B** (item 1, registration lockdown),
**Slice C** (item 3, appointment read), **Slice D** (item 2, the IDOR/priv-esc core). This proposal
does NOT pick the chain strategy — it flags the shape so the Review Workload Guard decides. Default
recommendation: single PR with mandatory 4R review, fall back to the A/B/C/D split only if the diff
grows past budget or review load warrants it.

## Rollback Plan

- Each item is independently revertible (distinct files / distinct methods), so a regression in one
  fix can be rolled back without losing the others.
- Items 6 and 7 are pure deletions/config and revert cleanly with zero runtime coupling.
- Item 7 rollback note: reverting restores the committed fallback secret — acceptable only as an
  emergency stopgap, and irrelevant once the secret is rotated (the rotated key lives only in env).
- If the whole change must be backed out, `git revert` of the PR (or per-slice revert if split)
  restores prior behavior; the new authz tests revert with their corresponding fixes.

## Success Criteria

- [ ] Anonymous `POST /auth/register` with `{"role":"ADMIN"}` can NO LONGER create an admin account
      (returns a non-admin user or a `400`, per design).
- [ ] A logged-in PATIENT can NO LONGER overwrite another user's record via body `id`, and can NO
      LONGER set `role` via the self-service update path (priv-esc closed).
- [ ] `GET /patients/{id}` is authorized — a patient cannot read another patient's PII; ADMIN/DENTIST
      access per the design-confirmed policy.
- [ ] `GET /appointments/{id}` returns `403` for a DENTIST requesting an appointment they do not own;
      ADMIN unrestricted.
- [ ] `PUT /auth/update-names/{email}` no longer exists; no remaining references in code or tests.
- [ ] `application-dev.properties` has no committed JWT secret fallback; a missing `JWT_SECRET` fails
      fast under the `dev` profile.
- [ ] New authz tests cover allow + deny cases for items 1, 2, 3; the full existing suite is green
      (with insecure-behavior tests rewritten, not relaxed).
- [ ] PR description flags the out-of-band JWT secret rotation as a required operational follow-up.
- [ ] Legitimate flows (seed admin login, patient self-service update of own record, dentist managing
      own appointments) still work end-to-end.
