# Register Form Validation Specification

## Purpose

Define client-side per-field validation for `/users/register`, the server
action's error/`oldData` contract on submit failure, and accessible error
announcement. Scoped to the register route only; no backend change.

## Requirements

### Requirement: Field-level required validation

The client MUST validate that `firstName`, `lastName`, `email`,
`cardIdentity`, `street`, `number`, `location`, `province`, `password`, and
`confirmPassword` are non-empty before allowing submission.

#### Scenario: Empty required field blocks submit

- GIVEN the register form with `firstName` left empty
- WHEN the user submits the form
- THEN submission is blocked client-side
- AND an inline error ("Este campo es obligatorio" or field-appropriate
  equivalent) appears next to `firstName`, associated via `aria-describedby`
- AND `firstName` has `aria-invalid="true"`

#### Scenario: All required fields filled allows submit to proceed

- GIVEN every required field has a non-empty value
- AND every field-specific rule (email format, password length, DNI numeric,
  password match) passes
- WHEN the user submits the form
- THEN the client performs no blocking validation error
- AND the form POSTs to the server action

### Requirement: Email format validation

The client MUST validate that `email` matches a standard email format
(local-part@domain) before allowing submission.

#### Scenario: Malformed email blocks submit

- GIVEN `email` contains `"not-an-email"`
- WHEN the user submits the form
- THEN submission is blocked client-side
- AND an inline error indicating an invalid email format appears next to
  `email`, associated via `aria-describedby`

### Requirement: Password minimum length validation

The client MUST validate that `password` is at least 6 characters
(`minlength=6`) before allowing submission.

#### Scenario: Short password blocks submit

- GIVEN `password` contains `"abc12"` (5 characters)
- WHEN the user submits the form
- THEN submission is blocked client-side
- AND an inline error indicating the minimum length appears next to
  `password`, associated via `aria-describedby`

### Requirement: DNI (cardIdentity) numeric-only validation

The client MUST validate that `cardIdentity` contains digits only (no
letters, spaces, or symbols) before allowing submission.

#### Scenario: Non-numeric DNI blocks submit

- GIVEN `cardIdentity` contains `"12A45"`
- WHEN the user submits the form
- THEN submission is blocked client-side
- AND an inline error indicating DNI must be numeric appears next to
  `cardIdentity`, associated via `aria-describedby`

#### Scenario: Numeric DNI passes validation

- GIVEN `cardIdentity` contains `"12345678"`
- WHEN the field is validated (on blur or submit)
- THEN no error is shown for `cardIdentity`
- AND `aria-invalid` on `cardIdentity` is `"false"` or absent

### Requirement: Confirm-password match validation

The client MUST validate that `confirmPassword` exactly matches `password`
before allowing submission. This check does not exist today and is new
required behavior.

#### Scenario: Mismatched confirm-password blocks submit

- GIVEN `password` is `"Secret123"` and `confirmPassword` is `"Secret124"`
- WHEN the user submits the form
- THEN submission is blocked client-side
- AND an inline error "Las contraseñas no coinciden" appears next to
  `confirmPassword`, associated via `aria-describedby`
- AND `confirmPassword` has `aria-invalid="true"`

#### Scenario: Matching confirm-password passes validation

- GIVEN `password` and `confirmPassword` contain the identical value
- WHEN the field is validated (on blur or submit)
- THEN no error is shown for `confirmPassword`

### Requirement: Validation timing — blur, submit, and live re-validation after first failure

The client MUST validate a field when it loses focus (blur) and when the
form is submitted. Once a given field has failed validation at least once
(via blur or submit), the client MUST re-validate that field live on every
subsequent `input` event until it passes.

#### Scenario: Field not yet touched shows no error while typing

- GIVEN a field has never been blurred or submitted
- WHEN the user types an invalid value into it
- THEN no inline error is shown yet

#### Scenario: Field validates on blur

- GIVEN the user has typed an invalid value into `email`
- WHEN focus leaves the `email` field (blur)
- THEN the inline error for `email` appears

#### Scenario: Field re-validates live after first failure

- GIVEN `email` has already failed validation once (via blur or a prior
  submit attempt)
- WHEN the user types each subsequent character into `email`
- THEN the field's validity (and its inline error, if any) updates on every
  keystroke without requiring another blur or submit

#### Scenario: Submit validates all fields at once

- GIVEN the user has not yet interacted with several fields
- WHEN the user clicks submit
- THEN every required/format rule across all fields is evaluated
- AND inline errors appear for every field that fails
- AND submission is blocked if any field fails

### Requirement: Register server action error contract

On a failed `POST /api/auth/register` call, the server action in
`+page.server.js` MUST read the backend's `err.message` and return it as the
general error text. If `err.message` is absent or empty, the action MUST
fall back to a generic Spanish error message. The action MUST NOT branch on
HTTP status `409` — the backend returns `400` for all validation failures on
this endpoint, and any hardcoded 409-specific message is removed.

#### Scenario: Backend rejects with a message (e.g. duplicate email)

- GIVEN the backend responds with an error whose `message` is
  "El email ya está registrado"
- WHEN the register server action catches the failure
- THEN the returned `errors.general.msg` is exactly "El email ya está
  registrado"

#### Scenario: Backend rejects with no message

- GIVEN the backend responds with an error that has no `message` property
- WHEN the register server action catches the failure
- THEN the returned `errors.general.msg` is a generic Spanish fallback
  string (not a 409-specific string, not undefined)

#### Scenario: Successful registration still redirects

- GIVEN the backend accepts the registration
- WHEN the register server action completes
- THEN the action throws a redirect to `/login?registered=true` as before
- AND no `errors` or `oldData` is returned

### Requirement: Confirm-password guard in the server action

The register server action MUST reject submission (without calling the
backend) when `confirmPassword` does not match `password`, returning the
same `errors`/`oldData` shape used for backend failures.

#### Scenario: Server-side confirm-password mismatch (defense in depth)

- GIVEN a POST to the register action where `password` and
  `confirmPassword` differ
- WHEN the action processes the request
- THEN the backend `/api/auth/register` is never called
- AND the action returns `success: false` with a `confirmPassword`-specific
  or general error message and `oldData` populated from the submitted
  non-password fields

### Requirement: Accessible general-error announcement on submit failure

When the server action returns a general error, the page MUST render it in
a banner with `role="alert"` and MUST move programmatic focus to that
banner so the error is announced by screen readers and not missed on a long
two-column form.

#### Scenario: Server rejects submission

- GIVEN the user submits a client-valid form that the server rejects
- WHEN the page re-renders with `form.errors.general.msg` set
- THEN the error banner has `role="alert"`
- AND focus is programmatically moved to the banner (or an element inside
  it) after render

#### Scenario: No general error present

- GIVEN `form` is `undefined` or has no `errors.general.msg`
- WHEN the page renders
- THEN no alert banner is present and no focus movement occurs

### Requirement: Inline error accessibility wiring

Every field with an active client-side or server-side validation error MUST
have `aria-invalid="true"` and `aria-describedby` pointing to the element
containing that field's error text. Error copy MUST be short,
sentence-case Spanish phrases (e.g. "Las contraseñas no coinciden", "El
formato del correo no es válido").

#### Scenario: Field passes validation after previously failing

- GIVEN `password` previously showed an inline error
- WHEN the user corrects the value and it now passes validation
- THEN `aria-invalid` on `password` becomes `"false"` (or is removed)
- AND the inline error text is removed or hidden
