# Proposal: Frontend XSS + Token Hardening (safe DOM rendering + JWT out of localStorage via httpOnly cookie)

## Intent

The security audit (engram `security/audit-2026-06-21`) confirmed two frontend-side gaps that the
sibling backend change (`backend-authz-hardening`, archived, commits `0ab3d05`/`103008b`) explicitly
deferred. This change closes audit **items 4 and 5**, with scope confirmed by the user:

- **Stored/DOM XSS (item 4):** list-rendering modules build table rows with `innerHTML` template
  literals that interpolate user-controlled fields (patient/dentist names, emails, appointment
  descriptions) **without escaping**. A patient/dentist record whose name or email contains markup is
  reflected into the DOM as live HTML for every operator who views the list.
- **JWT exposed to JS (item 5):** the JWT is double-stored — in the httpOnly cookie (set at login)
  **and** in `localStorage` under `authToken`, where any XSS payload can read it. The two issues
  compound: item 4 is the injection vector, item 5 is the high-value target it steals.

A **new finding** (engram `security/frontend-xss-jwt-storage-pending`, discovery #1013) widens the
scope into backend code: `JwtAuthenticationFilter.java` reads the JWT **only** from the
`Authorization` header and never from a cookie, so the httpOnly cookie is decorative today.
Removing `authToken` from `localStorage` (item 5) would break every authenticated request unless the
backend filter is taught to read the JWT from the cookie as a fallback. That is why this change
touches Spring Security, not just frontend JS.

**Success** = user-controlled text can no longer execute as HTML in any list view; the JWT is no
longer readable by page JavaScript; authenticated requests keep working end-to-end via the httpOnly
cookie; the existing flows (login, patient/dentist/appointment lists, dashboard) are unchanged for
the user.

## Scope

### In Scope

1. **XSS — safe DOM rendering in the 3 list modules (item 4).**
   Replace unescaped `innerHTML` template-literal row building with safe DOM construction
   (`document.createElement` + `textContent` / property assignment), per decision #2 — **not** a
   manual `escapeHtml()` string helper.
   - `frontend/public/js/patient/modules/ui-manager.js:139` — `createPatientTableRow`: `row.innerHTML`
     interpolates `${formattedPatient.fullName}` (`:144`) and `${patient.email}` (`:148`) **unescaped**.
     Confirmed primary sink.
   - `frontend/public/js/appointment/modules/ui-manager.js:342` — `tbody.innerHTML = htmlContent`
     where `htmlContent` (`:312-336`) interpolates `${patientName}`, `${patientEmail}`, `${description}`
     unescaped; `patientName` is **also** injected into an inline `onclick` (`:328-330`) with only
     quote-escaping. Confirmed sink (two vectors).
   - `frontend/public/js/dentist/modules/ui-manager.js:112` — `row.innerHTML` already wraps fields in
     `this.escapeHtml(...)` (`:114-116`), so it is mitigated today. Converting it to the same safe-DOM
     pattern is a **behavior-equivalent consistency fix**, lower urgency than the two above.
   - `displayStats` blocks (e.g. `patient/.../ui-manager.js:377`) render numeric/derived stats, not raw
     user text; `sdd-design` confirms whether they need conversion or are out of scope.

2. **`postLogin.js` script-injection sink (item 4).**
   `frontend/src/controllers/auth/postLogin.js:94-115` (the non-modular branch) returns a hand-built
   HTML page with an inline `<script>` that interpolates `token`/`role`/`email`/`id`/`firstName`/
   `lastName` unescaped (`:103-108`). The modular branch (`:81-91`) already returns JSON. Fix:
   collapse to a JSON response and let client JS do the `localStorage` sync + redirect — no
   server-built executable string.

3. **JWT out of localStorage (item 5).**
   Remove **only** the `authToken` key from `localStorage` writers/readers; keep `userRole`,
   `userFirstName`, `userLastName`, `userEmail`, `userId` (non-sensitive, used for client-side UI per
   decision #4).
   - Writers to remove: `auth-api.js:31`, `auth-api.js:70`, `auth/modules/data-manager.js:46,394`,
     and the `postLogin.js` inline-script writer (item 2).
   - Readers to remove/repoint: `config.js:87` (`getAuthHeaders`), `auth-api.js:121,129,139,146`,
     `auth/modules/data-manager.js:131,315,345`, `appointment/modules/appointment-enricher.js:38`,
     `appointment/modules/data-manager.js:38,73`.

4. **Backend cookie auth (new finding).**
   `backend/.../configuration/JwtAuthenticationFilter.java:33-45` must also read the JWT from the
   httpOnly `authToken` cookie when no `Authorization: Bearer` header is present, so requests
   authenticate after the JS token is removed.
   - Frontend transport: all API clients (`patient-api.js`, `dentist-api.js`, `appointment-api.js`,
     `dashboard-api.js`, `specialty-api.js`) **already** send `credentials: "include"` — verified.
     The work is confirming/keeping that and dropping the now-empty `Authorization` header path.

### Out of Scope

- **Secret rotation, cookie re-issuance, refresh-token rework** — not introduced here.
- **Re-litigating decisions #1–#5** (engram `sdd/frontend-xss-token-hardening/scope-decisions`) — they
  are confirmed inputs, not open options.
- **`DOMPurify` / rich-HTML sanitization** — only text values are rendered; `textContent` suffices
  (decision #2). No sanitizer dependency added.
- **Backend authz items 1,2,3,6,7** — already closed by `backend-authz-hardening`.
- **Existing cookie attributes** (`postLogin.js:57-63`: httpOnly, sameSite `lax`, `secure` in prod,
  maxAge 24h, path `/`) — documented as current state, not redesigned here.

## Capabilities

> Contract between proposal and specs phases.

### New Capabilities

- **Cookie-based request authentication.** The backend gains the ability to authenticate a request
  from the httpOnly `authToken` cookie (header remains a valid source). Becomes
  `openspec/specs/cookie-authentication/spec.md`.

### Modified Capabilities

- **Safe list rendering (XSS-resistant UI).** User-controlled record fields are rendered as inert
  text via DOM construction, never as interpolated HTML.
- **Client token handling.** The JWT is no longer persisted in or readable from `localStorage`;
  client UI state keeps only non-sensitive identity fields.

## Approach

Fix direction at proposal granularity; exact mechanics are `sdd-design`'s job.

- **Item 4 (XSS):** convert each confirmed sink to `createElement` + `textContent`/property
  assignment. Buttons keep static markup; dynamic values go through `textContent`. The appointment
  `onclick`-with-name vector is removed by binding the handler in JS instead of string-interpolating.
- **Item 4 (postLogin):** return JSON; a small client script reads it, writes the non-sensitive
  `localStorage` keys, and redirects. No server-built `<script>`.
- **Item 5 + backend:** extend `JwtAuthenticationFilter` to fall back to the `authToken` cookie;
  delete the `authToken` `localStorage` writers/readers; `getAuthHeaders` stops attaching the bearer
  token (requests rely on the cookie via `credentials: "include"`).

### Open design questions (for `sdd-design`, NOT resolved here)

- **Header vs cookie cutover:** keep `Authorization`-header auth alongside cookie auth (for non-browser
  API consumers / tests), or fully cut over to cookie-only? (Recommend keeping header as a fallback
  source; design confirms.)
- **Cookie attributes:** document current values (`postLogin.js:57-63`) and decide whether the
  cookie-read backend path needs any attribute change (e.g. `sameSite` for cross-site calls). Do not
  redesign unprompted.
- **Dentist/appointment sink parity:** confirm file-by-file whether dentist `ui-manager.js` (already
  `escapeHtml`-wrapped) and the appointment `displayStats`/`onclick` paths each need conversion or are
  acceptable as-is.

## Affected Areas

| Area | Impact | Notes |
|------|--------|-------|
| `frontend/public/js/patient/modules/ui-manager.js` | Modified | Item 4 — primary sink (`:139,144,148`) → safe DOM |
| `frontend/public/js/appointment/modules/ui-manager.js` | Modified | Item 4 — sink (`:312-342`) + `onclick` name vector (`:328-330`) |
| `frontend/public/js/dentist/modules/ui-manager.js` | Modified | Item 4 — consistency conversion (already `escapeHtml`-mitigated) |
| `frontend/src/controllers/auth/postLogin.js` | Modified | Item 4 — drop inline `<script>` (`:94-115`), return JSON |
| `frontend/public/js/api/config.js` | Modified | Item 5 — `getAuthHeaders` (`:87`) stops reading `authToken` |
| `frontend/public/js/api/auth-api.js` | Modified | Item 5 — remove `authToken` writers/readers (`:31,70,121,129,139,146`) |
| `frontend/public/js/auth/modules/data-manager.js` | Modified | Item 5 — `authToken` writers/readers (`:46,131,315,345,394`) |
| `frontend/public/js/appointment/modules/{appointment-enricher,data-manager}.js` | Modified | Item 5 — direct `authToken` reads (`:38` / `:38,73`) |
| `backend/.../configuration/JwtAuthenticationFilter.java` | Modified | New finding — read JWT from cookie when no `Authorization` header (`:33-45`) |
| Frontend `*-api.js` clients | Verified | `credentials: "include"` already present in all five |
| Test suites (frontend + backend filter) | New / Modified | XSS-rendering tests + cookie-auth filter tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **Auth breaks after token removal** — cookie read not wired before `localStorage` removal lands | High if mis-sequenced | Land/verify the backend cookie-read filter FIRST; only then remove the JS token; e2e a real login + an authenticated GET |
| **Missed `authToken` reader** leaves a broken or insecure path | Medium | `sdd-apply` re-greps `authToken` repo-wide before finishing (audit shows readers in auth, appointment, config modules) |
| **Behavior change in row rendering** — DOM rewrite alters layout/handlers | Medium | Convert structure-preserving; keep classes/handlers; snapshot/DOM tests on each list |
| **Cookie not sent cross-origin** — `sameSite`/`secure`/origin mismatch drops the cookie | Medium | `sdd-design` documents current attributes; verify against the actual frontend↔backend origin setup |
| **Strict TDD** — tests may assert the insecure rendering/token behavior | Medium | Rewrite such tests to the secure contract, do not relax; Strict TDD is active |
| **Header-vs-cookie cutover ambiguity** | Medium | Flagged as a design question; default to keeping header as fallback to avoid breaking non-browser callers |

## Rollback Plan

- Frontend XSS conversions are per-file and independently revertible; reverting restores the prior
  `innerHTML` rendering with no data/state coupling.
- The backend filter change is additive (adds a cookie source); reverting it restores header-only auth.
- **Sequencing rollback:** if `localStorage` token removal causes auth failures, revert the item-5
  frontend commit alone — the cookie-read filter and XSS fixes can stay. Keep item 5 and the filter
  change in the same deliverable slice so they revert together.
- Full backout: `git revert` of the PR (or per-slice revert if chained) restores prior behavior; new
  tests revert with their fixes.

## Dependencies

- None external. Relies on the httpOnly `authToken` cookie already issued by `postLogin.js`.
- Logically pairs with `backend-authz-hardening` (already archived) — no code dependency.

## Success Criteria

- [ ] A patient/dentist whose name or email contains HTML/JS renders as inert text in every list view
      (no script execution) — patient, appointment, and dentist tables.
- [ ] `postLogin.js` returns no server-built inline `<script>`; the login redirect works via JSON +
      client script.
- [ ] `localStorage.getItem("authToken")` is `null` after login; no code writes or reads `authToken`
      from `localStorage` (repo-wide grep clean); `userRole`/`userEmail`/`userId`/`userFirstName`/
      `userLastName` remain.
- [ ] An authenticated GET (e.g. patient list) succeeds with no `Authorization` header, authenticated
      solely by the httpOnly cookie.
- [ ] `JwtAuthenticationFilter` authenticates from the cookie when the header is absent; header auth
      still works per the design-confirmed cutover decision.
- [ ] Login, list views, and dashboard work end-to-end for a seed user.
- [ ] New XSS-rendering tests + cookie-auth filter tests pass; the existing suites are green
      (insecure-behavior tests rewritten, not relaxed).
