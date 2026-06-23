# Per-Entity Init Wiring Specification

## Purpose

Establishes the unified single-listener pattern for each entity (Appointment, Patient, Dentist, Auth) where exactly one `DOMContentLoaded`-triggered code path instantiates and initializes that entity's controller. The canonical module exports a named, idempotent init function; wrappers import and call it instead of running their own competing instantiation.

## Overview

Previously, each entity had TWO independent `DOMContentLoaded` listeners:
1. One in the canonical `{entity}/modules/index.js` — auto-ran on page load, instantiated the controller, published `window.{entity}Controller`
2. One in each wrapper file (`{entity}-list-controller.js`, etc.) — also auto-ran, also instantiated, also published — race condition with (1)

This spec defines the unified pattern: exactly one listener performs construction and init; the other becomes a thin delegator calling an exported init function from the canonical.

## ADDED Requirements

### Requirement: Single Controller-Init Path Per Entity

For each entity (Appointment, Patient, Dentist, Auth), exactly one `DOMContentLoaded`-triggered code path MUST instantiate and initialize that entity's controller. No second, independent `DOMContentLoaded` listener (in the canonical `modules/index.js` and any of its wrapper files) MAY also instantiate and `init()` the controller.

#### Scenario: Only one listener performs controller construction

- GIVEN the Dentist entity's canonical file and its 2 wrapper files
- WHEN the page loads and `DOMContentLoaded` fires
- THEN exactly one code path executes `new DentistController()` followed by `controller.init()`
- AND no other listener among the 3 files independently repeats that construct-and-init sequence

#### Scenario: Wrapper delegates instead of duplicating init logic

- GIVEN a wrapper file for any entity (e.g. `appointment-list-controller.js`)
- WHEN inspecting its `DOMContentLoaded` handler
- THEN it calls the canonical module's exported init function (e.g. `initAppointmentController()`)
- AND it does not contain its own `new <Entity>Controller()` + `.init()` sequence outside that call

### Requirement: Exported Init Function Is Idempotent

Each canonical `modules/index.js` MUST export a named init function for its entity. Calling this function multiple times (e.g. once from the canonical module's own bootstrap path, if any remains, and once from a wrapper) MUST be idempotent: subsequent calls MUST return the existing controller instance and MUST NOT construct a second instance or re-run `init()` on it.

#### Scenario: Second call reuses the existing instance

- GIVEN `initDentistController()` has already run once and published `window.dentistController`
- WHEN `initDentistController()` is called a second time
- THEN it returns the same `window.dentistController` instance
- AND it does not construct a new `DentistController` instance
- AND it does not call `init()` again on the existing instance

#### Scenario: Publish-before-init ordering is preserved

- GIVEN `initPatientController()` is invoked and no instance exists yet
- WHEN it constructs the controller
- THEN it assigns the instance to `window.patientController` BEFORE awaiting `controller.init()`
- AND this ordering prevents a concurrent caller from constructing a second instance during the `init()` await

### Requirement: No Observable Runtime Surface Change

The wiring mechanism (how/where the controller is constructed and initialized) MAY change. The set of `window.*` globals published by each entity, their names, and their externally observable behavior MUST NOT change as a result of this migration. No global MUST be added, removed, renamed, or have its calling contract altered.

#### Scenario: Same global names exist after migration

- GIVEN the list of `window.*` globals published by the Dentist entity before migration
- WHEN the migration (single-listener delegation) is applied
- THEN the exact same set of global names is published after migration
- AND each global is still a function (or value) with the same signature and return behavior as before

#### Scenario: Page glue functions unaffected

- GIVEN a wrapper-only global not owned by the canonical module (e.g. `window.refreshDentists` in `dentist-controller.js`)
- WHEN the migration moves controller construction into the canonical module's exported init
- THEN `window.refreshDentists` and other wrapper-owned globals remain defined, in the same file, with unchanged behavior

### Requirement: Auth Initializes Correctly From Both Entry Points

The Auth controller MUST initialize correctly whether the page reaches it via the sitewide `head.ejs` `<script type=module>` tag (present on every page) or via a per-page wrapper flow (`login-controller.js`, `register-controller.js`). Regardless of which mechanism `sdd-design` selects, exactly one fully-initialized `window.authController` instance MUST exist after page load on every page type (auth pages and non-auth pages alike), and auth-dependent globals (`window.isAuthenticated`, `window.getCurrentUser`, `window.isAdmin`, `window.login`, `window.register`, `window.logout`) MUST be callable and correct on all pages.

#### Scenario: Auth initializes on a non-auth page via the sitewide tag

- GIVEN a non-auth page (e.g. `/dentists`) that only loads `auth/modules/index.js` via `head.ejs`
- WHEN the page finishes loading
- THEN `window.authController` is defined and initialized
- AND `window.isAuthenticated()` returns the correct session state

#### Scenario: Auth initializes on the login page via the wrapper flow

- GIVEN the `/users/login` page, which loads both `head.ejs` (sitewide auth tag) and `login-controller.js`
- WHEN the page finishes loading
- THEN exactly one `window.authController` instance exists (not two competing instances)
- AND `window.login(credentials)` is callable and resolves using that single instance

#### Scenario: No second independent Auth listener remains

- GIVEN the migrated Auth entity (canonical + `login-controller.js` + `register-controller.js`)
- WHEN inspecting all `DOMContentLoaded` listeners across the 3 files
- THEN only one of them performs the construct-and-init sequence for `AuthController`
- AND any other listener that previously duplicated it now either delegates to the same init path or has been removed
