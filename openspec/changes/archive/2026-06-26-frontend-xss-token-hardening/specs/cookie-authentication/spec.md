# Cookie-Based Request Authentication Specification

## Purpose

Defines a new authentication source for backend requests: the httpOnly `authToken` cookie, read as a
fallback when no `Authorization` header is present. This capability exists so that removing the JWT
from `localStorage` (see Client Token Handling) does not break authenticated requests — the cookie,
already issued at login, becomes the carrier instead of a JS-attached header. Requirements describe
observable outcomes only; `sdd-design` selects the exact cutover policy (header retained as fallback
vs. cookie-only) and any cookie-attribute changes.

## Requirements

### Requirement: A Request With No Authorization Header Authenticates From the Cookie

The system MUST authenticate an incoming request using the JWT found in the httpOnly `authToken`
cookie when the request carries no `Authorization` header (or an empty/malformed one). This is the
primary path once the JWT is no longer attached by client JS.

**Enforcement mechanism:** imperative logic in `JwtAuthenticationFilter` (or equivalent), evaluated
before the existing header-based extraction returns empty-handed. Not expressible as `@PreAuthorize` —
this is filter-chain-level authentication, not a method-level authorization check.

#### Scenario: Authenticated GET succeeds via cookie alone

- GIVEN a caller holds a valid httpOnly `authToken` cookie issued by login
- WHEN they send a GET request to a protected endpoint (e.g. patient list) with no `Authorization`
  header
- THEN the request is authenticated as the cookie's subject
- AND the response is the same as if a valid `Authorization: Bearer` header had been sent

#### Scenario: Missing cookie and missing header leaves the request unauthenticated

- GIVEN a caller sends a request with neither an `Authorization` header nor an `authToken` cookie
- WHEN the request reaches a protected endpoint
- THEN the request is treated as unauthenticated, identical to current pre-change behavior
- AND no new authentication path is silently granted

#### Scenario: Expired or invalid cookie token is rejected

- GIVEN a caller's `authToken` cookie contains an expired or tampered JWT
- WHEN they send a request with no `Authorization` header
- THEN the request is treated as unauthenticated (same rejection behavior as an expired/invalid
  bearer token today)
- AND no fallback grants access on a failed cookie token

### Requirement: Header-Sourced Authentication Continues to Work (Cutover Policy)

The system MUST continue to authenticate requests carrying a valid `Authorization: Bearer` header,
regardless of whether an `authToken` cookie is also present. Whether the header remains a permanent
parallel source or is fully retired in favor of cookie-only auth is the cutover policy `sdd-design`
confirms; this requirement only constrains that, as of this change shipping, header-based requests
are NOT broken.

**Enforcement mechanism:** imperative logic — the filter MUST check the header source first (current
behavior unchanged) and only fall back to the cookie when the header path yields no token.

#### Scenario: A non-browser API caller using only a bearer header still authenticates

- GIVEN a caller (e.g. an automated test or non-browser API consumer) sends a valid
  `Authorization: Bearer {token}` header and no cookie
- WHEN the request reaches a protected endpoint
- THEN the request is authenticated exactly as before this change
- AND the cookie fallback path is not invoked

#### Scenario: Both header and cookie present — header takes precedence (no conflict)

- GIVEN a caller sends both a valid `Authorization` header and a valid `authToken` cookie
- WHEN the request reaches a protected endpoint
- THEN the request authenticates successfully (exact precedence is an implementation detail; both
  tokens being individually valid MUST NOT produce a conflict or rejection)

### Requirement: Cookie Authentication Does Not Widen Existing Authorization Boundaries

Authenticating via the cookie MUST grant exactly the same principal, authorities, and role-based
access as authenticating via the equivalent header token. The cookie is an alternate transport for the
same JWT-based identity, not a separate or weaker trust path.

**Enforcement mechanism:** the cookie-sourced token MUST be validated through the same JWT
verification logic already used for the header-sourced token (signature, expiry, claims) — no
parallel/looser validation path.

#### Scenario: Cookie-authenticated PATIENT has identical access to header-authenticated PATIENT

- GIVEN the same valid JWT, once presented via the `Authorization` header and once via the
  `authToken` cookie
- WHEN each request hits the same protected, role-gated endpoint
- THEN both requests receive the same authorization outcome (same allow/deny, same data)

#### Scenario: Cookie token signed with an invalid signature is rejected identically to a bad header token

- GIVEN a JWT with an invalid signature is placed in the `authToken` cookie
- WHEN a request with no `Authorization` header reaches a protected endpoint
- THEN the request is rejected the same way an invalid bearer header token is rejected today
