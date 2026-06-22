# Proposal: Unify Global Wiring Source (single-listener delegation + duplicate-`window.*` guard)

## Intent

Every frontend entity (Patient, Dentist, Auth, Appointment) ships its business logic in a
canonical controller `{entity}/modules/index.js` that registers its OWN
`document.addEventListener("DOMContentLoaded", ...)` listener and publishes the entity's
`window.*` globals. Every page also loads a page-specific **wrapper** file
(`{entity}-list-controller.js`, `{entity}-controller.js`, `login-controller.js`, etc.) that
registers a SECOND, fully independent `DOMContentLoaded` listener doing its own singleton
check-create-publish dance and assigning its own `window.*` globals. The two listeners race;
nothing prevents both from assigning the same global name.

This is not hypothetical. The exact bug class already manifested:
- It was first reported and fixed for `patient-list-controller.js` / `dentist-list-controller.js`
  vs their `modules/index.js` (the `setup-global-functions-overwrite-race` fix).
- During exploration of THIS change a fresh live instance was found in
  `dentist/dentist-controller.js` (9 `window.*` names colliding with `dentist/modules/index.js`)
  and **already fixed separately in commit `337d380` — it is NOT in this change's scope**.

The root cause both fixes only patched at the symptom level is structural: **two independent
`DOMContentLoaded` listeners exist per page at all.** The codebase even has comments documenting
a deliberate workaround for the related singleton-instance race ("publicar la instancia ANTES de
inicializar para que ningún otro listener concurrente cree una segunda instancia"), which proves
the dual-listener problem is known but its root has never been removed. As long as two listeners
co-exist, any future PR can reintroduce a duplicate assignment with no signal.

**Scope is the structural fix plus a cheap automated guard**, across 9 wrapper files and 4
canonical controllers, rolled out one entity at a time. Success: each entity has exactly one
init entrypoint (the wrapper explicitly calls an exported init from `modules/index.js` instead of
both files auto-initializing), and a Jest guard fails CI if any future PR reassigns the same
`window.<name>` in both a canonical and its wrapper file.

## Scope

### In Scope

1. **Automated guard** — a new Jest static-source test (matching the existing
   `frontend/test/*-srp-split.test.js` pattern) that, for each entity's canonical+wrapper file
   set, asserts no `window.<name> =` assignment appears in more than one file of the set. Fails on
   reintroduction of the duplicate-assignment bug class.
2. **Single-listener delegation refactor**, applied per entity in this confirmed order
   **Appointment → Patient → Dentist → Auth**:
   - `{entity}/modules/index.js` exports a named init function (e.g. `initAppointmentController()`)
     and **no longer auto-runs its own `DOMContentLoaded` listener**.
   - Each wrapper imports and explicitly calls that exported init instead of running its own
     competing instantiate-publish-init logic.
3. **Auth `head.ejs` special-case handling** — Auth's `modules/index.js` is `<script>`-tagged
   sitewide in `frontend/src/views/partials/head.ejs`, so removing its self-init turns that tag
   into a no-op unless `head.ejs` (or auth's load topology) is adjusted to call the exported init.
   This is scoped here as Auth's own sub-task; the concrete mechanism is a `sdd-design` decision.

### Out of Scope

- **Full file merge** (the exploration's Option 1 — collapsing canonical + wrapper into one file
  per page). Explicitly rejected: blast radius (EJS `<script>` tag rewrites + manual collision
  resolution + auth sitewide entanglement) is disproportionate to the marginal risk removed.
- **The `dentist-controller.js` 9-collision live bug** — already fixed in commit `337d380`. Do not
  re-fix.
- **The `window.isAdmin` collision** — `auth/modules/index.js` defines it as a function while
  `appointment/modules/server-data-loader.js` sets it as a boolean state flag. This is a
  cross-entity naming collision between unrelated concepts, NOT the dual-listener race pattern.
  Tracked as separate debt; not touched here.
- **Any behavior change to the ~13 `window.*` globals per entity** beyond the wiring mechanism.
  No globals added, removed, renamed, or re-implemented. Dead "for compatibility" exports stay as-is.
- Backend (Spring Boot) changes — none.

## Capabilities

> This section is the CONTRACT between proposal and specs phases.

### New Capabilities

- **Duplicate-`window.*`-assignment CI guard** — a test capability that detects, per entity, the
  same `window.<name> =` assigned across a canonical/wrapper file set, and fails the build.

### Modified Capabilities

- **Per-entity init wiring** — changes from "two independent `DOMContentLoaded` listeners, each
  instantiating/publishing the controller" to "one init entrypoint: wrapper calls the canonical's
  exported init". Observable runtime behavior (which globals exist, what they do) is unchanged.

## Approach

### Part A — Automated guard (build first, independent of any refactor)

Add a new test file in `frontend/test/` (e.g. `global-wiring-source.test.js`) following the
established static-source-analysis style (`fs.readFileSync` + string/regex assertions, no DOM, no
import execution) already used by `appointment-srp-split.test.js` et al. Runs under the existing
`jest --runInBand` (`npm test` in `frontend/`).

Mechanism (concrete):
1. Define the canonical+wrapper file set per entity, e.g.:
   - Patient: `patient/modules/index.js` + `patient-list-controller.js` +
     `patient-add-controller.js` + `patient-edit-controller.js`
   - Dentist: `dentist/modules/index.js` + `dentist-list-controller.js` + `dentist-controller.js`
   - Auth: `auth/modules/index.js` + `login-controller.js` + `register-controller.js`
   - Appointment: `appointment/modules/index.js` + `appointment-list-controller.js` +
     `appointment-controller.js`
2. For each file, read its source and extract every assigned global via a regex over
   `window.<name> =` (capturing `<name>`).
3. For each entity, assert the multiset of names assigned across its file set has **no name
   appearing in two or more files** — fail listing the offending name(s) and files.
4. The guard is **purely additive and asserts on current (post-`337d380`) source**, so it must pass
   green the moment it lands. It does not require any refactor to exist first; it is the safety net
   the refactor then runs under (Strict TDD is active on this repo).

`sdd-spec`/`sdd-design` should finalize: exact regex (function vs non-function-state assignments
like `window.currentSort`), whether instance-singleton names (`window.xController`) are exempted,
and the precise file-set definition (single source of truth to avoid drift as files are added).

### Part B — Single-listener delegation (per entity, Appointment first)

Concrete pattern for **Appointment** (the pilot — its `modules/index.js` owns zero `window.*`
function globals, only the `window.appointmentController` singleton, so it is the cleanest place to
prove the shape before touching the scarred entities):

**In `appointment/modules/index.js`** — today the bottom of the file is:
```js
document.addEventListener("DOMContentLoaded", () => {
  // singleton check-create-publish + await controller.init()
});
export default AppointmentController;
```
becomes an exported init function the wrapper calls explicitly:
```js
export async function initAppointmentController() {
  if (window.appointmentController) return window.appointmentController;
  const controller = new AppointmentController();
  window.appointmentController = controller;      // publish BEFORE init (existing race-safety convention preserved)
  await controller.init();
  return window.appointmentController;
}
export default AppointmentController;
```
The self-running `DOMContentLoaded` listener is removed — `modules/index.js` no longer
auto-initializes.

**In the wrapper (`appointment-list-controller.js` / `appointment-controller.js`)** — today each
wrapper has its OWN `DOMContentLoaded` that re-runs the same instantiate-publish-init dance. It
becomes:
```js
import { initAppointmentController } from "./modules/index.js";
document.addEventListener("DOMContentLoaded", async () => {
  await initAppointmentController();
  // page-specific wrapper glue + its own (disjoint) window.* assignments stay
});
```
Result: exactly one listener does controller init per page; the wrapper's page-specific globals are
untouched. This same shape is then replicated for Patient and Dentist.

**Auth (last, special case)** — `auth/modules/index.js` is `<script type="module">`-tagged directly
in `head.ejs` sitewide, so it is itself a real top-level entrypoint on every page (not only composed
via a wrapper, unlike the other three). Removing its self-init makes that sitewide tag a no-op. The
fix is therefore asymmetric and needs a design decision (Part of `sdd-design`): either (a) `head.ejs`
calls the exported `initAuthController()` after tagging the module, or (b) auth keeps a single
listener in `modules/index.js` and only `login-controller.js`/`register-controller.js` defer to it
instead of re-instantiating. Auth is deliberately migrated last and its diff kept separate because it
touches a sitewide-shared EJS file.

## Affected Areas

| Area | Impact | Notes |
|------|--------|-------|
| `frontend/test/global-wiring-source.test.js` | New | The guard (Part A) |
| `frontend/public/js/appointment/modules/index.js` | Modified | Export init, drop self-listener (pilot) |
| `frontend/public/js/appointment/appointment-list-controller.js` | Modified | Call exported init |
| `frontend/public/js/appointment/appointment-controller.js` | Modified | Call exported init |
| `frontend/public/js/patient/modules/index.js` | Modified | Export init, drop self-listener |
| `frontend/public/js/patient/patient-list-controller.js` | Modified | Call exported init |
| `frontend/public/js/patient/patient-add-controller.js` | Modified | Call exported init |
| `frontend/public/js/patient/patient-edit-controller.js` | Modified | Call exported init |
| `frontend/public/js/dentist/modules/index.js` | Modified | Export init, drop self-listener |
| `frontend/public/js/dentist/dentist-list-controller.js` | Modified | Call exported init |
| `frontend/public/js/dentist/dentist-controller.js` | Modified | Call exported init |
| `frontend/public/js/auth/modules/index.js` | Modified | Export init; sitewide-tag special case |
| `frontend/public/js/auth/login-controller.js` | Modified | Call exported init |
| `frontend/src/views/partials/head.ejs` | Modified (Auth only) | Bootstrap call for the sitewide auth tag — design decision |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Auth `head.ejs` sitewide tag mishandled → auth fails to init on every page | Medium | Isolate as its own slice (last); `sdd-design` decides head.ejs vs internal-single-listener; verify on a non-login page |
| A wrapper relies on the controller existing before its own glue runs (e.g. `dentist-controller.js` reads `window.cancelDentistEdit`) | Medium | `await initXController()` before wrapper glue; preserve publish-before-init ordering |
| Guard file-set definition drifts as new wrappers/entities are added | Low | Single source-of-truth file-set in the test; `sdd-spec` pins it |
| Guard regex flags benign non-function state (`window.currentSort`) or instance singletons (`window.xController`) | Low | `sdd-spec` defines exemptions explicitly |
| `register-controller.js` / `appointment-controller.js` EJS-tagging not fully verified in exploration | Low | Re-verify which views tag them during `sdd-spec`/`sdd-apply` before editing |

## Size / Delivery Shape (feeds Review Workload Guard)

Naturally **5 slices**, not one PR:
- **Slice 0 — guard** (Part A): one new test file, additive, ~low risk, must land green first.
- **Slice 1 — Appointment** (pilot): 1 canonical + 2 wrappers.
- **Slice 2 — Patient**: 1 canonical + 3 wrappers.
- **Slice 3 — Dentist**: 1 canonical + 2 wrappers (one of which has the live cross-call binding).
- **Slice 4 — Auth**: 1 canonical + 2 wrappers + `head.ejs` special case (highest-risk slice).

Each entity slice is independent (no entity depends on another's fix), so this is well-suited to
chained/stacked PRs. This proposal does not pick the chain strategy — it flags the 4+1 shape so the
later Review Workload Guard can decide.

## Rollback Plan

- Per-slice git revert. Each slice is self-contained (one entity's files, or the single guard file).
- The guard (Slice 0) is pure test code — reverting it removes detection only, changes no runtime.
- Auth slice reverts independently and includes the `head.ejs` edit, so reverting it restores the
  prior sitewide load behavior atomically.

## Success Criteria

- [ ] Guard test exists in `frontend/test/`, passes green on current source, and fails when a
      duplicate `window.<name> =` is introduced across a canonical/wrapper set.
- [ ] For each migrated entity, `modules/index.js` exports a named init and has no self-running
      `DOMContentLoaded` controller-init listener.
- [ ] Each wrapper calls the exported init instead of re-instantiating/publishing the controller.
- [ ] Exactly one controller-init path runs per page (no dual-listener init race).
- [ ] No `window.*` global added, removed, renamed, or behaviorally changed.
- [ ] Auth still initializes correctly on both login/register pages AND every non-auth page (the
      sitewide `head.ejs` path).
