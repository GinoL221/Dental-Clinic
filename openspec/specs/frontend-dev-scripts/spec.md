# frontend-dev-scripts Specification

## Purpose
Integrate frontend formatting actions into standard package manager scripts for developer convenience.

## Requirements

### Requirement: Formatting NPM Scripts
The system MUST define npm scripts in `frontend/package.json` to execute format and format check actions.

#### Scenario: Format Execution via Script
- GIVEN the `format` script is defined as `prettier --write` for JS, JSON, CSS, and MD
- WHEN `npm run format` is executed
- THEN Prettier MUST format all target files and exit with code 0.

#### Scenario: Format Check Execution via Script
- GIVEN the `format:check` script is defined as `prettier --check` for JS, JSON, CSS, and MD
- WHEN `npm run format:check` is executed
- THEN Prettier MUST verify style compliance without modifying files and return non-zero exit code if violation exists.
