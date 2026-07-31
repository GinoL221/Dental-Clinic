# Dashboard Breakdowns Specification

## Purpose

Define the aggregation semantics of the two new dashboard breakdowns —
appointments by status and appointments by dentist — and their rendering as
uPlot bar charts: which entries appear, zero-count and empty-result
behavior, ordering, dentist labelling, and the overflow rule that keeps the
dentist chart bounded as the clinic grows.

## Requirements

### Requirement: Status Breakdown Always Includes All Four Statuses

The appointments-by-status breakdown MUST always contain exactly one entry
per `AppointmentStatus` value (`SCHEDULED`, `IN_PROGRESS`, `COMPLETED`,
`CANCELLED`), including entries with a count of zero. The chart shape MUST
be stable across every query, never gaining or losing bars.

#### Scenario: Range contains only SCHEDULED appointments
- GIVEN the active filter matches only `SCHEDULED` appointments
- WHEN the status breakdown is computed
- THEN all four statuses are present
- AND `IN_PROGRESS`, `COMPLETED`, `CANCELLED` each report a count of `0`

#### Scenario: No appointments match the filter
- GIVEN the active filter matches zero appointments
- WHEN the status breakdown is computed
- THEN all four statuses are present, each with a count of `0`

### Requirement: Dentist Breakdown Excludes Zero-Activity Dentists

The appointments-by-dentist breakdown MUST only include dentists with at
least one matching appointment in the active range/filter. Dentists with no
activity MUST NOT appear as zero-count entries.

#### Scenario: Dentist with no appointments in range is omitted
- GIVEN dentist `D9` has no appointments within the active filter
- WHEN the dentist breakdown is computed
- THEN `D9` does not appear in the result set at all

#### Scenario: No appointments match the filter
- GIVEN the active filter matches zero appointments
- WHEN the dentist breakdown is computed
- THEN the result set is empty (no dentist entries)

### Requirement: Dentist Breakdown Is Capped At Top 10 With An "Otros" Overflow Bar

The dentist breakdown MUST rank active dentists by descending appointment
count, ties broken by dentist name ascending for determinism. The chart
MUST render at most 10 individual dentist bars. If more than 10 dentists
have activity, the 11th and beyond MUST be aggregated into a single
trailing "Otros" bar whose count is the sum of all overflowing dentists'
counts. This keeps the chart height bounded regardless of clinic size,
without silently dropping data.

#### Scenario: 8 active dentists — no overflow
- GIVEN 8 dentists have activity in the active filter
- WHEN the dentist breakdown is computed
- THEN all 8 appear as individual bars, ordered by count descending
- AND no "Otros" bar is present

#### Scenario: 14 active dentists — overflow aggregated
- GIVEN 14 dentists have activity in the active filter
- WHEN the dentist breakdown is computed
- THEN the top 10 by count appear as individual bars
- AND one trailing "Otros" bar reports the summed count of the remaining 4

#### Scenario: Tied counts break by name
- GIVEN two dentists have the same appointment count
- WHEN the dentist breakdown is computed
- THEN they appear in ascending alphabetical order by name relative to each
  other

### Requirement: Breakdowns Honor The Active Filter

Both breakdowns MUST be computed against the exact same active
`from`/`to`/`dentistId` filter applied to the rest of the snapshot (see the
`dashboard-filtering` capability), not against the unfiltered dataset.

#### Scenario: Dentist filter narrows the status breakdown
- GIVEN `dentistId=7` is active
- WHEN the status breakdown is computed
- THEN counts reflect only dentist `7`'s appointments, still with all 4
  statuses present

#### Scenario: dentistId filter collapses the dentist breakdown to one entry
- GIVEN `dentistId=7` is active and dentist `7` has activity in range
- WHEN the dentist breakdown is computed
- THEN only dentist `7` appears (a single bar), since the filter already
  restricts the dataset to one dentist

### Requirement: Empty Breakdown Renders Without Error

When a breakdown's result set is empty (dentist breakdown with zero
matching appointments), the chart MUST render a defined empty state and
MUST NOT throw or render a broken/malformed chart.

#### Scenario: Empty dentist breakdown shows the empty state
- GIVEN the dentist breakdown result set is empty
- WHEN the dashboard page renders
- THEN the existing empty-state guard pattern (mirroring the monthly
  chart's `if (!labels.length) return`) is applied
- AND no uncaught rendering error occurs

### Requirement: Dentist Bars Are Labelled By Display Name

Each individual dentist bar MUST be labelled with the dentist's display
name (not a raw id), consistent with existing dentist labelling elsewhere
in the dashboard (e.g. the upcoming-appointments panel).

#### Scenario: Dentist bar shows a readable name
- GIVEN a dentist breakdown entry for dentist `D3` ("Dra. Pérez")
- WHEN the chart renders
- THEN the axis/tooltip label reads "Dra. Pérez", not `D3` or a numeric id
