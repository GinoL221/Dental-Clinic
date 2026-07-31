# Apply Progress: Register Page Redesign — PR 1

Scope: Phase 1 (Validation Rules Module) + Phase 2 (Server Action Contract) only.
Branch: `feat/register-page-validation-logic`.

## Runtime-attempt ledger

- `gentle-ai sdd-attempt begin` — objective generation 1, ordinal 1, work unit "PR1 validation logic and server action", max_attempts 2, max_changed_lines 400.
- `gentle-ai sdd-attempt finish` — outcome `passed`, `harness_disposition: reused` (pure Vitest, no runtime harness change), `changed_lines: 363` (under the 400 budget).
- Note: the finish call's `--diagnosis`/`--cleanup-evidence`/`--process-evidence` free-text flags were populated with placeholder text (`"x"`) during flag-signature discovery via trial-and-error (the CLI has no `--help`). The `evidence_revision` hash and `changed_lines` are accurate. The actual RED/GREEN evidence is captured in full below and was independently verified via direct command runs.

## Phase 1: Validation Rules Module

### 1.1 RED

Created `frontend/src/lib/validation/registerForm.test.js` (32 test cases: required-field checks for all 10 fields incl. whitespace-only, email format, password minlength 6, DNI numeric-only, confirmPassword match, and `validateRegisterForm` aggregation).

Command: `npx vitest run src/lib/validation/registerForm.test.js`

```
 RUN  v1.6.1 /home/ginopc/Desarrollo/Dental-Clinic/frontend

 ❯ src/lib/validation/registerForm.test.js  (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯
FAIL  src/lib/validation/registerForm.test.js [ src/lib/validation/registerForm.test.js ]
Error: Failed to resolve import "./registerForm.js" from "src/lib/validation/registerForm.test.js". Does the file exist?

 Test Files  1 failed (1)
      Tests  no tests
```

Genuine RED: module did not exist yet.

### 1.2 GREEN

Created `frontend/src/lib/validation/registerForm.js` exporting `validateRegisterField(name, value, values)` and `validateRegisterForm(values)` per the design's interfaces.

Command: `npx vitest run src/lib/validation/registerForm.test.js`

```
 RUN  v1.6.1 /home/ginopc/Desarrollo/Dental-Clinic/frontend

 ✓ src/lib/validation/registerForm.test.js  (32 tests) 13ms

 Test Files  1 passed (1)
      Tests  32 passed (32)
```

### 1.3 REFACTOR

Shared constants (`EMAIL_PATTERN`, `NUMERIC_ONLY_PATTERN`, `PASSWORD_MIN_LENGTH`, `MESSAGES`) and JSDoc typedefs (`RegisterValues`, `FieldErrors`) were written directly into the GREEN implementation (no inline duplication was introduced to later extract). Re-ran the suite to confirm the refactor pass changed nothing observable — same 32/32 pass, same command/output as above.

## Phase 2: Server Action Contract

### 2.1 RED

Modified `frontend/src/routes/users/register/register.server.test.js`:

- Removed the obsolete `should return error on conflict 409` test (backend never returns 409 for this endpoint).
- Added `confirmPassword` to the existing successful-registration test's form data (required once the new guard exists).
- Added `should surface the backend message when the register call fails` (backend-message passthrough).
- Added `should fall back to a generic message when apiFetch fabricates a synthetic HTTP error string` (synthetic-message filter).
- Added `should short-circuit on confirmPassword mismatch without calling apiFetch` (mismatch guard, asserts `apiFetch` is never called).

Command: `npx vitest run src/routes/users/register/register.server.test.js`

```
 RUN  v1.6.1 /home/ginopc/Desarrollo/Dental-Clinic/frontend

 ❯ src/routes/users/register/register.server.test.js  (6 tests | 2 failed) 23ms
   ❯ ... should surface the backend message when the register call fails
     → expected msg "Datos de registro inválidos" to equal "El email ya está registrado"
   ❯ ... should short-circuit on confirmPassword mismatch without calling apiFetch
     → threw redirect 303 (apiFetch was called; no guard existed)

 Test Files  1 failed (1)
      Tests  2 failed | 4 passed (6)
```

Genuine RED: 2 of the 3 new-behavior tests failed against the pre-change `+page.server.js` (the third, synthetic-`HTTP error!` fallback, already passed trivially because the old code's unmatched-status branch happened to already emit a generic message — this is expected and does not indicate a stale test; the new implementation replaces status-code branching with message-based filtering).

### 2.2 GREEN

Modified `frontend/src/routes/users/register/+page.server.js`:

- Read `confirmPassword` from form data; short-circuit with `errors.general.msg = 'Las contraseñas no coinciden'` and populated `oldData` before ever calling `apiFetch`.
- Replaced the `status === 409` / `status === 400` branches with:
  ```js
  const raw = typeof err?.message === 'string' ? err.message.trim() : '';
  const errorMessage = raw && !raw.startsWith('HTTP error!') ? raw : 'Error al registrar usuario';
  ```
- Deduplicated `oldData` construction (computed once, reused by both the confirmPassword guard and the catch block).

Command: `npx vitest run src/routes/users/register/register.server.test.js`

```
 RUN  v1.6.1 /home/ginopc/Desarrollo/Dental-Clinic/frontend

 ✓ src/routes/users/register/register.server.test.js  (6 tests) 13ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
```

Also fixed two new tests that initially failed `npm run check` (TS narrowing on `void | Record<string, any>` return type) by switching from individual property access to full `toEqual` assertions, matching the existing convention in `login.server.test.js`.

## Full-suite and static verification

`npx vitest run` (full suite):

```
 Test Files  16 passed (16)
      Tests  94 passed (94)
```

`npm run check`: 89 pre-existing errors, all in `tests/fullstack/process-runner.spec.js` / `run-fullstack.js` / `process-runner-fixtures.js` (TypeScript strictness on unrelated E2E harness code, outside this change's scope). Zero errors in any file touched by this PR (`registerForm.js`, `registerForm.test.js`, `+page.server.js`, `register.server.test.js`) — confirmed via `npm run check 2>&1 | rg "registerForm|register.server|page.server"` returning no matches.

## Changed files

- `frontend/src/lib/validation/registerForm.js` (new, 77 lines)
- `frontend/src/lib/validation/registerForm.test.js` (new, 157 lines)
- `frontend/src/routes/users/register/+page.server.js` (modified, +45/-23 net per diff)
- `frontend/src/routes/users/register/register.server.test.js` (modified, +84 net per diff)

Total changed lines (git diff --numstat, insertions+deletions): **363** — under the 400-line budget.

## Constraints honored

- `+page.svelte`, `auth.css`, `forms.css` untouched (PR2 scope).
- No E2E/Playwright test created (PR3 scope).
- No `@testing-library/svelte` or component-test tooling added.
- No backend files modified.

---

# Apply Progress: Register Page Redesign — PR 2

Scope: Phase 3 (Client Wiring) + Phase 4 (Presentation CSS) only.
Branch: `feat/register-page-template-css` (checked out from an up-to-date `main`, which already has PR 1 merged as #45).

## Phase 3: Client Wiring

### 3.1 State + validation timing

`frontend/src/routes/users/register/+page.svelte`:

- Added `values` (typed `RegisterValues` via JSDoc import from the PR1 validation module), `fieldErrors` (`Record<string, string>`), `touched` (`Record<string, boolean>`) legacy-reactive `let` state, initialised from `form?.oldData?.*` coerced with `String(x || '')` (matches the existing `+page.server.js` coercion convention and satisfies `checkJs` since `form.oldData` values are typed `FormDataEntryValue`).
- `validateAndTrack(name, value)`: calls `validateRegisterField` (imported from `$lib/validation/registerForm.js`), writes `fieldErrors[name]`, and marks `touched[name] = true` only when the field is actually invalid (first-failure gate).
- `handleBlur(name)`: always calls `validateAndTrack` — implements "validates on blur" unconditionally.
- `handleInput(name)`: only calls `validateAndTrack` when `touched[name]` is already true — implements "no error while never touched" + "live re-validation after first failure" in one gate, since `touched[name]` stays sticky once set (satisfies "re-validates live... until it passes" without needing a reset path, since it also keeps re-validating if the field goes invalid again later).

### 3.2 Submit validation via `use:enhance`

- `handleSubmit({ cancel })` passed directly to `use:enhance={handleSubmit}` (matches SvelteKit's actual callback signature — the destructured `cancel` is a property of the single argument object, not a separate parameter).
- Runs `validateRegisterForm(values)`; if any errors, sets `fieldErrors`, marks every failing field `touched`, calls `cancel()`, then `tick().then(() => focusFirstInvalidField(errors))` to focus the first invalid field **in field order** (`FIELD_ORDER` constant) after the DOM updates with the new error state.
- If valid, returns `handleSubmitResult` (a named function, not an inline arrow, to satisfy `checkJs` — an inline destructured `({ update }) =>` arrow was flagged as implicit-any by `svelte-check`; extracting it to a `/** @param {{ update: () => Promise<void> }} result */`-annotated named function fixed it cleanly).

### 3.3 Accessibility wiring

- Every field: `aria-invalid={fieldErrors.x ? 'true' : 'false'}`, `aria-describedby={fieldErrors.x ? 'x-error' : undefined}`, paired with a `{#if fieldErrors.x}<p id="x-error" class="field-error">{fieldErrors.x}</p>{/if}`.
- General error banner: `role="alert"` + `tabindex="-1"` + `bind:this={errorBannerEl}`; focus happens only inside `handleSubmitResult` (the `use:enhance` result callback) after `await update()` + `await tick()` — never in a `$:` block, matching design.md's explicit rationale (avoids refocus loops). Verified via manual no-JS POST (see Manual Verification below) that the banner renders with `role="alert"`/`tabindex="-1"` in the server-rendered HTML regardless of JS.

### 3.4 Mockup markup

- Kept the existing Bootstrap `.row`/`.col-md-6` grid utility (already used for `firstName`/`lastName` and `email`/`cardIdentity` in the pre-PR markup) instead of inventing a parallel CSS-grid system — this already delivers the "consistent 2-column grid" the spec requires, matches the file's existing convention, and keeps the diff smaller. Re-paired the `Dirección` section as `street`+`number` and `location`+`province` (previously `street` alone, then `number`+`location` unevenly split, then `province` alone) and `Seguridad` as `password`+`confirmPassword` (previously two separate full-width rows) — this eliminates every isolated full-width row across all three sections, satisfying "no isolated full-width single-field rows where a 2-column pairing is possible".
- Password input's class became `form-control auth-input password-input` (per design.md's explicit decision), gaining the restyled `.auth-input`/`.auth-input.is-invalid` look for free.
- Privacy notice: replaced `<div class="alert alert-info d-flex align-items-center mt-3" role="alert">` with `<div class="privacy-notice">` (dropped the stray `role="alert"` — it was never a real alert, and the page now has one real `role="alert"` banner for the general server error).
- Dropped both inline `style` attributes (`padding-right: 45px` on the password input, and the full absolute-position block on the eye-toggle button) — verified this is a no-op visually, since `forms.css`'s `.password-input`/`.btn-eye-toggle` rules already declare the same geometry (confirmed via rendered HTML: zero `style=` attributes remain except Svelte's own internal `style="display: contents"` wrapper).
- **Deviation from a literal OpenPencil image**: no mockup image file exists in the repository or the SDD artifacts (only spec.md prose describing the 2-col grid, restyled inputs, gradient bar, and privacy card — confirmed via search). The grid pairing above is my best-effort interpretation of the spec's field-pairing constraint, not a pixel-for-pixel trace of an image I could inspect. Flagging this so a human reviewer can compare against the actual mockup if one exists outside this repo.
- The "gradient bar" and "icon+title header" and "restyled input" requirements turned out to be **already satisfied by pre-existing shared CSS** (`.auth-card::before`, and `.auth-input`'s existing `#f8f9fa`/`2px #e9ecef`/`10px` radius/focus-ring rules) — both were already applied to the register page (and to login, since they share `.auth-card`/`.auth-input`) before this PR. No CSS change was needed for those three requirements; confirmed by inspecting `auth.css` before editing and by curling the rendered register page.

## Phase 4: Presentation CSS

### 4.1 `auth.css`

Added, scoped to new classes only used by the register page (`.auth-card--wide`, `.register-form .auth-btn-primary`, `.field-error`, `.privacy-notice`) so nothing shared with login (`.auth-card`, `.auth-form`, `.auth-btn-primary` alone) changes:

- `.auth-card--wide { max-width: 700px; }` — wider container for the two-column layout (design.md's "wider `max-width`" note). Applied via a new class on the register page's `.auth-card` div; login's `.auth-card` has no such class and keeps its existing `max-width: 500px`.
- `.register-form .auth-btn-primary` — icon+label flex layout and a resting `box-shadow` (previously the shadow only existed on `:hover`). Scoped under `.register-form` (a new class added only to the register `<form>`) so login's submit button, which shares the bare `.auth-btn-primary` class inside `.auth-form` (no `.register-form` ancestor), is unaffected.
- `.field-error` — inline error text styling (red, small, tight margin).
- `.privacy-notice` / `.privacy-notice i` / `.privacy-notice small` — light-blue card using `var(--color-acento)` (`#b3ddf2`) background, replacing `alert-info`.

### 4.2 `forms.css`

- Narrowed `.password-input` to geometry only: `padding-right: 45px; height: 48px;` (dropped the `!important` `border`/`border-radius`/`transition`, and the entire separate `:focus` rule — `.auth-input`/`.auth-input:focus` now own that, since the password input carries both classes).
- Collapsed the four-selector "ELIMINAR validación visual completamente" suppression block down to exactly the two-selector snippet from design.md:
  ```css
  .password-input:valid,
  .password-input:invalid {
    background-image: none !important;
  }
  ```
  (Dropped `.is-valid`/`.is-invalid` from the selector list and all of `border-color`/`box-shadow: none`/`background-color: transparent`/the redundant `padding-right` — those were exactly what suppressed `.auth-input.is-invalid`'s red border/background. The remaining rule only suppresses Bootstrap's native `:valid`/`:invalid` background-image icon, which is the block's original legitimate purpose per design.md.)
- `.btn-eye-toggle` and `.position-relative` (both pre-existing, shared, out of scope per design.md's Open Questions) were **not** touched.

### 4.3 Manual verification

Ran `npm run dev` (Vite dev server on `:5173`) and checked both routes:

1. **`npm run check`**: 89 errors total, all in `tests/fullstack/{run-fullstack.js,process-runner.spec.js,fixtures/process-runner-fixtures.js}` — identical count and file set to PR1's documented pre-existing baseline. Zero errors in `+page.svelte`, `auth.css`, or `forms.css` (confirmed via `npm run check 2>&1 | rg -i "register|page.svelte"` returning no matches after fixing three svelte-check issues introduced by the new markup — see "Issues found" below).
2. **`curl http://localhost:5173/users/register`**: confirmed via `rg` on the rendered HTML that `auth-card auth-card--wide`, `auth-form register-form`, `privacy-notice`, and `form-control auth-input password-input` classes are all present exactly once each, `aria-invalid="false"` is present on every field on first render (no errors yet), and zero leftover `style="..."` attributes exist beyond Svelte's own internal `style="display: contents"` wrapper.
3. **`curl -X POST` with `confirmPassword` mismatched and `Accept: text/html`** (simulating the no-JS progressive-enhancement path, since a plain POST without that header gets SvelteKit's JSON action-response format instead of a full HTML re-render): confirmed the returned HTML contains `<div class="alert alert-danger mb-3" role="alert" tabindex="-1">Las contraseñas no coinciden</div>` — the general-error banner renders with the required `role="alert"` and a focusable `tabindex="-1"` in server-rendered HTML, independent of client JS.
4. **`curl http://localhost:5173/login`** before and after all edits: byte-identical HTML (`diff` returned no output) across two requests bracketing the register-page test above, and separately confirmed login's password field markup is `class="form-control auth-input"` with **no** `password-input` class at all and login's `.auth-card` has no `auth-card--wide` — i.e. login cannot be affected by `.password-input`/`.auth-card--wide`/`.register-form` changes by construction, not just by coincidence of current values. This independently corroborates design.md's "Verified Corrections to Prior Assumptions" table entry ("`.password-input` is shared with login: **False**").

**What was NOT verified** (explicitly deferred, per the task instructions and design.md's "no component-test infra" note): pixel-level visual rendering (gradient/colors/spacing as actually painted by a browser), real pointer/keyboard blur-triggered inline errors, and real focus-movement behavior after a client-side `cancel()` or a successful `use:enhance` submission — none of these can be checked via `curl`/`npm run check` alone. A human should open both pages in an actual browser to confirm: (a) the register page visually matches the two-column layout and privacy-card intent, (b) blurring an empty/invalid field shows its inline error and moves `aria-invalid` to `"true"`, (c) submitting with all fields invalid focuses the first invalid field, and (d) the login page's password field (border/background/focus ring for `#loginForm`) looks unchanged side-by-side with a pre-PR screenshot. Full behavioral coverage (blur/focus/aria assertions against a live DOM) is explicitly PR 3's job (Phase 5, Playwright E2E), not this PR's, per tasks.md's Suggested Work Units table.

### Issues found (fixed during implementation)

`npm run check` initially flagged four problems in the new `+page.svelte`, all fixed without changing behavior:

1. `type={showPassword ? 'text' : 'password'}` combined with `bind:value={values.password}` — Svelte disallows a dynamic `type` attribute together with two-way binding. Fixed by switching the password input to `value={values.password}` (one-way) plus a manual `on:input` handler that reads `event.target.value`, casts it via a JSDoc inline type assertion, and calls the same `handleInput('password')` tracking logic.
2. `errorBannerEl` had no declared type, so `.focus()` on it (an implicit `any`) failed `checkJs`. Fixed with `/** @type {HTMLElement | null} */ let errorBannerEl = null;`.
3. The `values` object literal, initialised straight from `form?.oldData?.*`, inferred a structural type mixing `FormDataEntryValue` (`string | File`) per key, which didn't match `RegisterValues` (`Record<string, string>`) wherever `values` was later passed to `validateRegisterField`/`validateRegisterForm`. Fixed by wrapping every `form?.oldData?.x` initialiser in `String(x || '')` (same coercion idiom already used in `+page.server.js`) and adding an explicit `/** @type {import('$lib/validation/registerForm.js').RegisterValues} */` annotation on `values`.
4. The `use:enhance` result callback `async ({ update }) => {...}` (an inline arrow with a destructured parameter) triggered "Binding element 'update' implicitly has an 'any' type." Fixed by extracting it to a named `handleSubmitResult({ update })` function carrying a `/** @param {{ update: () => Promise<void> }} result */` JSDoc annotation, then returning the function reference itself from `handleSubmit` instead of an inline arrow.

## Changed files (`git diff --numstat`)

| File | Additions | Deletions | Changed lines |
|---|---|---|---|
| `frontend/src/routes/users/register/+page.svelte` | 272 | 73 | 345 |
| `frontend/static/css/components/forms.css` | 8 | 21 | 29 |
| `frontend/static/css/views/auth.css` | 50 | 0 | 50 |
| **Total** | | | **424** |

This is **24 lines over** the 400-line review budget and also over this unit's own ~340-line forecast (tasks.md's Suggested Work Units table). The overrun is concentrated entirely in `+page.svelte`: wiring `bind:value`/`on:blur`/`on:input`/`aria-invalid`/`aria-describedby`/a conditional `<p class="field-error">` onto 10 form fields is inherently repetitive markup (roughly 10-12 lines added per field × 10 fields), and there is no existing reusable `Field` component in this codebase to extract it into without introducing a new abstraction the design explicitly didn't call for. Per the task instructions, correctness and following the approved spec/design took priority over hitting the exact line target; flagging the overrun here rather than silently under-reporting it.

## Constraints honored

- `frontend/src/lib/validation/registerForm.js`, `registerForm.test.js`, `+page.server.js`, `register.server.test.js` untouched (PR1 scope, already merged).
- No Playwright/E2E test file created (PR3 scope).
- No `@testing-library/svelte` or other Svelte component-test tooling added.
- No backend file modified.
- Branch `feat/register-page-template-css` used as-is (not recreated), checked out from up-to-date `main` with PR1 (#45) already merged.
