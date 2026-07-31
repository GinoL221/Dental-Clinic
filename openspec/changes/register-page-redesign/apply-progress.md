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
