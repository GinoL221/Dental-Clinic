# Design: Unify Global Wiring Source (single-listener delegation)

## Technical Approach

Each entity (Appointment, Patient, Dentist, Auth) currently has TWO independent
`DOMContentLoaded` listeners that each run the same instantiate-publish-init dance: one inside
the canonical `{entity}/modules/index.js`, and one inside every page wrapper
(`{entity}-list-controller.js`, etc.). They race; both can assign the same `window.<name>`.

The fix removes the canonical's self-running listener and replaces it with a single **exported,
idempotent init function**. Every wrapper imports and `await`s that function instead of running
its own competing instantiation. Result: exactly one controller-init path per page, owned by the
canonical, with wrappers as thin composers. No `window.*` global is added, removed, renamed, or
behaviorally changed — only the wiring mechanism changes.

Rollout is **per entity, one slice each, in order Appointment → Patient → Dentist → Auth**, plus a
guard test that lands first (Slice 0). Each entity slice touches only its own files, so the slices
are mutually independent and chainable.

This design owns the HOW (architecture, exact code shape, sequencing). The parallel `sdd-spec`
phase owns the guard test's regex/exemptions/file-set — not redefined here.

## Architecture Decisions

### Decision 1 (CENTRAL): Auth `head.ejs` sitewide special case

Auth is asymmetric: `auth/modules/index.js` is `<script type="module">`-tagged directly in
`frontend/src/views/partials/head.ejs` line 42, so it is a real top-level entrypoint on EVERY
page — not only composed via a wrapper like the other three. Removing its self-init would turn
that sitewide tag into a no-op and break auth (route protection + HTTP interceptors) on every page
unless something calls the export.

| Option | Mechanism | Tradeoff | Decision |
|--------|-----------|----------|----------|
| A: View owns bootstrap | `head.ejs` (or an inline `<script type="module">` right after the tag) imports and calls `initAuthController()` | Moves init responsibility into an EJS template; the sitewide tag becomes import-only; one more place where load topology lives; inconsistent with the other 3 entities where the CANONICAL owns init and wrappers/templates never bootstrap | **Rejected** |
| B: Canonical keeps the one real listener; wrappers defer | `auth/modules/index.js` KEEPS its single `DOMContentLoaded` (it is the only sitewide entrypoint and has no wrapper composing it). It also exports `initAuthController()` for explicit callers. `login-controller.js` stops instantiating and defers to whatever the canonical published. `register-controller.js` already does not touch `window.authController` — left as-is. `head.ejs` is UNCHANGED. | Auth's canonical keeps a self-listener while the other 3 lose theirs — asymmetric. But that asymmetry mirrors reality: auth genuinely IS the only sitewide-tagged module with no wrapper-composer. | **Selected** |

**Rationale**: Option B is MORE consistent with the project's real invariant than Option A, not
less. The invariant across all 4 entities is "**the canonical owns init; the wrapper defers**".
For Appointment/Patient/Dentist the canonical is only reachable via a wrapper, so the canonical
exposes an export and the wrapper drives it. For Auth the canonical is itself the sitewide
entrypoint (via `head.ejs`), so the canonical legitimately keeps the listener that fires it — and
the wrapper (`login-controller.js`) becomes the deferring party, exactly like the other wrappers.
Option A would invert this by making an EJS template the bootstrapper, introducing a NEW pattern
(template-owned init) that exists nowhere else and entangles load topology with a sitewide-shared
view file. The dual-listener race is still eliminated under B because the SECOND listener (in
`login-controller.js`) is the one removed; the canonical's single listener is the surviving one.

**Net effect of B**: `head.ejs` line 42 stays byte-for-byte identical. The Auth slice touches only
`auth/modules/index.js` (add export, keep listener but route it through the export for idempotency)
and `login-controller.js` (drop its instantiation listener, keep its `window.validateLoginForm`
glue). `register-controller.js` needs no change for the race (it never raced), though the guard
will still cover it. This also lowers the Auth slice's risk: NO sitewide EJS edit means no
sitewide-regression surface.

### Decision 2: Exported-init shape must absorb two pre-existing canonical patterns

The canonicals are NOT uniform. Two distinct existing shapes:

| Entity | Canonical instantiation today | Globals published by canonical | Wrappers |
|--------|-------------------------------|-------------------------------|----------|
| Appointment | `new AppointmentController()` in the listener | only `window.appointmentController` | 2 (list, controller) |
| Auth | `new AuthController()` in the listener | ~8 fn globals (`window.login` etc.) at module top-level (NOT in init) | 2 (login, register) |
| Patient | `PatientController.getInstance()` (already publishes `window.patientController`) | ~15 fn globals via a method run during `init()` | 3 (list, add, edit) |
| Dentist | `DentistController.getInstance()` (already publishes `window.dentistController`) | ~13 fn globals via a method run during `init()` | 2 (list, controller) |

The exported init must therefore be defined to **reuse each canonical's existing instantiation
path** rather than force a single `new`:

- Appointment / Auth → export wraps `new XController()`.
- Patient / Dentist → export wraps `XController.getInstance()` (which already does the existence
  check + publish). Do NOT replace `getInstance` with `new` — that would regress the singleton and
  risk re-publishing.

This is a deliberate "adapt to the existing race-safety convention per entity" rule, not a
one-size pattern.

### Decision 3: Idempotency lives in the exported init

The exported init is the single guard point and must be safe to call any number of times:

- For Appointment/Auth (raw `new`): first line checks `if (window.xController) return window.xController;`
  — same guard the wrappers use today, moved into the canonical.
- For Patient/Dentist (`getInstance`): `getInstance()` already returns the existing instance if
  present, so calling init twice returns the same controller. The export additionally guards the
  `await controller.init()` via the controller's existing `this.isInitialized` flag (all four
  controllers already have it), so a second call does not re-run init side effects.

Publish-before-init ordering (the `0018cb5` double-instantiation fix) is PRESERVED: the export
assigns `window.xController` BEFORE `await controller.init()`, so any concurrent listener that
fires mid-init reuses the published instance instead of creating a second one.

### Decision 4: Slice independence (feeds chain-strategy)

Confirmed each entity slice is independent. Exact file set per slice below; no file except the
guard test is touched by two entity slices, and `head.ejs` is touched by ZERO slices (per
Decision 1, option B).

## Exported-init code shape (canonical pattern, per entity)

### Appointment (pilot) — `appointment/modules/index.js`

Replace the bottom `document.addEventListener("DOMContentLoaded", …)` block (lines ~400-429) with:

```js
export async function initAppointmentController() {
  if (window.appointmentController) return window.appointmentController;
  const controller = new AppointmentController();
  window.appointmentController = controller; // publish BEFORE init (race-safety, preserved)
  await controller.init();
  return window.appointmentController;
}
export default AppointmentController;
```

The `initializationCount` debug counter and the self-listener are removed.

### Wrapper shape — `appointment-list-controller.js` / `appointment-controller.js`

The wrapper's own instantiate-publish-init block (lines ~10-27) collapses to a single call; ALL
page-specific glue (`setupGlobalFunctions()`, autocomplete wiring, filter handlers, debug fns)
stays untouched after the `await`:

```js
import { initAppointmentController } from "../appointment/modules/index.js";
document.addEventListener("DOMContentLoaded", async () => {
  try {
    appointmentController = await initAppointmentController();
    isInitialized = true;
    setupGlobalFunctions();
    // …all existing page-specific glue stays verbatim…
  } catch (error) { /* existing catch */ }
});
```

### Patient — `patient/modules/index.js` (getInstance variant)

Replace the auto-init listener (lines ~407-415) with:

```js
export async function initPatientController() {
  const controller = PatientController.getInstance(); // already publishes window.patientController
  await controller.init();                            // controller.isInitialized guards re-run
  return controller;
}
export default PatientController;
```

The 3 wrappers (`patient-list-controller.js`, `patient-add-controller.js`,
`patient-edit-controller.js`) each replace their `new PatientController()` / publish block with
`await initPatientController()`, keeping their disjoint page glue.

### Dentist — `dentist/modules/index.js` (getInstance variant)

```js
export async function initDentistController() {
  const controller = DentistController.getInstance(); // already publishes window.dentistController
  await controller.init();
  return controller;
}
export default DentistController;
```

The 2 wrappers replace `new DentistController()` + publish with `await initDentistController()`.
`dentist-controller.js`'s `setupGlobalEvents()` and its `window.refresh/export/get/add…` glue
stay. NOTE: `dentist-controller.js`'s glue runs AFTER the `await`, so the controller (and any
`window.cancelDentistEdit` the canonical publishes during init) exists before the glue reads it —
the at-risk cross-call ordering (proposal risk row 2) is preserved by awaiting first.

### Auth — `auth/modules/index.js` (Decision 1 option B)

The canonical KEEPS its `DOMContentLoaded` listener but routes it through a new export so the
listener and any explicit caller share one idempotent path:

```js
export async function initAuthController() {
  if (window.authController) return window.authController;
  const controller = new AuthController();
  window.authController = controller; // publish BEFORE init (preserved)
  await controller.init();
  return window.authController;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const controller = await initAuthController();
    controller.setupAutomaticRouteProtection();
    controller.setupHttpInterceptors();
  } catch (error) { /* existing fatal-error handling */ }
});

// window.login / register / logout / isAuthenticated / … stay verbatim at module top-level
export default AuthController;
```

`login-controller.js` drops its own `new AuthController()` + publish + `await init()` block and
defers to the canonical, keeping only its `window.validateLoginForm` and `window.debugLoginController`
glue:

```js
import { initAuthController } from "../auth/modules/index.js";
document.addEventListener("DOMContentLoaded", async () => {
  authController = await initAuthController();
  isInitialized = true;
  setupGlobalFunctions(); // only window.validateLoginForm now
});
```

`register-controller.js` is UNCHANGED for the race — it never instantiates `AuthController` (it
only imports `logger` and runs form-validation). It stays in the guard's Auth file-set for
regression coverage but needs no edit. `head.ejs` is UNCHANGED.

## File Changes (per slice)

| Slice | File | Action | Touched by another slice? |
|-------|------|--------|---------------------------|
| 0 — guard | `frontend/test/global-wiring-source.test.js` | Create | n/a (test-only) |
| 1 — Appointment | `frontend/public/js/appointment/modules/index.js` | Modify (export init, drop self-listener + debug counter) | No |
| 1 — Appointment | `frontend/public/js/appointment/appointment-list-controller.js` | Modify (call exported init) | No |
| 1 — Appointment | `frontend/public/js/appointment/appointment-controller.js` | Modify (call exported init) | No |
| 2 — Patient | `frontend/public/js/patient/modules/index.js` | Modify (export init over `getInstance`, drop self-listener) | No |
| 2 — Patient | `frontend/public/js/patient/patient-list-controller.js` | Modify (call exported init) | No |
| 2 — Patient | `frontend/public/js/patient/patient-add-controller.js` | Modify (call exported init) | No |
| 2 — Patient | `frontend/public/js/patient/patient-edit-controller.js` | Modify (call exported init) | No |
| 3 — Dentist | `frontend/public/js/dentist/modules/index.js` | Modify (export init over `getInstance`, drop self-listener) | No |
| 3 — Dentist | `frontend/public/js/dentist/dentist-list-controller.js` | Modify (call exported init) | No |
| 3 — Dentist | `frontend/public/js/dentist/dentist-controller.js` | Modify (call exported init) | No |
| 4 — Auth | `frontend/public/js/auth/modules/index.js` | Modify (add export; keep listener, route through export) | No |
| 4 — Auth | `frontend/public/js/auth/login-controller.js` | Modify (drop instantiation, defer to export) | No |

`register-controller.js`: no edit (covered by guard only). `head.ejs`: no edit. The ONLY shared
artifact is the guard test (Slice 0), which all later slices run under but none modify.

## Interfaces / Contracts

Each canonical exports exactly one new named async function `init{Entity}Controller()` returning
the published `window.{entity}Controller`. The default export (`{Entity}Controller` class) is
unchanged. The contract every wrapper relies on: after `await init{Entity}Controller()` resolves,
`window.{entity}Controller` exists, is initialized, and is the same singleton across all wrappers
on the page.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Static guard (Slice 0) | No `window.<name> =` assigned in two files of an entity set | `sdd-spec` owns regex/exemptions/file-set — referenced, not redefined here |
| Single-init invariant | Each canonical has no self-running controller-init listener (Auth excepted: it keeps ONE, routed through the export) | Static-source assertion candidate for `sdd-spec` |
| Runtime parity | Each page's `window.*` set identical before/after | Manual: load list/add/edit per entity, plus a non-auth page for Auth, confirm globals + behavior |

## Migration / Rollout

1. Slice 0 — land guard, must pass green on current (post-`337d380`) source.
2. Slice 1 Appointment (pilot, cleanest — proves the `new` variant).
3. Slice 2 Patient (proves the `getInstance` variant + 3 wrappers).
4. Slice 3 Dentist (`getInstance` variant + the at-risk `dentist-controller.js` cross-call).
5. Slice 4 Auth (Decision 1 option B — no `head.ejs` edit, lowest-surface version of the risky slice).

### Rollback
Per-slice `git revert`. Each slice is one entity's files (or the lone guard file). Auth reverts
independently; because `head.ejs` is untouched, reverting Auth cannot regress sitewide load.

## Open Questions (for sdd-spec / sdd-apply, not blockers)

- Whether the guard exempts `window.{entity}Controller` singleton names and benign state globals
  (`window.currentSort`, `window.patientId`) — `sdd-spec` decides.
- Re-verify at apply time which EJS views `<script>`-tag each wrapper before editing
  (proposal risk row 5), especially `register-controller.js` / `appointment-controller.js`.
