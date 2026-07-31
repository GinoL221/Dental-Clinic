# Register Form Presentation Specification

## Purpose

Define the visual structure of `/users/register` to match the
maintainer-approved mockup: accent gradient bar, header, a consistent
2-column section grid, restyled inputs/button, and a distinct privacy
notice card. Register-page scoped; the login page's rendering is
unaffected except where explicitly noted.

## Requirements

### Requirement: Accent gradient top bar

The register card MUST display a horizontal accent bar using a gradient
from the brand primary color (`--color-primario`, `#4a90e2`) to the brand
secondary color (`--color-secundario`, `#a4e2c2`).

#### Scenario: Gradient bar renders above the card content

- GIVEN the register page is rendered
- WHEN the auth card is inspected
- THEN a gradient bar element is present, positioned above the header
- AND its computed gradient starts at `#4a90e2` and ends at `#a4e2c2`

### Requirement: Icon and title header

The register page MUST display a header containing an icon and the title
"Registro de Paciente", plus the existing subtitle text.

#### Scenario: Header renders with icon and title

- GIVEN the register page is rendered
- WHEN the header is inspected
- THEN an icon element and the title text "Registro de Paciente" are both
  present within the header

### Requirement: Consistent 2-column section grid

The three existing form sections (Datos Personales, Dirección, Seguridad)
MUST each render their fields in a consistent 2-column grid on desktop
viewports, replacing today's mix of 1-column and 2-column rows.

#### Scenario: Datos Personales section uses a 2-column grid

- GIVEN the register page is rendered at a desktop viewport width
- WHEN the "Datos Personales" section is inspected
- THEN `firstName`/`lastName` and `email`/`cardIdentity` render as
  paired 2-column rows

#### Scenario: Dirección section uses a 2-column grid

- GIVEN the register page is rendered at a desktop viewport width
- WHEN the "Dirección" section is inspected
- THEN `street`, `number`/`location`, and `province` render within the
  same 2-column grid pattern used by the other sections (no isolated
  full-width single-field rows where a 2-column pairing is possible)

#### Scenario: Seguridad section uses a 2-column grid

- GIVEN the register page is rendered at a desktop viewport width
- WHEN the "Seguridad" section is inspected
- THEN `password` and `confirmPassword` render as a paired 2-column row

### Requirement: Restyled input fields

Every text/email/password input in the register form MUST use: background
color `#f8f9fa`, a 2px border in `#e9ecef`, and a `10px` corner radius, with
a visible focus ring distinct from the unfocused state.

#### Scenario: Input renders with the specified base style

- GIVEN the register page is rendered
- WHEN any `auth-input`-class field is inspected in its default state
- THEN its background color is `#f8f9fa`, its border is `2px solid
  #e9ecef`, and its border-radius is `10px`

#### Scenario: Input shows a visible focus ring

- GIVEN the register page is rendered
- WHEN a field receives keyboard or pointer focus
- THEN a visibly distinct focus ring/box-shadow appears, different from the
  unfocused border style

### Requirement: Password field validation styling is not suppressed

The password field on the register page MUST visibly render `is-invalid`
styling (red border/background) when the field is invalid. The existing
`forms.css` `.password-input` `!important` rule block that unconditionally
strips `:invalid`/`.is-invalid` styling MUST be narrowed so it no longer
applies to the register page's password field, while the login page's
password field (`#loginForm`) rendering MUST remain visually unchanged.

#### Scenario: Register password field shows invalid styling

- GIVEN the register page's password field has an active validation error
  (e.g. via the `is-invalid` class or `:invalid` state)
- WHEN the field is rendered
- THEN a red-toned border and background distinct from the default state
  are visible

#### Scenario: Login page password field is unaffected

- GIVEN the login page's password field (`#loginForm`)
- WHEN it is rendered in any validity state
- THEN its border color, background, and box-shadow are pixel-identical to
  its pre-change rendering

### Requirement: Primary submit button styling

The submit button MUST display an icon alongside its label, use the
primary brand color, and render a visible shadow.

#### Scenario: Submit button renders with icon and shadow

- GIVEN the register page is rendered
- WHEN the submit button is inspected
- THEN it contains an icon element, uses the primary auth button style, and
  has a non-zero `box-shadow`

### Requirement: Privacy notice as a distinct card

The privacy/data-protection notice MUST render as a distinct light-blue
card, replacing the generic Bootstrap `alert-info` styling currently used.

#### Scenario: Privacy notice renders as a styled card

- GIVEN the register page is rendered
- WHEN the privacy notice below the submit button is inspected
- THEN it does not use the generic `alert-info` Bootstrap class
- AND it renders with a light-blue background distinct from the page
  background

## Out of Scope

- Mobile-responsiveness changes (viewport-specific column collapsing rules)
  are not defined by this spec.
- The login page's layout/visual structure is unchanged except for the
  narrow CSS-selector scoping described above.
