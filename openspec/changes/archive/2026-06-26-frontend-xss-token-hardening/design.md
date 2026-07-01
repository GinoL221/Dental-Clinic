# Design: Frontend XSS + Token Hardening

## Technical Approach

Two independent hardening tracks under one change. **Track A (XSS)** converts three list
renderers and the `postLogin` response from interpolated-HTML sinks to inert DOM/JSON: user text
flows through `textContent`/property assignment, never string concatenation; static markup
(buttons, icons) stays as-is. **Track B (token)** removes the `authToken` JWT from `localStorage`
and teaches `JwtAuthenticationFilter` to read it from the existing httpOnly `authToken` cookie as a
fallback, so requests authenticate via the cookie once the JS token is gone. The two tracks share
no code; Track B carries the auth-break risk and dictates the rollout order below.

Origin reality (verified, not assumed): frontend Express serves on `localhost:3000`
(`frontend/app.js:57`), backend on `localhost:8080` (`config.js:4`). All `*-api.js` clients already
send `credentials: "include"`. Backend CORS already allows origin `http://localhost:3000` with
`setAllowCredentials(true)` (`CorsConfig.java:19-22`). The cookie is set by Express on `localhost`
(`postLogin.js:57`, name **`authToken`**, no `Domain` attr).

## Architecture Decisions

### Decision 1 — Dual-source auth: keep header AND add cookie (do NOT cut over)

**Choice**: `JwtAuthenticationFilter` reads the JWT from `Authorization: Bearer` **first**; if that
header is absent/non-Bearer, it falls back to the `authToken` cookie. Header path is unchanged.

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Header-first, cookie fallback | Non-browser callers/tests keep working; browser uses cookie | **Chosen** |
| Cookie-only cutover | Breaks `Authorization`-based tests and any non-browser caller; bigger blast radius | Rejected |
| Cookie-first, header fallback | No benefit; header is the explicit/intentional credential | Rejected |

**Rationale**: additive and reversible (matches the proposal's recommendation and the sibling
change's "smallest reversible surface" style). Header-first preserves existing test ergonomics
(`@WithMockUser` is unaffected; explicit-Bearer integration tests still pass). Control flow:

```java
String authHeader = request.getHeader("Authorization");
String jwt = (authHeader != null && authHeader.startsWith("Bearer "))
        ? authHeader.substring(7)
        : extractTokenFromCookie(request);   // null-safe scan of getCookies()
if (jwt == null) { filterChain.doFilter(request, response); return; }
// ...unchanged: extractUsername → loadUserByUsername → isTokenValid → set context
```

`extractTokenFromCookie` iterates `request.getCookies()` (may be null), returns the value of the
cookie named `authToken`, else `null`. The existing early-return-when-no-token behavior is preserved
for unauthenticated requests.

### Decision 2 — Cookie attributes unchanged; `sameSite=lax` is correct here

**Choice**: Keep current attributes (`httpOnly: true`, `secure` in prod, `sameSite: "lax"`,
`maxAge: 24h`, `path: "/"`). No attribute change on the backend-read path.

**Rationale**: `localhost:3000` and `localhost:8080` are **same-site** (same registrable host
`localhost`; SameSite ignores port), so a `lax` cookie IS attached to the cross-*origin* `fetch()`
calls to :8080. What makes it cross-origin (not cross-site) is the port, handled entirely by CORS —
already configured with the explicit origin + `allowCredentials(true)`. Raising to `sameSite=none`
would be wrong: it requires `secure` and is meant for true cross-*site* contexts this app does not
have. `httpOnly` already blocks JS reads — the only missing piece is the backend cookie read
(Decision 1), not a cookie-attribute change.

### Decision 3 — Convert all three list sinks to safe DOM (dentist included now)

**Choice**: convert patient, appointment, **and** dentist renderers to `createElement` +
`textContent` in this change — do not defer dentist as "cleanup".

**Rationale**: this is a security-hardening change; leaving one renderer on a divergent
`escapeHtml()`-string pattern keeps an XSS-shaped surface alive and invites copy-paste regression.
Converting all three yields one consistent inert-rendering contract and lets the per-file
`escapeHtml` helper be removed. Dentist is behavior-equivalent (low risk), so the consistency cost
is small.

### Decision 4 — `postLogin` returns JSON; client script does the sync

**Choice**: collapse the legacy HTML/`<script>` branch (`postLogin.js:94-115`) into a JSON response
identical in shape to the existing modular branch (`:81-91`). A small **existing static JS file**
(login page module), not inline template script, reads the JSON, writes only the non-sensitive keys
(`userRole`, `userEmail`, `userId`, `userFirstName`, `userLastName` — **never** `authToken`), then
`window.location` redirects. The httpOnly cookie is already set server-side, so no token reaches JS.

**Rationale**: eliminates the server-built executable string (the item-4 script sink) without a new
view; keeping the redirect logic in a versioned JS file (vs. inline EJS) keeps it CSP-friendly and
testable.

## Data Flow

```
LOGIN:  browser ──POST /login──► Express(:3000) ──► backend auth ──► Set-Cookie authToken (httpOnly)
        Express returns JSON {role,email,id,...}  ──► login JS writes non-sensitive localStorage ──► redirect

API:    browser fetch(:8080, credentials:include) ──cookie authToken (same-site,lax)──► CORS(allowCreds)
              │ no Authorization header
              ▼
        JwtAuthenticationFilter: header? no → cookie authToken → validate → SecurityContext
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/.../configuration/JwtAuthenticationFilter.java` | Modify | Header-first, cookie `authToken` fallback (`extractTokenFromCookie`) |
| `frontend/public/js/patient/modules/ui-manager.js` | Modify | `createPatientTableRow`: build `<tr>`/`<td>` via DOM, `textContent` for name/email |
| `frontend/public/js/appointment/modules/ui-manager.js` | Modify | DOM-build rows; remove inline `onclick` name-interp → `addEventListener` closure |
| `frontend/public/js/dentist/modules/ui-manager.js` | Modify | Convert to safe DOM; drop `escapeHtml` helper |
| `frontend/src/controllers/auth/postLogin.js` | Modify | Legacy branch → JSON; remove inline `<script>` and `authToken` writer |
| `frontend/public/js/api/config.js` | Modify | `getAuthHeaders` stops reading/attaching `authToken` |
| `frontend/public/js/api/auth-api.js` | Modify | Remove `authToken` writers (`:31,70`) + readers (`:121,129,139,146`); `isAuthenticated` keeps cookie check only |
| `frontend/public/js/auth/modules/data-manager.js` | Modify | Remove `authToken` writers/readers (`:46,131,315,345,394`) |
| `frontend/public/js/appointment/modules/{appointment-enricher,data-manager}.js` | Modify | Remove direct `authToken` reads |
| login page JS module | Modify | Read login JSON → write non-sensitive keys → redirect |
| `src/test/.../JwtAuthenticationFilterTest` + FE renderer/login tests | New | Cookie-auth + inert-render contracts |

`CorsConfig.java` and the cookie-setting block in `postLogin.js:57-63` are **not** modified.

## Per-file sink conversion

- **patient/ui-manager.js**: replace the `row.innerHTML = \`...\`` template with `createElement("td")`
  per cell. ID/DNI/dates use `textContent` (derived/safe). `fullName` and `email` cells:
  `td.textContent = value`. The actions `<td>` keeps its static button markup via a single
  `innerHTML` on that cell only (no user data in it) or `insertAdjacentHTML`; `onclick="editPatient(id)"`
  stays (numeric id, not user text).
- **appointment/ui-manager.js**: same DOM build for `patientName`/`patientEmail`/`description` via
  `textContent`. The delete button is created in JS and wired with
  `btn.addEventListener("click", () => window.confirmDeleteAppointment(appointment.id, patientName))`
  — closure capture replaces the `onclick="...${patientName}..."` string vector entirely. `displayStats`
  renders derived numbers only → out of scope (no user text).
- **dentist/ui-manager.js**: mirror patient pattern; `registrationNumber`/`firstName`/`lastName` via
  `textContent`; remove `this.escapeHtml`. Empty-state row (static markup) may stay as `innerHTML`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Unit (backend) | Filter: Bearer-only, cookie-only, neither, both (header wins), invalid cookie token | MockHttpServletRequest + mock `JwtService`/`UserDetailsService` |
| Integration (backend) | Authenticated GET with cookie only (no Authorization) → 200 | MockMvc `.cookie(new Cookie("authToken", jwt))` |
| Unit (frontend) | Render row with `<img onerror>`/`<script>` name+email → no element created, text inert | jsdom; assert `querySelector("script")` null, `textContent` equals raw |
| Unit (frontend) | Appointment delete handler invoked with correct id+name; no string-built onclick | jsdom + spy on `confirmDeleteAppointment` |
| Unit (frontend) | After login, `localStorage.getItem("authToken")` is null; non-sensitive keys set | jsdom |

## Migration / Rollout

Strict ordering — Track B is sequenced to never strand auth (top proposal risk):

1. **Backend filter + its tests** — add cookie fallback, ship/verify with `Authorization` header
   STILL attached (transition state: both sources live, header wins, nothing breaks).
2. **Verify cookie path end-to-end** — real login, then an authenticated GET forced through the
   cookie (header removed in the test) → 200.
3. **Remove frontend `authToken` writers/readers** — `getAuthHeaders` stops attaching Bearer;
   `localStorage` writers/readers deleted; `postLogin` JSON + login JS.
4. **Final verification** — login + lists + dashboard with NO `Authorization` header sent;
   `localStorage.authToken` null; repo-wide `authToken` grep clean (localStorage only).

Track A (XSS renderers) is independent and may land in the same slice or earlier; it has no auth
coupling. Keep step 3 and the step-1 filter change in the **same deliverable slice** so they revert
together (rollback plan).

## Open Questions

- [ ] None blocking. Decisions 1–4 resolve the proposal's three deferred questions
      (cutover = dual-source header-first; cookie attrs = unchanged, `lax` correct for same-site;
      sink parity = convert all three + remove the appointment onclick vector).
