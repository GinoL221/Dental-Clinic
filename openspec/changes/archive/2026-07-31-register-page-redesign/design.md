# Design: Register Page Redesign

## Technical Approach

Three separable layers, no backend dependency:

1. **Rules** — extract validation into a pure module `frontend/src/lib/validation/registerForm.js`. No Svelte, no DOM. This is the reusable artifact for the future login port and the only thing unit-tested.
2. **Wiring** — `+page.svelte` holds `values` / `fieldErrors` / `touched` in legacy Svelte reactive state and calls the rules module on blur, on input (only after a field has already failed), and on submit via `use:enhance`'s `cancel()`.
3. **Presentation** — mockup styling lands in `auth.css`; `forms.css` is narrowed so it stops overriding it.

Server keeps returning a **single general error**. Per-field errors are client-only.

## Verified Corrections to Prior Assumptions

| Assumption | Reality |
|---|---|
| `.password-input` is shared with login | **False.** Login's password field uses `.auth-input`. `.password-input` appears only in register's `+page.svelte` and `forms.css`. The "scope narrowly to protect login" constraint is already satisfied by the selector name itself. |
| Svelte 4 | **Svelte 5.56.6** in legacy (non-runes) mode. Zero `$state`/`$props` in `src/`. `config.yaml` stack entry is stale. |
| Component tests available | **No infra.** `vite.config.js` `test.include` is `src/**/*.{test,spec}.{js,ts}` — `.svelte` excluded; no `@testing-library/svelte`; `src/test/setup.js` is empty. |

## Architecture Decisions

### Decision: Pure rules module, not inline validation nor a form library

**Choice**: `src/lib/validation/registerForm.js` exporting `validateRegisterField(name, value, values)` and `validateRegisterForm(values)`.
**Alternatives**: inline functions in `+page.svelte`; add `felte`/`sveltekit-superforms`.
**Rationale**: colocated-test convention already exists (`src/lib/api.test.js`). A pure module is unit-testable with the *existing* Vitest setup (zero new deps) and is directly importable by login later. A form library adds a runtime dependency and a whole new idiom for one page.

### Decision: Legacy Svelte syntax (`let` + `$:`), no runes

**Choice**: plain `let` + reassignment for reactivity.
**Rationale**: a Svelte 5 component cannot mix modes — a single `$state` would flip the file to runes mode and break `export let form`, forcing an unrelated rewrite. Every other component in `src/` is legacy.

### Decision: Field errors stay in component state; `form.errors` stays general-only

**Choice**: `form.errors = { general: { msg } }` unchanged.
**Alternatives**: add `form.errors.<field>`.
**Rationale**: the backend returns one flat message. A per-field server shape nothing can populate is exactly the dead-code failure this change is fixing (the 409 branch).

### Decision: `forms.css` surrenders visual control, keeps geometry

**Choice**: `.password-input` keeps only `padding-right: 45px` and `height: 48px` (eye-toggle geometry). Drop its `!important` `border` / `border-radius` / `transition` and its `:focus` border/shadow. Collapse the suppression block to:

```css
.password-input:valid,
.password-input:invalid {
  background-image: none !important;
}
```

The password input's class becomes `form-control auth-input password-input`, so `.auth-input` and the already-defined `.auth-input.is-invalid` own the look.
**Alternatives**: a higher-specificity `!important` override in `auth.css`; delete the block outright.
**Rationale**: `!important` beats specificity, so an override would need counter-`!important` across two files — cascade warfare. Deleting outright re-exposes Bootstrap's validation icon on an empty `required` field at first paint (the block's legitimate purpose). Narrowing keeps that intent and gives one file each a single responsibility.

### Decision: server surfaces `err.message` with a synthetic-message filter

**Choice**:
```js
const raw = typeof err?.message === 'string' ? err.message.trim() : '';
const errorMessage = raw && !raw.startsWith('HTTP error!') ? raw : 'Error al registrar usuario';
```
**Rationale**: `apiFetch` fabricates `HTTP error! status: NNN` when the backend body has no `message`. Passing `err.message` through unconditionally would leak that to patients. Remove the 409 and 400 branches.

### Decision: server also guards `confirmPassword`

**Choice**: mismatch → return the general-error shape before calling `apiFetch`.
**Rationale**: the client gate disappears without JS. Covers progressive enhancement and is cheap.

## Data Flow

    blur ──┐
    input ─┼──→ validateRegisterField ──→ fieldErrors[name] ──→ aria-invalid + #<name>-error
    (only after first failure)                                        │
                                                                      ▼
    submit ──→ validateRegisterForm ──→ empty? ──no──→ cancel() + focus first invalid
                                          │yes
                                          ▼
                              +page.server.js ──→ apiFetch ──→ 303 /login?registered=true
                                          │ throws
                                          ▼
                          { errors: { general: { msg } }, oldData } ──→ role="alert" banner, focused

Focus of the banner happens in the `enhance` result callback after `await tick()`, not in a `$:` block, to avoid refocus loops.

`values` is initialised from `form?.oldData` (covers the no-JS full-page-reload path) and thereafter owned by `bind:value`; passwords are never repopulated.

## File Changes

| File | Action | Description |
|---|---|---|
| `frontend/src/lib/validation/registerForm.js` | Create | Pure rules: required, email format, password `minlength 6`, DNI numeric-only, `confirmPassword === password` |
| `frontend/src/lib/validation/registerForm.test.js` | Create | Vitest unit tests for every rule and boundary |
| `frontend/src/routes/users/register/+page.svelte` | Modify | Mockup markup, 2-col grid across all 3 sections, validation state, `aria-invalid` / `aria-describedby` / `role="alert"`, drop inline `style` |
| `frontend/src/routes/users/register/+page.server.js` | Modify | `err.message` + synthetic filter, drop 409/400 branches, add `confirmPassword` guard |
| `frontend/src/routes/users/register/register.server.test.js` | Modify | Delete the 409 test; add message-passthrough, synthetic-fallback, and mismatch tests |
| `frontend/static/css/views/auth.css` | Modify | Gradient bar (exists via `.auth-card::before`), header, section grid, button, light-blue privacy card, wider `max-width` |
| `frontend/static/css/components/forms.css` | Modify | Narrow `.password-input` to geometry; collapse suppression block |

## Interfaces / Contracts

```js
/** @typedef {Record<string, string>} RegisterValues */
/** @typedef {Record<string, string>} FieldErrors */

/** @returns {string} '' when valid, else the user-facing message */
export function validateRegisterField(name, value, values) {}

/** @returns {FieldErrors} only invalid fields; empty object === form is valid */
export function validateRegisterForm(values) {}
```

Server action result (unchanged shape):

```js
{ success: false, errors: { general: { msg: string } }, oldData: {...} }
```

## Testing Strategy

Strict TDD is on (`openspec/config.yaml: strict_tdd: true`) — every row is RED first.

| Layer | What | Approach |
|---|---|---|
| Unit | Each validation rule, incl. empty/whitespace, malformed email, 5-vs-6-char password, non-numeric DNI, mismatch | New `registerForm.test.js`, plain Vitest |
| Unit | Server action: backend message passthrough, `HTTP error!` → generic fallback, mismatch short-circuits before `apiFetch`, `oldData` shape | Modify `register.server.test.js` (mocks `apiFetch` already) |
| Component | — | **Not covered.** No `.svelte` test infra; adding it means new devDeps + config change, disproportionate here and it would inflate the PR |
| E2E | Blur shows inline error; mismatch blocks submit; duplicate email shows backend message | Optional additions to `frontend/tests/auth.spec.js` (mock-backend Playwright project) — recommend as a separate slice if the 400-line budget is tight |
| Static | `npm run check` clean (JSDoc + `checkJs`) | Existing script |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. This change touches one route's markup, one server action's error branch, and two static CSS files.

## Migration / Rollout

No migration. Revert the commit to restore prior rendering.

## Open Questions

- [ ] None blocking. Two follow-ups outside this change: `openspec/config.yaml` says "Svelte 4" (stale, actually 5.56.6); `forms.css` overrides the global Bootstrap `.position-relative` utility with `display: block !important; min-height: 50px !important`, which affects the whole app — pre-existing, not touched here.
