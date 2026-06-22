# Duplicate `window.*` Assignment Guard Specification

## Purpose

A static-source Jest test that fails the build when two files in the same entity's canonical+wrapper file-set both assign the same `window.<name>` global, preventing reintroduction of the listener-race bug class.

## Requirements

### Requirement: Entity File-Set Definition

The guard MUST check exactly these file-sets, one per entity, as the single source of truth (no other file is in scope):

| Entity | Canonical | Wrappers |
|--------|-----------|----------|
| Appointment | `appointment/modules/index.js` | `appointment/appointment-controller.js`, `appointment/appointment-list-controller.js` |
| Patient | `patient/modules/index.js` | `patient/patient-add-controller.js`, `patient/patient-edit-controller.js`, `patient/patient-list-controller.js` |
| Dentist | `dentist/modules/index.js` | `dentist/dentist-controller.js`, `dentist/dentist-list-controller.js` |
| Auth | `auth/modules/index.js` | `auth/login-controller.js`, `auth/register-controller.js` |

All paths are relative to `frontend/public/js/`. `dentist/dentist-specialty-ui.js` and `dashboard/dashboard-controller.js` are NOT part of any entity file-set (no canonical/wrapper duplication risk for them) and MUST NOT be checked by this guard.

#### Scenario: Guard checks only the defined file-sets

- GIVEN the guard test runs
- WHEN it builds its list of files to scan
- THEN it scans exactly the 4 entity file-sets above (13 files total)
- AND it does not scan `dentist-specialty-ui.js` or `dashboard-controller.js`

### Requirement: Assignment Detection Rule

The guard MUST extract every top-level `window.<name> = <value>` assignment from each file's source text using a regex matching `window.<identifier> = ` regardless of the right-hand-side style, covering at minimum: arrow functions (`window.x = (id) => {...}`), async arrow functions (`window.x = async (id) => {...}`), function expressions (`window.x = function () {...}`), async function expressions (`window.x = async function () {...}`), and direct value/instance assignment (`window.x = new Foo()`, `window.x = someExpression`).

#### Scenario: Regex matches all real assignment styles present in source

- GIVEN `dentist/modules/index.js` containing `window.editDentist = (id) => this.editDentist(id);`
- AND `auth/modules/index.js` containing `window.login = async function (credentials) {`
- AND `dentist/dentist-controller.js` containing `window.dentistController = new DentistController();`
- WHEN the guard extracts assignments from each file
- THEN all three assignments are captured with their correct global name

#### Scenario: Guard ignores non-assignment window references

- GIVEN a file containing `if (window.dentistController) {` and `window.location.pathname`
- WHEN the guard extracts assignments
- THEN neither `window.dentistController` (read, not assignment) nor `window.location` is reported as an assignment from this line

### Requirement: Duplicate-Name Detection and Failure

For each entity's file-set, the guard MUST assert that no extracted global name is assigned in 2 or more files of that set. The guard MUST exempt singleton-instance globals (the controller-instance assignment per entity: `window.appointmentController`, `window.patientController`, `window.dentistController`, `window.authController`) from the cross-file duplicate check, because these are already protected by the existing check-before-create singleton guard (`if (window.xController) { ... } else { ... }`) and are EXPECTED to appear in both the canonical file and at least one wrapper by design. No other exemptions apply: the proposal's `window.currentSort`-style state-flag exemption does not apply to this codebase because no entity file-set contains a `window.currentSort` (or equivalent non-function state) assignment — confirmed by source inspection. If such an assignment is introduced later, it is NOT exempt and MUST be treated as a normal candidate for the duplicate check.

#### Scenario: Guard passes on current (post-collision-fix) source

- GIVEN the current state of all 4 entity file-sets (after commit 337d380)
- WHEN the guard test runs
- THEN it reports zero duplicate non-singleton global names
- AND the test suite passes

#### Scenario: Guard fails when a non-singleton global is duplicated

- GIVEN `dentist/modules/index.js` assigns `window.editDentist`
- AND `dentist/dentist-controller.js` also assigns `window.editDentist`
- WHEN the guard test runs
- THEN the test fails
- AND the failure message names the offending global (`editDentist`) and both files (`dentist/modules/index.js`, `dentist/dentist-controller.js`)

#### Scenario: Guard does not fail on the expected singleton duplication

- GIVEN `dentist/modules/index.js` assigns `window.dentistController` inside `getInstance()`
- AND `dentist/dentist-controller.js` also assigns `window.dentistController` inside its DOMContentLoaded handler
- WHEN the guard test runs
- THEN this pair is excluded from the duplicate check
- AND the test does not fail because of it

### Requirement: Actionable Failure Output

When the guard detects a violation, the failure message MUST be actionable without reading the test source: it MUST include the offending global name (e.g. `window.editDentist`) and the relative paths of the 2+ files where it is assigned.

#### Scenario: Failure message names global and files

- GIVEN a reintroduced duplicate `window.searchDentists` in both `dentist/modules/index.js` and `dentist/dentist-list-controller.js`
- WHEN the guard test fails
- THEN the assertion message contains the string `searchDentists`
- AND the assertion message contains both file paths
