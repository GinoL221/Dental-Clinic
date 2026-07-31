# Proposal: Register Page Redesign

## Intent

`/users/register` is the only self-service entry point for new patients, and today it fails them in three confirmed ways: (1) `confirmPassword` is decorative — the server action never reads or compares it, so a mismatched password registers silently with the first value; (2) duplicate email returns HTTP 400, not 409, so the frontend's dead `409` branch never fires and the useful backend message "El email ya está registrado" (already present in `err.message`) is discarded in favour of the generic "Datos de registro inválidos"; (3) there is no per-field error surface at all — every failure collapses into one top-of-form Bootstrap alert with no ARIA live semantics. The layout is also inconsistent (mixed 1-col/2-col rows) versus the maintainer-approved mockup.

## Scope

### In Scope

- Visual redesign of `+page.svelte` per the approved OpenPencil mockup: accent gradient top bar (primary→secondary), icon+title header, the existing three sections (Datos Personales / Dirección / Seguridad) in a consistent 2-column grid, redesigned inputs (`#f8f9fa` bg, 2px `#e9ecef` border, 10px radius, visible focus ring), primary submit with icon + shadow, privacy notice as a distinct light-blue card replacing `alert-info`.
- Client-side inline per-field validation with visible error text, `aria-invalid`, and `aria-describedby`; `role="alert"` on the general banner.
- Fix confirm-password: compare `confirmPassword` to `password` and block submit on mismatch.
- Surface `err.message` from `apiFetch` instead of hardcoded per-status strings; drop the dead `409` branch.
- Override/remove the `.password-input` "ELIMINAR validación visual completamente" `!important` block in `forms.css` so `.is-invalid` renders on the password field.
- Update `register.server.test.js` (existing 409 test assertions become invalid) and add coverage for the new error/`oldData` shape.

### Out of Scope

- Any backend change (status codes, field-keyed error DTO, server-side DNI/email/password rules).
- Server-driven per-field errors — explicitly a separate future change.
- Login page, mobile-responsiveness change, dashboard change — the other two maintainer-approved changes from README "Pendientes".

## Capabilities

### New Capabilities

- `register-form-validation`: client-side per-field validation rules, error/`oldData` contract from the register server action, and accessible error announcement.
- `register-form-presentation`: register page visual structure — gradient bar, header, 2-column section grid, input/button/notice styling.

### Modified Capabilities

- None. `css-architecture` file-organisation requirements are unchanged; the `forms.css` edit is implementation-level.

## Approach

Exploration "Approach 2": visual redesign + client-side inline validation, no backend dependency. Validation runs in the browser (reactive Svelte state per field, validated on blur and on submit), reusing the already-defined-but-unused `.auth-input.is-invalid` hook in `auth.css`. The server action keeps returning a single general error, now sourced from `err.message` with a status-agnostic fallback, rendered in the banner. This is the first per-field validation pattern in the codebase; it is intentionally scoped to register so it can be back-ported to login later once proven.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/routes/users/register/+page.svelte` | Modified | Layout, per-field error markup, a11y attributes, client validation state |
| `frontend/src/routes/users/register/+page.server.js` | Modified | Use `err.message`, drop dead 409 branch, confirmPassword guard |
| `frontend/src/routes/users/register/register.server.test.js` | Modified | Update 409/message assertions, add new-behaviour tests |
| `frontend/static/css/views/auth.css` | Modified | Gradient bar, 2-col grid, input/button/notice styles, `.is-invalid` refinement |
| `frontend/static/css/components/forms.css` | Modified | Remove/override `.password-input` validation-suppression block |
| `frontend/src/lib/api.js` | Unchanged | Already exposes backend `message`; only consumption changes |
| Backend | Unchanged | Out of scope by maintainer decision |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `register.server.test.js` 409 assertions break | High (certain) | Update the test in the same change; treat the new error shape as the contract |
| `.password-input` `!important` block silently suppresses new styling | Medium | Explicit task to remove/override it; verify visually on the password field specifically |
| No existing per-field pattern to copy — new convention risk | Medium | Keep the pattern minimal and register-only; document it in the spec so login can adopt it later |
| Backend returns one flat message, not a field map | High (known) | Per-field errors stay client-side; server message stays in the general banner |
| Removing the `forms.css` block affects other password inputs (login) | Low | Scope the override narrowly or verify login renders unchanged |
| Confirm-password fix is server-action logic, not pure CSS | Medium | Accepted: this change is explicitly not a pure visual redesign |

## Rollback Plan

Revert the change commit. All edits are confined to the register route plus two CSS files; restoring the `.password-input` block in `forms.css` restores the prior password-field rendering. No data, schema, or backend contract changes, so rollback is atomic and stateless.

## Dependencies

- None external. Assumes the backend keeps returning a single flat `message` on 400; a future backend change to field-keyed errors would extend, not invalidate, this work.

## Success Criteria

- [ ] Submitting mismatched passwords is blocked with a visible, screen-reader-announced error on the confirm-password field.
- [ ] Registering with an already-used email shows the backend message ("El email ya está registrado"), not "Datos de registro inválidos".
- [ ] Every validated field renders inline error text wired via `aria-invalid` + `aria-describedby`, and the password field visibly shows invalid styling.
- [ ] The page matches the approved mockup: gradient bar, icon+title header, consistent 2-column grid across all three sections, redesigned inputs/button, light-blue privacy card.
- [ ] `npm run test` passes with updated and new register tests; `npm run check` is clean.
- [ ] No backend file is modified.

## Open Questions

- None blocking. The mockup, scope boundary, and no-backend-change constraint were all confirmed by the maintainer before this proposal. Remaining choices (exact validation trigger timing, error copy wording) are spec/design-level, not proposal-level.
