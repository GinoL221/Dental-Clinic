# Safe List Rendering (XSS-Resistant UI) Specification

## Purpose

Defines the rendering contract for user-controlled record fields (patient/dentist names, emails,
appointment descriptions) across the patient, dentist, and appointment list views, plus the
post-login redirect script. User-controlled text MUST render as inert text and MUST NOT be capable of
executing as HTML/JS in any viewer's browser, regardless of what characters the underlying record
contains. Requirements describe observable rendering outcomes only; `sdd-design` and `sdd-apply`
select the exact DOM-construction mechanics (`createElement`/`textContent`/property assignment) per
file. No HTML sanitizer library is introduced — plain text values do not require one.

## Requirements

### Requirement: User-Controlled Fields Never Execute as HTML in List Views

The system MUST render patient, dentist, and appointment list rows such that user-controlled string
fields (full name, email, appointment description, and any other free-text record field shown in
these tables) are displayed as literal text. Markup or script content stored in those fields MUST NOT
be parsed or executed by the viewing browser.

**Enforcement mechanism:** DOM construction that assigns user-controlled values via a text-only
channel (e.g. `textContent`, or an equivalent non-HTML-parsing property), never via
`innerHTML`/`outerHTML` string interpolation of those values. The exact per-file mechanics are an
`sdd-design`/`sdd-apply` decision.

#### Scenario: Patient name containing a script tag renders as visible text, not a script execution

- GIVEN a patient record whose `fullName` field contains `<script>alert(1)</script>`
- WHEN an operator views the patient list
- THEN the literal text `<script>alert(1)</script>` is visible in the row
- AND no script executes as a result of rendering that row

#### Scenario: Patient email containing an HTML event handler does not fire

- GIVEN a patient record whose `email` field contains an HTML fragment with an inline event handler
  (e.g. `"><img src=x onerror=alert(1)>`)
- WHEN an operator views the patient list
- THEN the field renders as inert text and the embedded handler never executes

#### Scenario: Appointment description containing markup renders as inert text

- GIVEN an appointment record whose `description` field contains HTML markup
- WHEN an operator views the appointment list
- THEN the description displays as literal text in the row, with no markup parsed by the browser

#### Scenario: Dentist name containing markup renders as inert text (consistency with patient/appointment)

- GIVEN a dentist record whose name field contains HTML markup
- WHEN an operator views the dentist list
- THEN the name displays as literal text, matching the same safe-rendering guarantee as the patient
  and appointment lists

#### Scenario: Normal, markup-free values render unchanged

- GIVEN a patient, dentist, or appointment record whose user-controlled fields contain ordinary text
  with no markup
- WHEN the corresponding list is viewed
- THEN the displayed text, layout, and any interactive controls (edit/delete buttons, row actions)
  remain visually and functionally equivalent to current behavior

### Requirement: Interactive Row Handlers Are Not Built by String-Interpolating User Data

Row-level interactive behavior (e.g. a button's click handler that needs to know which record it
belongs to) MUST NOT be constructed by interpolating user-controlled field values into an
HTML-attribute string (such as an inline `onclick="...name..."` attribute). The handler MUST obtain
the record's data through a non-string-interpolated channel (e.g. closures, dataset attributes holding
only the record's id, or addEventListener bindings).

**Enforcement mechanism:** binding the handler in JavaScript (e.g. `addEventListener` with a closure
over the record object, or reading an id-only `dataset` attribute) rather than building an
attribute string that embeds the user-controlled value.

#### Scenario: Appointment row action still identifies the correct record after conversion

- GIVEN an appointment list row rendered for a specific appointment, where the patient name contains
  no markup
- WHEN an operator clicks the row's action control (e.g. "view" or "cancel")
- THEN the action operates on the correct appointment record, with behavior unchanged from before
  this change

#### Scenario: A patient name containing quotes or markup cannot break out of an attribute to inject a handler

- GIVEN an appointment's associated patient name contains characters that would break out of an HTML
  attribute string (e.g. `"` or `</script>` sequences)
- WHEN the appointment list renders that row
- THEN no additional or altered event handler is created as a result of those characters
- AND the row's intended action control continues to reference the correct record

### Requirement: Login Redirect Does Not Execute a Server-Built Inline Script

The post-login response MUST NOT return a server-constructed HTML page containing an inline
`<script>` block that interpolates request-derived or user-derived values (token, role, email, id,
first name, last name) directly into script source text. The server MUST return data (e.g. JSON) and
let static client-side script perform any `localStorage` sync and redirect.

**Enforcement mechanism:** the previously-existing non-modular HTML-with-inline-`<script>` response
branch is removed; only the JSON response path remains. No server-side string concatenation builds
executable script content from request/session data.

#### Scenario: Successful login returns no inline script tag with interpolated values

- GIVEN a user submits valid login credentials
- WHEN the login request completes successfully
- THEN the HTTP response contains no server-built `<script>` block interpolating the user's
  identity fields into script source
- AND the client is redirected to the appropriate page after processing the response

#### Scenario: A user identity field containing script-breaking characters cannot inject script via the login response

- GIVEN a user's first name, last name, or email contains characters that would break out of a
  `<script>` string literal (e.g. `</script>` or unescaped quotes)
- WHEN that user logs in successfully
- THEN no additional script executes as a result of those characters appearing in the login response
