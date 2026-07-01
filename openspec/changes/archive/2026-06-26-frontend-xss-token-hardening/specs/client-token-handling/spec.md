# Client Token Handling Specification

## Purpose

Defines what the frontend may persist in `localStorage` after this change: the JWT (`authToken`) MUST
NOT be written to or read from `localStorage` anywhere in the client, closing the high-value target an
XSS payload could otherwise steal. Non-sensitive identity fields used for client-side UI
(`userRole`, `userFirstName`, `userLastName`, `userEmail`, `userId`) remain, since they carry no
bearer-token capability on their own. This capability depends on Cookie-Based Request Authentication
already carrying authenticated requests, so removing the token does not break the app. Requirements
describe observable storage/runtime outcomes only; `sdd-design`/`sdd-apply` select exact per-file edit
mechanics.

## Requirements

### Requirement: The JWT Is Never Persisted In localStorage

The system MUST NOT write the JWT (the `authToken` value) to `localStorage` at any point in the
client lifecycle, including login, token refresh/sync flows, and any other code path that previously
wrote it.

**Enforcement mechanism:** removal of all `localStorage.setItem("authToken", ...)` call sites
(`auth-api.js`, `auth/modules/data-manager.js`, and the `postLogin.js` client-side sync logic).
Verified by an outcome check, not by inspecting specific line numbers.

#### Scenario: After a successful login, authToken is absent from localStorage

- GIVEN a user submits valid login credentials
- WHEN the login flow completes and the client finishes processing the response
- THEN `localStorage.getItem("authToken")` returns `null`

#### Scenario: No code path writes authToken to localStorage (repo-wide)

- GIVEN the complete frontend codebase after this change
- WHEN searching for any write of the `authToken` key to `localStorage`
- THEN no such write exists anywhere in the codebase

### Requirement: The JWT Is Never Read From localStorage

The system MUST NOT read an `authToken` value from `localStorage` anywhere in the client, including
code that previously attached it to outgoing request headers (e.g. `getAuthHeaders`).

**Enforcement mechanism:** removal of all `localStorage.getItem("authToken")` call sites across
`config.js`, `auth-api.js`, `auth/modules/data-manager.js`,
`appointment/modules/appointment-enricher.js`, and `appointment/modules/data-manager.js`. Outgoing
requests rely on the httpOnly cookie (via `credentials: "include"`, already present in all API client
modules) instead of a JS-attached bearer header.

#### Scenario: Outgoing API requests no longer attach an Authorization header sourced from localStorage

- GIVEN a logged-in user with no `authToken` in `localStorage`
- WHEN the client makes an authenticated API call (e.g. fetching the patient list)
- THEN the request succeeds via the httpOnly cookie
- AND no code path attempts to read a non-existent `authToken` from `localStorage` to build an
  `Authorization` header

#### Scenario: No code path reads authToken from localStorage (repo-wide)

- GIVEN the complete frontend codebase after this change
- WHEN searching for any read of the `authToken` key from `localStorage`
- THEN no such read exists anywhere in the codebase

### Requirement: Non-Sensitive Identity Fields Remain Available for Client UI

The system MUST continue to store and read `userRole`, `userFirstName`, `userLastName`, `userEmail`,
and `userId` in `localStorage`, since these fields are used for client-side UI state and carry no
bearer-token capability by themselves. This change MUST NOT remove or break access to these fields.

**Enforcement mechanism:** none of the `authToken`-removal edits touch the writers/readers for these
five keys; they are explicitly excluded from the removal scope.

#### Scenario: Post-login, non-sensitive identity fields are present and correct

- GIVEN a user successfully logs in
- WHEN the login flow completes
- THEN `localStorage` contains `userRole`, `userFirstName`, `userLastName`, `userEmail`, and `userId`
  matching the authenticated user's data

#### Scenario: UI elements that depend on identity fields continue to work

- GIVEN a logged-in user with the five non-sensitive identity fields present in `localStorage`
- WHEN the application renders UI that depends on those fields (e.g. a greeting, role-based menu
  visibility)
- THEN that UI renders identically to its behavior before this change

### Requirement: Authenticated Flows Remain Functional End-to-End Without the Stored JWT

Removing the JWT from `localStorage` MUST NOT break the application's authenticated flows. Login,
list views (patient, dentist, appointment), and the dashboard MUST continue to work for an
authenticated user, with the httpOnly cookie (per the Cookie-Based Request Authentication
capability) carrying authentication instead of a JS-attached bearer token.

**Enforcement mechanism:** sequencing dependency — the backend cookie-fallback authentication MUST be
in place before or alongside this removal; this requirement is the end-to-end outcome check for that
sequencing.

#### Scenario: A seed user can log in and view all list pages with no JS-held token

- GIVEN a seeded user account and a running application with this change applied
- WHEN the user logs in and navigates to the patient list, dentist list, appointment list, and
  dashboard
- THEN every page loads its data successfully
- AND at no point does `localStorage` contain an `authToken` value

#### Scenario: Logging out clears the non-sensitive identity fields as before

- GIVEN a logged-in user with the five non-sensitive identity fields in `localStorage`
- WHEN the user logs out
- THEN those fields are cleared/removed, consistent with pre-change logout behavior
