# Date Utils Formatting Specification

## Purpose
Ensure options objects for date formatting functions are correctly cast to prevent overload resolution failures.

## Requirements

### Requirement: Formatting Option Casting
Options objects passed to date formatting functions MUST be cast to `Intl.DateTimeFormatOptions` using JSDoc type assertions.

#### Scenario: Overload Type Match
- GIVEN options passed to `date.toLocaleDateString`
- WHEN cast with `/** @type {Intl.DateTimeFormatOptions} */`
- THEN the compiler successfully matches the method overload with zero diagnostics
