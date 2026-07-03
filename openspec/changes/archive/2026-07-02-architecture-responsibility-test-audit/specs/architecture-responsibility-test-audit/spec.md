# Architecture Responsibility Test Audit Specification

## Purpose

Define the required outcomes for a diagnostic-first audit of Dental-Clinic architecture, responsibility boundaries, and tests. The audit MUST produce evidence-backed findings and future remediation slices without authorizing code remediation in this change.

## Requirements

### Requirement: Full-Stack Responsibility Boundary Audit

The system MUST produce an audit report that maps backend, frontend, and test responsibility boundaries with concrete evidence paths from the repository.

#### Scenario: Audit maps backend boundaries with evidence

- GIVEN the Dental-Clinic repository
- WHEN the diagnostic audit is performed
- THEN the audit report MUST identify backend controller, service interface, service implementation, repository, DTO, validation, security, dependency injection, and exception-handling boundaries
- AND each confirmed or suspected backend finding MUST include one or more repository paths as evidence
- AND findings MUST distinguish confirmed observations from areas requiring further verification

#### Scenario: Audit maps frontend boundaries with evidence

- GIVEN the Dental-Clinic repository
- WHEN the diagnostic audit is performed
- THEN the audit report MUST identify EJS presentation boundaries, browser module responsibilities, API-module usage, raw network-access locations, and global bootstrap or state usage
- AND each confirmed or suspected frontend finding MUST include one or more repository paths as evidence
- AND findings MUST distinguish presentation concerns from behavior, role, state, and API-access responsibilities

#### Scenario: Audit maps test boundaries with evidence

- GIVEN the Dental-Clinic repository
- WHEN the diagnostic audit is performed
- THEN the audit report MUST identify backend, frontend, integration, behavior, source-contract, security, and architecture-related test coverage areas
- AND each test finding MUST include existing test paths or explain why no matching test path was found

### Requirement: Alignment and Priority Classification

The system MUST classify audit findings by alignment with Gentleman Book principles and project rules, and MUST assign priority information suitable for future planning.

#### Scenario: Findings are classified against review lenses

- GIVEN collected evidence for an architecture, responsibility, or test concern
- WHEN the audit report records a finding
- THEN the finding MUST state whether it is aligned, partial, violation, unknown, or deferred
- AND the finding MUST cite the relevant Gentleman Book principle or project rule
- AND the finding MUST include enough rationale to explain why the classification was chosen

#### Scenario: Findings include planning priority

- GIVEN a recorded audit finding
- WHEN the audit report prioritizes it
- THEN the finding MUST include priority, confidence, impact, and estimated remediation size or review-size risk
- AND the report MUST separate high-confidence violations from lower-confidence risks that need more verification

### Requirement: Test Contract Recommendations

The system MUST identify tests to strengthen as architecture or behavior contracts before or alongside any future remediation.

#### Scenario: Backend test contracts are identified

- GIVEN backend responsibility findings
- WHEN future test opportunities are recommended
- THEN the audit report MUST identify candidate service/use-case behavior tests, controller boundary tests, security or validation tests, and architecture-boundary tests where applicable
- AND each recommendation MUST explain which behavior or boundary it would protect

#### Scenario: Frontend test contracts are identified

- GIVEN frontend responsibility findings
- WHEN future test opportunities are recommended
- THEN the audit report MUST identify candidate runtime behavior tests, API-module boundary tests, EJS presentation-boundary checks, or source-contract tests where applicable
- AND each recommendation MUST explain which behavior or boundary it would protect

#### Scenario: Test recommendations avoid incidental assertions

- GIVEN a proposed test contract
- WHEN the audit report explains the recommendation
- THEN the recommendation SHOULD prefer behavior and boundary guarantees over incidental implementation-shape assertions
- AND source-shape checks MAY be recommended only when they protect an explicit architecture boundary and are paired with behavior evidence when practical

### Requirement: Diagnostic-Only Remediation Gate

The system MUST keep this change diagnostic-first and MUST NOT authorize broad rewrites or code remediation without later user approval.

#### Scenario: Audit records non-goals and remediation gate

- GIVEN the diagnostic audit output
- WHEN the report describes future work
- THEN it MUST state that code remediation, CI changes, feature redesign, and large-scale architecture migration are out of scope for this change
- AND it MUST state that any remediation slice requires later user approval before implementation

#### Scenario: Audit avoids rewrite recommendations

- GIVEN a finding that could be addressed through major restructuring
- WHEN the audit report recommends future work
- THEN the recommendation MUST prefer incremental, evidence-backed slices over broad Clean Architecture rewrites, package-wide migrations, or cosmetic refactors
- AND it MUST preserve existing behavior unless a later approved remediation explicitly changes it

### Requirement: Reviewable Future Remediation Slices

The system MUST translate future remediation candidates into reviewable slices that respect the 400 changed-line review budget.

#### Scenario: Future slices include review boundaries

- GIVEN prioritized audit findings and test contract recommendations
- WHEN future remediation candidates are listed
- THEN each candidate slice MUST describe its intended outcome, evidence basis, required or recommended tests, likely affected areas, and review-size risk
- AND candidates expected to exceed the 400 changed-line budget MUST be split or marked as requiring a delivery decision before implementation

#### Scenario: Diagnostic tasks remain separate from remediation

- GIVEN the task plan derived from the audit specification
- WHEN tasks are created
- THEN diagnostic report tasks MUST be separate from future remediation tasks
- AND remediation tasks MUST remain unapproved candidates unless a later user decision authorizes them
