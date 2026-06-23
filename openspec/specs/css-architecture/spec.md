# Delta for CSS Architecture

## ADDED Requirements

### Requirement: Modular CSS File Structure

The system SHALL organize custom CSS into five categorized directories under `frontend/public/css/`: `base/`, `components/`, `layout/`, `views/`, and `utilities/`. Each directory SHALL contain only styles matching its category scope.

| Directory | Scope | Files |
|-----------|-------|-------|
| `base/` | CSS tokens, reset, body layout, typography | `tokens.css`, `layout.css`, `typography.css` |
| `components/` | Reusable UI components | `buttons.css`, `cards.css`, `alerts.css`, `tables.css`, `forms.css` |
| `layout/` | Structural page regions | `header.css`, `footer.css` |
| `views/` | Page-specific styles | `landing.css`, `auth.css`, `error.css`, `dashboard.css`, `dentists.css`, `patients.css`, `appointments.css` |
| `utilities/` | Cross-cutting rules | `animations.css`, `responsive.css` |

#### Scenario: All original selectors are preserved in new files

- GIVEN the original `style.css` contains N unique selectors
- WHEN the file is split into modular files
- THEN every original selector appears in exactly one new file
- AND the total selector count across all new files equals N

#### Scenario: No selector appears in multiple files

- GIVEN two modular CSS files from different directories
- WHEN comparing their selectors
- THEN no selector is duplicated across files

### Requirement: CSS Cascade Load Order

The system SHALL load CSS modules in a fixed cascade order to preserve specificity: base → components → layout → views → utilities. View-specific stylesheets SHALL be loaded after shared stylesheets so view rules override shared rules when needed.

#### Scenario: Shared styles load before view styles

- GIVEN a view template (e.g., landing page)
- WHEN CSS link tags are rendered
- THEN `base/` files load first, followed by `components/`, `layout/`, `utilities/`
- AND the view-specific file (`views/landing.css`) loads last

#### Scenario: Each view loads only its required CSS

- GIVEN the dashboard view
- WHEN the page renders
- THEN `views/dashboard.css` is loaded
- AND `views/landing.css` is NOT loaded
- AND `views/auth.css` is NOT loaded

### Requirement: CSS Custom Property Naming Convention

The system SHALL use kebab-case prefixed with `--color-`, `--spacing-`, or `--font-` for all CSS custom properties in `base/tokens.css`. Existing custom properties (`--color-primario`, `--color-secundario`, `--color-acento`, `--color-fondo-claro`, `--color-blanco`) SHALL remain unchanged.

#### Scenario: Token file contains all design tokens

- GIVEN the `base/tokens.css` file
- WHEN the file is created
- THEN it contains all `:root` custom properties from the original `style.css`
- AND no other CSS rules exist in this file

### Requirement: File Naming Convention

The system SHALL name CSS files using kebab-case matching their semantic purpose. File names SHALL match the view or component they style (e.g., `dentistList.ejs` → `dentists.css`, not `dentist-list.css`).

#### Scenario: View CSS file matches view directory name

- GIVEN a view directory `src/views/dentists/`
- WHEN a view-specific CSS file is created
- THEN the file is named `views/dentists.css`

### Requirement: Original style.css Decommissioned

The system SHALL remove `frontend/public/css/style.css` after all its selectors are distributed to modular files. The file SHALL NOT remain as an empty shell or with leftover rules.

#### Scenario: style.css is fully decomposed

- GIVEN the modular CSS files are created and verified
- WHEN the refactor is complete
- THEN `style.css` no longer exists in `frontend/public/css/`
- AND `head.ejs` no longer references `style.css`

### Requirement: Template CSS Reference Updates

The system SHALL update `head.ejs` and any view templates that reference `style.css` to load the appropriate modular CSS files instead. Bootstrap CDN and `normalize.css` references SHALL remain unchanged.

#### Scenario: head.ejs loads base and shared CSS

- GIVEN the `head.ejs` partial
- WHEN rendered for any view
- THEN it loads `base/tokens.css`, `base/layout.css`, and shared component/layout CSS
- AND Bootstrap CDN and normalize.css references are preserved

#### Scenario: View-specific CSS loaded via extraStylesheets

- GIVEN a view that needs page-specific styles
- WHEN the view sets `extraStylesheets`
- THEN the corresponding `views/*.css` file is loaded via the existing `extraStylesheets` mechanism

## MODIFIED Requirements

### Requirement: CSS Import Cascade Relationship

The existing single-file cascade (all rules in `style.css`, loaded after `normalize.css` and before Bootstrap) SHALL be replaced by a multi-file cascade where load order in HTML determines specificity, not `@import` statements.

(Previously: All CSS rules in one file, cascade determined by rule order within the file)

#### Scenario: Cascade behavior is identical after refactor

- GIVEN a selector that exists in both old `style.css` and new modular files
- WHEN the page renders with new CSS structure
- THEN the computed styles match the original `style.css` output
- AND no visual difference is detectable

#### Scenario: Bootstrap overrides preserved

- GIVEN custom rules that override Bootstrap defaults (e.g., `.btn-primary`, `.navbar`)
- WHEN loaded in the new modular structure
- THEN the override behavior is identical to the original file
- AND Bootstrap CDN remains untouched

## REMOVED Requirements

### Requirement: Monolithic CSS File

(Reason: Single 1753-line file is unmaintainable — changing one component requires scanning the entire file)
(Migration: All selectors distributed to categorized modules under `base/`, `components/`, `layout/`, `views/`, `utilities/`)
