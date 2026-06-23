# Tasks: Frontend XSS + Token Hardening

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~480-620 (production ~200-260, tests ~280-360) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (backend cookie filter + tests) → checkpoint → PR 2 (XSS renderers, independent) → PR 3 (token removal + postLogin, depends on PR 1 merged) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

Three list-renderer rewrites (patient/appointment/dentist, each replacing template-literal
`innerHTML` with per-cell `createElement`), a `postLogin.js` branch collapse, ~10 call sites of
`authToken` removal across 5 frontend files, one backend filter change, plus new test files for
filter cookie-auth (5+ scenarios), XSS-inert-render (5+ scenarios per list = 15+), login-flow
localStorage assertions, and rewritten existing tests that assert old behavior (e.g.
`appointment-srp-split.test.js:180-264` asserts `authToken` Bearer-fallback — must be rewritten, not
deleted). Test volume alone likely exceeds 250 lines; combined with 3 renderer rewrites this clears
400 lines comfortably. Risk is also auth-hot-path (filter) + XSS-hot-path — High, not Medium, even
before counting lines.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend cookie-fallback filter + filter tests (Phase 1) | PR 1 | Auth hot path; ships with `Authorization` header still sent everywhere — zero frontend behavior change |
| 2 | Cookie-path e2e verification checkpoint (Phase 2) | N/A (verification only, no diff) | Gate before PR 3; confirms PR 1 works before token removal starts |
| 3 | XSS safe-DOM conversion, all 3 list renderers (Phase 3) | PR 2 | Independent of token work; no auth coupling; can land before or after PR 1 |
| 4 | `postLogin.js` JSON collapse + login JS module + `authToken` localStorage removal repo-wide (Phase 4) | PR 3 | Depends on PR 1 merged (per design's auth-break risk); same deliverable slice as PR 1 for rollback per proposal |
| 5 | Final repo-wide verification, no-header e2e, existing-test rewrites (Phase 5) | part of PR 3 | Closes out Phase 4 |

Note on Unit 4/Unit 1 coupling: the proposal's rollback plan requires the filter change and the
`localStorage` removal to revert together. If chained as separate PRs, PR 3 must not merge without
PR 1 already in `main` — PR 3 is not revertible alone (would strand auth), so PR 1+PR 3 form one
rollback unit even though they are sequenced as two PRs.

## Phase 0: Locate Non-Modular Login Client Script (BEFORE Phase 4)

- [ ] 0.1 Confirm `frontend/src/views/users/login.ejs` submits via plain `<form method="POST" action="/users/login">` (no `X-Requested-With: ModularAuth` header) — re-verify this is the path that hits `postLogin.js`'s non-modular branch (`:92-116`), not the modular JSON branch.
- [ ] 0.2 Search `frontend/public/js/` and `frontend/src/views/users/login.ejs`'s `<script>` includes for an existing client module that handles the non-modular form-submit response. Expect none found — the non-modular branch today returns a full HTML page that the browser navigates to directly (no fetch/XHR, no existing JS consumer).
- [ ] 0.3 Decide and document the target: either (a) convert `login.ejs`'s form submission to fetch-based (`X-Requested-With: ModularAuth`) so it always hits the existing modular JSON branch and reuses `auth/modules/data-manager.js`'s `processLogin()` write logic, or (b) create a new small static JS file (e.g. `frontend/public/js/auth/login-redirect.js`) that the non-modular JSON response's page loads, reading `{role,email,id,firstName,lastName}` and redirecting. Record the choice in the PR description before Phase 4 starts.

## Phase 1: Backend Cookie-Fallback Filter (ships first, header still sent everywhere)

- [x] 1.1 RED: write `JwtAuthenticationFilterTest` scenarios — Bearer-only authenticates (regression guard, must already pass), cookie-only (no header) authenticates, neither header nor cookie leaves request unauthenticated, expired/invalid cookie token rejected, both present → header wins, no conflict. Use `MockHttpServletRequest`/mocked `JwtService`/`UserDetailsService` per design's testing strategy.
- [x] 1.2 Confirm cookie-only and both-present scenarios FAIL against current code (no cookie read exists yet) before implementing.
- [x] 1.3 GREEN: edit `backend/src/main/java/com/dh/dentalClinicMVC/configuration/JwtAuthenticationFilter.java` — add private `extractTokenFromCookie(HttpServletRequest)` (null-safe scan of `getCookies()` for `authToken`), change the header-null-check branch to fall back to the cookie per design's exact control flow (header checked first; cookie only if header absent/non-Bearer); rest of the chain (`extractUsername` → `loadUserByUsername` → `isTokenValid` → set context) unchanged.
- [x] 1.4 Run all Phase 1 tests — must pass GREEN, including the Bearer-only regression guard.
- [x] 1.5 Integration test: `MockMvc` authenticated GET (e.g. patient list endpoint) using `.cookie(new Cookie("authToken", jwt))` and no `Authorization` header → 200.
- [x] 1.6 Run full backend suite (`cd backend && ./mvnw test`) — confirm zero regressions; no frontend file touched in this phase, so no `Authorization` header usage changes yet.

### Phase 1 remediation (post-implementation 4-lens review, 3 CRITICAL findings fixed before PR1 merge)
- [x] 1.7 RED→GREEN: `JwtAuthenticationFilter.doFilterInternal` now wraps `extractUsername`/`isTokenValid` in a `try/catch (JwtException | IllegalArgumentException)`, fail-closed to unauthenticated instead of letting the exception 500 the request (filters run before `DispatcherServlet`, so no `@ControllerAdvice` could ever catch it). Covers both the header path and the cookie path (shared code). Tests: `malformedCookieTokenLeavesRequestUnauthenticatedWithoutThrowing`, `malformedHeaderTokenLeavesRequestUnauthenticatedWithoutThrowing` (unit) + `malformedCookieTokenRejectsWithoutServerError`, `malformedHeaderTokenRejectsWithoutServerError` (integration, asserts 4xx not 500).
- [x] 1.8 RED→GREEN: `extractTokenFromCookie` rewritten fail-safe — two or more cookies named `authToken` is ambiguous and ignored entirely (no "take first"); an `authToken` cookie with an empty-string value is treated as absent. Tests: `duplicateAuthTokenCookiesAreTreatedAsAmbiguousAndIgnored`, `emptyAuthTokenCookieIsTreatedAsNoTokenPresent`.
- [x] 1.9 Corrected the stale CSRF rationale comment in `SecurityConfiguration.java` (previously claimed the filter "never reads a cookie", which 1.3's cookie fallback already made false). New comment states the accurate model — cookie auth is mitigated today by `SameSite=lax`, flagged as an interim mitigation that must be re-evaluated before PR3 removes the `Authorization` header fallback. No CSRF-token mechanism implemented — out of scope for this PR.
- [x] 1.10 Strengthened `bothHeaderAndCookiePresentHeaderWinsWithNoConflict` to stub two DISTINCT users (header vs. cookie) and assert the SecurityContext principal is the header user, not just that the cookie extractor was untouched.
- [x] 1.11 Sanity check: grepped all `@GetMapping` endpoints repo-wide for mutating operations (would worsen Lax-cookie CSRF exposure, since Lax allows the cookie on cross-site top-level GET navigation). None found — all mutations (`save`/`update`/`delete`/`updateStatus`/`removeSpecialty`) are wired through `@PostMapping`/`@PutMapping`/`@DeleteMapping`.

## Phase 2: Cookie-Path Verification Checkpoint (no production diff — gate before Phase 4)

- [ ] 2.1 Manual/e2e verification: start backend + frontend, perform a real login (frontend still writes/sends the `Authorization` header at this point — transition state), then issue an authenticated GET with the `Authorization` header deliberately stripped (e.g. via curl reusing only the `Set-Cookie` value) → confirm 200.
- [ ] 2.2 Confirm the header-present path still works unchanged (existing flows: login, list views, dashboard) with both header and cookie live — no regression before token removal begins.
- [ ] 2.3 Record checkpoint result (pass/fail) before starting Phase 4. Do not start Phase 4 if 2.1 or 2.2 fails.

## Phase 3: XSS Safe-DOM Conversion (independent of Phase 1/2/4 — no auth coupling)

- [ ] 3.1 RED: write/extend `frontend/test/` jsdom test for patient renderer — row with `<script>`/`onerror` payload in `fullName`/`email` → no `<script>` element created, `textContent` equals raw payload string. Confirm it fails against current `innerHTML`-based code.
- [ ] 3.2 GREEN: edit `frontend/public/js/patient/modules/ui-manager.js` `createPatientTableRow` (`:139-148`) — build `<tr>`/`<td>` via `document.createElement`; `fullName`/`email` cells via `td.textContent = value`; keep ID/DNI/date cells as-is; actions `<td>` keeps static button markup (no user data) via a single scoped `innerHTML`/`insertAdjacentHTML`.
- [ ] 3.3 Run 3.1 test — GREEN.
- [ ] 3.4 RED: write/extend jsdom test for appointment renderer — row with markup in `patientName`/`patientEmail`/`description` → inert text; delete-button click invokes `confirmDeleteAppointment(id, patientName)` with correct args via closure, not string-built `onclick`; a name containing `"` or `</script>` cannot alter the handler. Confirm failure against current code (`:312-342`, `:328-330`).
- [ ] 3.5 GREEN: edit `frontend/public/js/appointment/modules/ui-manager.js` — DOM-build rows via `createElement` + `textContent`; replace the inline `onclick="...${patientName}..."` with `btn.addEventListener("click", () => window.confirmDeleteAppointment(appointment.id, patientName))`; leave `displayStats` (derived numbers, no user text) untouched.
- [ ] 3.6 Run 3.4 tests — GREEN.
- [ ] 3.7 RED: write/extend jsdom test for dentist renderer — row with markup in name fields → inert text, matching patient/appointment guarantee. Confirm current `escapeHtml`-wrapped code already passes this test (consistency conversion, lower urgency) — note pass/fail baseline before editing.
- [ ] 3.8 GREEN: edit `frontend/public/js/dentist/modules/ui-manager.js` (`:112-116`) — convert to the same `createElement`/`textContent` pattern as patient/appointment; remove the now-unused `this.escapeHtml` helper. Empty-state static-markup row may stay as `innerHTML`.
- [ ] 3.9 Run 3.7 test — GREEN; confirm output is behavior-equivalent (no escaping regression vs. the prior `escapeHtml` output).
- [ ] 3.10 Visual/functional regression check on all three lists: normal markup-free records render unchanged (text, layout, edit/delete handlers all still work).

## Phase 4: postLogin JSON Collapse + Token Removal (depends on Phase 1 merged; same rollback slice as Phase 1)

- [ ] 4.1 RED: write a `postLogin` controller test (or extend existing) asserting the non-modular branch response contains no `<script>` block and no token in body markup; response is JSON shaped like the modular branch. Confirm it fails against current code (`:92-116` still returns HTML+script).
- [ ] 4.2 GREEN: edit `frontend/src/controllers/auth/postLogin.js` — collapse the `else` branch (`:92-116`) into the same JSON shape as the `isModularRequest` branch (`:81-91`); remove the `localStorage.setItem('authToken', ...)` inline-script writer entirely (token never reaches a script string).
- [ ] 4.3 Implement the Phase 0 decision: either wire `login.ejs`'s form submit to the fetch/JSON path reusing `auth/modules/data-manager.js`, or add the new redirect-only JS module that reads the JSON and writes only non-sensitive keys then redirects (`window.location`). No server-built inline `<script>` remains in either path.
- [ ] 4.4 Run 4.1 test — GREEN.
- [ ] 4.5 RED: write/extend a test asserting `localStorage.getItem("authToken")` is `null` after a simulated successful login flow (jsdom), while `userRole`/`userEmail`/`userId`/`userFirstName`/`userLastName` are present and correct.
- [ ] 4.6 GREEN: remove `authToken` `localStorage` writers — `frontend/public/js/api/auth-api.js:31,70`, `frontend/public/js/auth/modules/data-manager.js:46,394`. Keep the five non-sensitive key writers untouched.
- [ ] 4.7 GREEN: remove `authToken` `localStorage` readers/repoint to cookie-only auth — `frontend/public/js/api/config.js:87` (`getAuthHeaders` stops attaching `Authorization`), `frontend/public/js/api/auth-api.js:121,129,139,146` (`isAuthenticated` keeps cookie-presence check only, per `:132`), `frontend/public/js/auth/modules/data-manager.js:131,315,345`, `frontend/public/js/appointment/modules/appointment-enricher.js:38`, `frontend/public/js/appointment/modules/data-manager.js:38,73`.
- [ ] 4.8 Run 4.5 test — GREEN.
- [ ] 4.9 Rewrite (not relax) existing tests that assert old insecure/legacy behavior: `frontend/test/appointment-srp-split.test.js:180-264` (asserts Bearer-from-`authToken` fallback fetch) and any other test found asserting `authToken` localStorage reads/writes — update assertions to the cookie-only contract.
- [ ] 4.10 Re-grep `frontend/` repo-wide for `authToken` — confirm zero `localStorage` writers/readers remain; only the cookie name string (`postLogin.js:57`, `logout.js:6`) and the rewritten test files' assertion strings/comments should remain.

## Phase 5: Final Verification (no Authorization header sent at all)

- [ ] 5.1 Full backend suite: `cd backend && ./mvnw test` — 100% green, zero skipped.
- [ ] 5.2 Full frontend suite: run the frontend test command — 100% green, zero skipped, including the Phase 4.9 rewritten tests.
- [ ] 5.3 Live e2e: start backend + frontend, log in via the real `login.ejs` form, confirm `localStorage.authToken` is `null` immediately after login while the five non-sensitive keys are set; confirm the `Authorization` header is never sent on any subsequent API call (inspect network tab/devtools or a request-logging proxy).
- [ ] 5.4 Live e2e: with no `Authorization` header anywhere, navigate patient list, dentist list, appointment list, and dashboard for the seed user — all load successfully via cookie-only auth.
- [ ] 5.5 Live XSS proof: seed/edit a patient or dentist record with `<script>alert(1)</script>` in name/email, view the corresponding list — confirm literal text renders, no alert fires, across all three lists.
- [ ] 5.6 Confirm PR description(s) note that `CorsConfig.java` and the cookie-attribute block (`postLogin.js:57-63`) were verified, not modified, per design Decision 2.
