# API Config Typing Specification

## Purpose
Break circular self-reference type inference in the API configuration module.

## Requirements

### Requirement: Explicit Configuration Type
The exported API configuration object in `apiConfig.js` MUST be annotated with an explicit JSDoc `@type` statement.

#### Scenario: Circular Inference Resolution
- GIVEN the configuration object in `apiConfig.js`
- WHEN typed explicitly using `@type` JSDoc annotations
- THEN circular type diagnostics (such as TS7022/TS2502) are resolved during compilation checks
