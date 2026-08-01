# Mobile List Layout Specification

## Purpose

Define the responsive contract for the `/patients`, `/dentists`, and
`/appointments` list pages: the horizontal-scroll fallback, the table→card
transform and its breakpoint, header wrapping, card content/label rules,
preserved actions and accessibility, empty-state behavior, and the
byte-identical desktop guarantee. Scoped to `components/tables.css` and the
three list-page `+page.svelte` files.

## Requirements

### Requirement: Horizontal-Scroll Fallback Above The Card Breakpoint

`.table-container` MUST use `overflow-x: auto` (not `overflow: hidden`) at
`≥768px`, so a table wider than its container scrolls instead of clipping.

#### Scenario: Appointments table wider than its container
- GIVEN the appointments page renders its 8-column table at ≥768px
- WHEN the table's intrinsic width exceeds `.table-container`
- THEN the container scrolls horizontally and no column is clipped

### Requirement: List-Header Wraps And Search Input Is Fluid

The header row MUST wrap without horizontal overflow below `768px`. The
search input MUST use a fluid, class-driven width (`.list-search-input`)
instead of the hardcoded inline `style="width: 250px"`.

#### Scenario: Header wraps at mobile width
- GIVEN any list page renders at 375px
- WHEN the header (title, search, clear, add button) is inspected
- THEN it wraps onto multiple lines with no horizontal overflow

#### Scenario: Search input has no inline width style
- GIVEN any list page's markup
- WHEN the search `<input>` is inspected
- THEN no inline `width: 250px` style is present; `.list-search-input`
  governs its width

### Requirement: Card Transform Triggers At The Defined Breakpoint

Below `max-width: 767.98px`, each table row MUST render as a stacked card.
At `≥768px`, the table MUST render normally (with scroll fallback).

#### Scenario: Mobile width renders cards
- GIVEN a list page renders at 767px or narrower
- WHEN the table is inspected
- THEN each `<tr>` renders as a bordered, stacked card

#### Scenario: Desktop width renders a table
- GIVEN a list page renders at 768px or wider
- WHEN the table is inspected
- THEN it renders as a normal table, not cards

### Requirement: Card Content Shows Every Value With A Matching Label

Every displayed value MUST show a label derived from `data-label`, matching
its column's `<th>` text exactly. The `#` index column MUST be suppressed
on mobile; every other column MUST remain visible, including all
appointment fields. No column MAY be visually promoted or bolded as a card
title — every row is a uniform label/value pair. Long `Descripción` values
MUST truncate with an ellipsis; no tap-to-expand.

#### Scenario: Label matches header text
- GIVEN the appointments "Fecha" column
- WHEN its card cell renders on mobile
- THEN the visible label reads "Fecha", matching the `<th>` exactly

#### Scenario: Index column suppressed, all other fields shown
- GIVEN an appointments card renders on mobile
- WHEN its fields are inspected
- THEN no "#" value/label appears, and Fecha, Hora, Paciente, Odontólogo,
  Descripción, Estado, and Acciones are all present

#### Scenario: Long description truncates without expanding
- GIVEN a `Descripción` value longer than the card width
- WHEN its card renders on mobile
- THEN the value truncates with an ellipsis and tapping it does not expand it

#### Scenario: No field is visually promoted
- GIVEN any mobile card
- WHEN its rows are inspected
- THEN every label/value pair shares the same font weight/size — none is
  bolded or styled as a heading

### Requirement: Actions Remain Visible And Tappable

The edit link and delete form/button MUST remain visible and tappable on
every mobile card; delete confirmation behavior MUST be unchanged.

#### Scenario: Edit and delete reachable on a mobile card
- GIVEN any list page renders at mobile width
- WHEN a card's actions area is inspected
- THEN the edit link and delete button are both visible and tappable

#### Scenario: Delete confirmation still fires
- GIVEN a mobile card's delete button
- WHEN it is tapped
- THEN the existing confirm dialog appears before submission, unchanged

### Requirement: Table Accessibility Semantics Are Preserved At Every Width

Because `display: block` removes implicit table ARIA roles, the markup
MUST declare explicit `role="table"`, `rowgroup`, `row`, `columnheader`,
and `cell` so the accessibility tree exposes correct table semantics at
both mobile and desktop widths.

#### Scenario: Roles present at mobile and desktop widths
- GIVEN a list page renders at 375px and again at ≥768px
- WHEN the accessibility tree is inspected at each width
- THEN `table`, `row`, and `cell` roles are present at both

### Requirement: Empty State Renders Correctly At Mobile Widths

The "No se encontraron..." empty state MUST render without overflow or
broken layout at mobile widths.

#### Scenario: No-match search shows empty state on mobile
- GIVEN a list page at 375px with a search matching zero rows
- WHEN the page renders
- THEN the empty-state message fits within the viewport with no overflow

### Requirement: Desktop Rendering Is Unchanged At ≥768px

At `≥768px`, the three list pages' rendering MUST be byte-identical to
their pre-change behavior: same table layout, columns, header layout, and
styling.

#### Scenario: All three pages render unchanged at desktop width
- GIVEN patients, dentists, and appointments render at 1024px
- WHEN compared to their pre-change rendering
- THEN table layout, columns, and header are visually identical on all
  three

### Requirement: Other Routes Are Out Of Scope

Landing, login, register, dashboard, and error routes MUST NOT be modified
by this capability.

#### Scenario: No other route file is touched
- GIVEN this change's full diff
- WHEN the changed-file list is inspected
- THEN no dashboard, landing, login, register, or error-route file appears

## Verification

The card transform, header wrap, scroll fallback, and accessibility-role
scenarios are asserted by the `mobile-fullstack-chromium` Playwright
project (a device preset supplying `isMobile`/`hasTouch`, not
`setViewportSize`). Desktop non-regression scenarios are asserted by the
existing `fullstack-chromium` project.

## Out of Scope

- Sorting, per-card collapse/expand, or changes to search/filter/delete logic.
- Add/edit form pages (`*/add`, `*/edit/[id]`).
- Visual-regression/screenshot-diff tooling.
