# prettier-frontend-format Specification

## Purpose
Enforce consistent style for frontend assets (JS, CSS, JSON, MD) and exclude template files.

## Requirements

### Requirement: Code Formatting
The system MUST support auto-formatting of JavaScript, CSS, JSON, and Markdown files using Prettier.

#### Scenario: Prettier Formatting Execution
- GIVEN a Prettier configuration with `singleQuote: true`, `trailingComma: "all"`, and `printWidth: 100`
- WHEN the Prettier command is run against JS, CSS, JSON, or MD files
- THEN those files MUST be formatted in place to match the configuration.

### Requirement: EJS File Exclusion
The system MUST NOT format or modify EJS template files.

#### Scenario: EJS Exclusion Rules
- GIVEN EJS template files in the project directories
- WHEN the Prettier format or check command is executed
- THEN EJS files MUST be excluded from processing and remain unmodified.
