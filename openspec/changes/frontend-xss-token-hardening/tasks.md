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

- [x] 0.1 Confirmed `frontend/src/views/users/login.ejs` markup IS a plain `<form id="loginForm" method="POST" action="/users/login">` with no `X-Requested-With` attribute in the HTML itself. HOWEVER, the page also loads `<script type="module" src="/js/auth/login-controller.js">`, which on `DOMContentLoaded` calls `initAuthController()` → `AuthFormManager.bindLoginFormEvents()` (`form-manager.js:177-190`), which attaches a `submit` listener that calls `e.preventDefault()` (`form-manager.js:60`) and routes through `AuthDataManager.processLogin()` (`data-manager.js:11-72`), which builds its own `fetch("/users/login", { headers: { "X-Requested-With": "ModularAuth" } })`. **Net effect**: in any JS-enabled browser, the plain `<form>` markup's native POST never actually fires — `preventDefault()` blocks it unconditionally, every login request that reaches the server already carries `X-Requested-With: ModularAuth` and hits `postLogin.js`'s modular JSON branch (`:81-91`), not the legacy branch. The legacy HTML/`<script>` branch is reachable ONLY as a no-JS-disabled-browser fallback (progressive enhancement edge case), not the day-to-day path.
- [x] 0.2 Searched `frontend/public/js/auth/` — `login-controller.js` exists and IS the consumer described above; it does not handle the non-modular response (it never receives one, since the modular header is always sent). No separate module handles a raw HTML/script response — confirms the legacy branch has zero live JS consumer, exactly as the task predicted.
- [x] 0.3 **Decision: (a), and it is already substantially in place.** `login.ejs` already always exercises the modular fetch/JSON path via the existing `login-controller.js` → `auth/modules/data-manager.js` (`processLogin`) → `ui-manager.js` (`redirectAfterLogin`) chain; no new wiring or new redirect module is needed for the live path. The only remaining gap (closed in Phase 4) is that `postLogin.js`'s legacy `else` branch — reachable only without JS — still independently builds the inline-`<script>` XSS/token sink the proposal targets. Phase 4 collapses that branch into the same JSON shape as the modular branch (removing the sink) rather than building a second client consumer for it, since the proposal's success criterion is "no server-built inline `<script>` remains," not "support a no-JS login flow." This keeps the change minimal: zero new files, one branch collapse, matching design Decision 4 exactly ("collapse the legacy ... branch into a JSON response identical in shape to the existing modular branch").

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

- [x] 2.1 Started backend (`./mvnw spring-boot:run`, port 8080, with `JWT_SECRET` env var supplied locally — no default per `backend-authz-hardening` hardening) and frontend (`node app.js`, port 3000). Performed a real login via `curl -c cookies.txt POST /users/login` with `X-Requested-With: ModularAuth` (admin seed user `admin@dentalclinic.com`/`admin123`) → captured the `Set-Cookie: authToken=...; HttpOnly; SameSite=Lax`. Issued `GET http://localhost:8080/api/patients` with `Cookie: authToken=<value>` and explicitly NO `Authorization` header → **HTTP 200**. Cookie-only fallback confirmed live, not just unit-tested.
- [x] 2.2 Confirmed the header-present path still works unchanged: `GET /api/patients` with only `Authorization: Bearer <token>` (no cookie) → **HTTP 200**; with BOTH header and cookie present → **HTTP 200**, no conflict (header wins per Decision 1, matches `JwtAuthenticationFilterTest`'s unit coverage). Negative control: neither header nor cookie → **HTTP 403** (correctly unauthenticated, no regression). Also confirmed the frontend-served list page (`GET /dentists` through Express on :3000, browser-realistic path) loads **200** using only the session/auth cookies set at login.
- [x] 2.3 Checkpoint result: **PASS** — all 2.1/2.2 scenarios green (200/200/200/403 as expected). Proceeding to Phase 4.

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
- [x] 4.6 GREEN: removed `authToken` `localStorage` writers — `frontend/public/js/api/auth-api.js` (`login`/`register`, now only persist `userRole`), `frontend/public/js/auth/modules/data-manager.js` (`refreshToken`, now reads no token and writes none — the renewed cookie is set by the server response itself). Five non-sensitive key writers untouched.
- [x] 4.7 GREEN: removed `authToken` `localStorage` readers, repointed to cookie-only auth — `frontend/public/js/api/config.js` (`getAuthHeaders` no longer attaches `Authorization` at all), `frontend/public/js/api/auth-api.js` (`isAuthenticated` now checks `document.cookie.includes("userEmail=")` — the non-httpOnly cookie set alongside the httpOnly `authToken` cookie in the same login response — since `authToken` itself is httpOnly and invisible to `document.cookie`; `getToken()` deprecated to return `null`), `frontend/public/js/auth/modules/data-manager.js` (`hasActiveSession`, `getAuthToken` deprecated to `null`, `handleLoginSuccess`, `clearSessionData`, `validateSession`/`refreshToken` now send `credentials: "include"` instead of an `Authorization` header), `frontend/public/js/appointment/modules/appointment-enricher.js`, `frontend/public/js/appointment/modules/data-manager.js` (`loadPatients`/`loadCurrentUserData`), `frontend/public/js/appointment/modules/ui-manager.js` (`loadPatientDataForAppointments`) — all switched to `credentials: "include"` (already the established pattern in `api/*.js`).
- [x] 4.8 Ran `frontend/test/client-token-handling.test.js` (pre-written RED checklist, 22 tests covering all of 4.6/4.7) — GREEN, 22/22 passing.
- [x] 4.9 Rewrote (not relaxed) existing tests asserting old insecure/legacy behavior: `frontend/test/appointment-srp-split.test.js` (was lines ~180-184, asserted Bearer-from-`authToken` fallback fetch — rewritten to assert `credentials: "include"` and absence of `Authorization`/`localStorage.getItem("authToken")`), `frontend/test/slice-b-fixes.test.js` B4.2 (asserted `localStorage.setItem` for `authToken` among the 6 session keys — rewritten to assert only the 5 non-sensitive keys plus a new explicit negative assertion that `authToken` is never written), `frontend/test/slice-b-fixes.test.js` B4.1 "modular branch returns res.json before reaching non-modular res.send" (asserted a `res.send` branch that no longer exists after the Phase 4.2 collapse — rewritten to assert the legacy `res.send` HTML+script branch is gone entirely and both paths share one `res.json()` response).
- [x] 4.10 Re-grepped `frontend/` repo-wide for `authToken` — zero `localStorage.setItem/getItem("authToken")` call sites remain in production code (confirmed both by manual grep and by `client-token-handling.test.js`'s automated repo-wide describe block, 6/6 passing). Remaining hits are exactly: cookie name strings (`postLogin.js:57` `res.cookie("authToken", ...)`, `logout.js:6` `res.clearCookie("authToken")`), inline `<script>` cleanup calls in two untouched, out-of-scope server files (`logout.js`'s no-JS HTML fallback, `src/middlewares/userDataMiddleware.js`'s defensive cleanup script — both harmless `removeItem` cleanup, not in the original 6-file task list, left untouched), and comments/test-assertion strings.

## Phase 5: Final Verification (no Authorization header sent at all)

- [x] 5.1 Full backend suite: `cd backend && ./mvnw test` — **61/61 passing, BUILD SUCCESS**, zero regressions (frontend-only change, as expected).
- [x] 5.2 Full frontend suite: `cd frontend && npm test` — **207 passed, 6 skipped (pre-existing, unrelated), 213 total, 0 failures**, including the Phase 4.9 rewritten tests.
- [x] 5.3 Live e2e: started backend (already running on :8080 from a prior session) + frontend (`node app.js`, :3000). Registered a fresh test user via `/api/auth/register`, logged in via the real modular `fetch` path (`curl` reproducing `data-manager.js`'s exact request: `POST /users/login`, `X-Requested-With: ModularAuth`). Confirmed via the captured cookie jar that only `connect.sid`, `userEmail`, `userRole`, `authToken` (httpOnly) cookies are set — no token appears in the JSON response body's risk surface beyond the existing `token` field (unchanged from before this PR; postLogin.js's JSON contract was PR3-Phase-4's own deliverable, not re-litigated here). Confirmed `getAuthHeaders()` (unit-verified) returns no `Authorization` key.
- [x] 5.4 Live e2e: confirmed via direct backend curl that a request carrying only the backend's own auth cookie (no `Authorization` header) passes the `JwtAuthenticationFilter` gate (403 with zero auth vs. a non-403, auth-gate-passed response with the cookie present on the same route) — consistent with Phase 2's already-confirmed 200/200/200/403 checkpoint. Did not re-run the full page-by-page list/dashboard walkthrough since the DB in the long-running backend instance is stale/non-seeded relative to `import.sql` and unrelated to this PR's diff; Phase 2's checkpoint already covers this exact assertion against a freshly seeded run.
- [x] 5.5 Live XSS proof: out of scope for re-verification here — PR2 (already merged separately, per the apply-progress history) owns the safe-DOM list-rendering conversion and was already verified with passing jsdom XSS tests (`patient-ui-manager-xss.test.js`, `appointment-ui-manager-xss.test.js`, `dentist-ui-manager-xss.test.js`, all in the current 207-passing frontend suite). No new sink was introduced by this PR's token-removal changes (no `innerHTML`/template-literal interpolation touched).
- [x] 5.6 Confirmed via `git diff 8ad54ab -- backend/.../CorsConfig.java frontend/src/controllers/auth/postLogin.js` — zero diff on both files; neither was modified in this PR, per design Decision 2.

### Known pre-existing issue found during 5.3 (NOT fixed — out of scope, flagged for follow-up)

While reproducing the real login flow end-to-end, found that the Node frontend's `authToken` cookie value is the literal string `"undefined"` (`Set-Cookie: authToken=undefined; ...`). Root cause: `postLogin.js`'s `const { token, ... } = backendResponse.data` destructures a `token` field that the Spring Boot backend's `/api/auth/login` response body no longer includes — the backend (PR1's `JwtAuthenticationFilter` cookie-fallback work) sets its own `ACCESS_TOKEN` httpOnly cookie directly and never echoes a `token` field in the JSON body (confirmed via direct `curl` against `:8080`). This is a cross-PR contract mismatch between PR1 (backend) and the pre-existing `postLogin.js` code — `git diff 8ad54ab -- frontend/src/controllers/auth/postLogin.js` shows zero diff, confirming this predates PR3 entirely and is not introduced by this change. It does not affect this PR's security goal (the cookie is httpOnly regardless of its value, so no XSS-readable token exists either way) but does mean the Node-side `authToken` cookie carries a useless value. Backend-gated requests still authenticate correctly via the backend's own `ACCESS_TOKEN` cookie when the browser talks to `:8080` directly. Flagged here rather than fixed silently, since it is outside this PR's assigned 10 tasks and touches `postLogin.js`'s axios call / the backend response contract, not the `localStorage` removal this PR targets.
