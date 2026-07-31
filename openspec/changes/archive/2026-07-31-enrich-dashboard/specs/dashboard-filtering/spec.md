# Dashboard Filtering Specification

## Purpose

Define the `from`/`to`/`dentistId` filter contract on `GET /dashboard/snapshot`:
accepted values, defaults, invalid-range handling, which sections of the
snapshot the filter reaches, per-stat-card semantics under a dentist filter,
the cache-key rule that prevents cross-filter data leakage, and preservation
of the ADMIN-only boundary on the now-parameterized endpoint.

## Requirements

### Requirement: Optional Filter Parameters

`GET /dashboard/snapshot` MUST accept three independently optional query
parameters: `from` (ISO local date), `to` (ISO local date), and `dentistId`
(existing dentist id). Any subset — none, one, two, or all three — MUST be
accepted without error.

#### Scenario: Only dentistId supplied
- GIVEN a request with `dentistId=7` and no `from`/`to`
- WHEN the snapshot is computed
- THEN monthly stats, breakdowns, stat cards, and the upcoming panel are
  scoped to dentist `7` across the full available date range

#### Scenario: Unknown but well-formed dentistId
- GIVEN `dentistId` refers to no existing dentist
- WHEN the snapshot is computed
- THEN the request succeeds (no error) and every appointment-derived section
  reflects zero matching appointments

### Requirement: Default Window Unchanged When No Filter Is Applied

Requesting the snapshot with none of `from`, `to`, `dentistId` set MUST
reproduce exactly today's default behavior: the trailing 6-month monthly
window, byte-equivalent to pre-change output.

#### Scenario: No params reproduces current output
- GIVEN a request with no filter params
- WHEN the snapshot is computed
- THEN `monthlyStats` matches the current hardcoded last-6-months output
  field-for-field

### Requirement: Invalid Or Inverted Date Range Is Rejected

If `from` is after `to`, or either value is unparsable as a date, the system
MUST NOT apply the filter and MUST surface a visible validation error. It
MUST NOT silently coerce the request to the default window.

#### Scenario: from is after to
- GIVEN `from=2026-06-01` and `to=2026-01-01`
- WHEN the request is processed
- THEN a validation error is returned/displayed and no filtered data is
  rendered as if it were valid

#### Scenario: Unparsable date value
- GIVEN `from=not-a-date`
- WHEN the request is processed
- THEN the same visible validation error path is taken as the inverted-range
  case

### Requirement: Filter Reach Spans The Entire Snapshot

The active filter (any combination of `from`/`to`/`dentistId`) MUST apply
uniformly to: the four stat cards, the upcoming-appointments panel, the
monthly appointment series, and both breakdown charts. No section MUST
silently ignore an active filter.

#### Scenario: Dentist filter narrows the upcoming panel
- GIVEN `dentistId=7` is active
- WHEN the snapshot is computed
- THEN `upcomingAppointments` contains only appointments for dentist `7`

#### Scenario: Date range narrows monthly stats and both breakdowns together
- GIVEN `from`/`to` span 2 months
- WHEN the snapshot is computed
- THEN `monthlyStats`, the status breakdown, and the dentist breakdown all
  reflect only appointments within that range

### Requirement: Per-Stat-Card Semantics Under An Active Filter

Each of the four stat cards MUST have one fixed, consistent rule applied
regardless of which filter combination is active:

- `totalAppointments` and `todayAppointments` are appointment-derived and
  MUST apply the full active filter (`from`/`to` AND `dentistId`, when set).
- `totalDentists` and `totalPatients` are NOT appointment-derived — they
  answer "how many dentists/patients exist," not "how many appointments" —
  and MUST remain global counts, unaffected by any filter combination.

#### Scenario: Dentist filter narrows appointment counts, not entity totals
- GIVEN `dentistId=7` is active
- WHEN the snapshot is computed
- THEN `totalAppointments` and `todayAppointments` reflect only dentist `7`
- AND `totalDentists` and `totalPatients` are unchanged from the unfiltered
  clinic-wide values

#### Scenario: Date range excluding today zeroes todayAppointments
- GIVEN `from`/`to` do not include the current date
- WHEN the snapshot is computed
- THEN `todayAppointments` is `0`, consistent with applying the same
  from/to filter used everywhere else

### Requirement: Cache Applies Only To The Fully Unparameterized Request

`@Cacheable` on the snapshot lookup MUST be condition-gated so caching only
occurs when `from`, `to`, and `dentistId` are all absent. Any request with
one or more of these params set MUST bypass the cache entirely, both for
reads and for not populating a cache entry.

#### Scenario: Unparameterized request is cached
- GIVEN two consecutive requests with no filter params
- WHEN the second request is made before cache eviction
- THEN it is served from cache (no re-computation)

#### Scenario: Filtered request is never cache-served
- GIVEN a cached unparameterized snapshot exists
- WHEN a request with `dentistId=7` is made
- THEN the response is freshly computed for dentist `7`, not the cached
  unparameterized snapshot
- AND this filtered call does not populate or overwrite the cache

### Requirement: ADMIN-Only Boundary Is Preserved

Adding filter parameters MUST NOT weaken access control. `GET
/dashboard/snapshot` MUST remain restricted to ADMIN via backend
`@PreAuthorize("hasRole('ADMIN')")`, and the SvelteKit `/dashboard` route
guard MUST continue blocking non-admin and unauthenticated users, with or
without filter params present.

#### Scenario: Non-admin is blocked regardless of filter params
- GIVEN a non-ADMIN authenticated user
- WHEN they request `/dashboard/snapshot?dentistId=7`
- THEN the request is denied identically to an unfiltered request

#### Scenario: Existing authorization tests remain green
- GIVEN `authorization.spec.js` and `auth.spec.js`
- WHEN run against the parameterized endpoint
- THEN both continue to pass without modification to their pass/fail
  assertions
