# Proposal: Architecture, Responsibility, and Test Audit

## Change

`architecture-responsibility-test-audit`

## Intent

Create a diagnostic-first SDD change that audits whether Dental-Clinic is consistent in architecture, responsibility boundaries, and testing discipline, using Gentleman Book recommendations and the project `AGENTS.md` rules as the review lens.

This proposal intentionally does not authorize code remediation. It defines the audit, the evidence to collect, the contracts to specify, and the task plan needed to produce prioritized findings and future remediation slices. Any implementation fixes must be approved in a later phase or follow-up change.

## Problem Statement

Dental-Clinic has meaningful architecture work already in place: Spring MVC layers, service interfaces and implementations, repositories, DTOs, modular frontend JavaScript, and a non-trivial test suite. The exploration also found signs of inconsistency:

- Backend controllers may bypass service boundaries in at least one candidate area.
- Some request/response boundaries may still expose entity-shaped data instead of explicit DTO contracts.
- Frontend EJS templates and browser modules may mix presentation, role/state decisions, bootstrap data, and API access responsibilities.
- Tests exist, but coverage appears uneven: many backend tests are integration-oriented, some frontend architecture tests are source-shape checks, and behavior/architecture contracts can be strengthened.

The business problem is not that the application needs a wholesale rewrite. The problem is that architectural expectations are currently easier to state than to verify consistently. Without an evidence-backed audit, fixes risk becoming subjective, over-engineered, or scattered.

## Goals

- Produce a full-stack architecture, responsibility, and test audit for the current project state.
- Identify concrete alignment and gaps against Gentleman Book principles and `AGENTS.md` rules.
- Prioritize findings by impact, confidence, risk, and review size.
- Define architecture and behavior contracts that can be validated by tests.
- Recommend future remediation slices that are incremental, evidence-backed, and reviewable under the 400 changed-line budget.
- Strengthen the planning path toward tests that verify behavior and boundaries, not only source shape.

## Non-Goals

- Do not implement remediation in this proposal phase.
- Do not promise a full Clean Architecture rewrite or package-by-layer/package-by-feature migration.
- Do not replace the existing Spring MVC and EJS/JavaScript architecture wholesale.
- Do not change authentication, authorization, appointment, patient, dentist, dashboard, or frontend behavior as part of this diagnostic proposal.
- Do not add CI enforcement or new test suites until later phases explicitly scope and approve them.

## Scope Boundaries

### In Scope

- Backend Spring Boot architecture audit:
  - Controller → Service interface/implementation → Repository boundaries.
  - DTO usage at API boundaries.
  - Validation with `@Valid`.
  - Backend authorization with `@PreAuthorize`.
  - Constructor injection.
  - Exception handling through `GlobalExceptionHandler`.
  - Service/application behavior test gaps.

- Frontend architecture audit:
  - EJS presentational boundary.
  - Client-side module responsibilities.
  - Raw `fetch` usage versus dedicated API modules.
  - Global `window.*` bootstrap/state usage.
  - Runtime behavior tests versus source-shape tests.

- Test strategy audit:
  - Existing backend integration, controller, security, and service-level coverage.
  - Existing frontend route, jsdom, XSS, SRP/source-contract, and behavior coverage.
  - Missing or weak architecture/behavior contracts.
  - Candidate test contracts for future remediation.

### Out of Scope for This Immediate Change

- Code remediation without later user approval.
- Large-scale architectural migration.
- Feature redesign.
- Performance tuning unrelated to responsibility/test boundaries.
- Cosmetic refactors that do not improve architecture, responsibility clarity, or test confidence.

## Affected Areas

- `backend/src/main/java/com/dh/dentalClinicMVC/controller/`
- `backend/src/main/java/com/dh/dentalClinicMVC/service/`
- `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/`
- `backend/src/main/java/com/dh/dentalClinicMVC/repository/`
- `backend/src/main/java/com/dh/dentalClinicMVC/dto/`
- `backend/src/test/java/com/dh/dentalClinicMVC/`
- `frontend/src/views/`
- `frontend/public/js/`
- `frontend/test/`
- `.github/workflows/ci.yml`
- Project guidance in `AGENTS.md`

## Relationship to Gentleman Book Principles

This change applies Gentleman Book principles as audit criteria, not as a mandate to overbuild:

- Separate business/application decisions from framework, persistence, UI, and transport details.
- Keep controllers, routes, and views thin.
- Make responsibilities explicit and testable.
- Prefer behavior contracts over incidental source-shape assertions.
- Keep technology at the edges where practical.
- Improve incrementally and avoid architecture theater.

The expected outcome is a practical, prioritized audit that helps the project become easier to maintain, test, and evolve.

## Relationship to `AGENTS.md` Rules

The audit must explicitly verify the project rules:

- Backend follows Controller → Service interface + implementation → Repository.
- API responses use DTOs and do not expose JPA entities directly.
- Security rules use `@PreAuthorize`, not only frontend checks.
- Controllers use `@Valid` for request validation.
- Dependencies use constructor injection.
- Exception handling goes through `GlobalExceptionHandler`.
- Express routes stay thin where applicable.
- EJS templates remain presentational.
- Client-side JavaScript stays modular.
- API calls go through dedicated API modules.

## Audit Outcomes / User Stories

- As the maintainer, I want a prioritized architecture audit so I know which boundary issues are real, risky, and worth fixing first.
- As the maintainer, I want test gaps mapped to behavior and architecture contracts so future fixes strengthen confidence instead of only reshaping code.
- As the maintainer, I want backend and frontend responsibilities reviewed together so full-stack flows do not hide business rules in controllers, templates, or ad hoc browser state.
- As the maintainer, I want future remediation slices to be small and evidence-backed so I can approve implementation without accepting a rewrite.

## Success Criteria

- The spec phase defines verifiable architecture and responsibility contracts for backend, frontend, and tests.
- The design phase proposes an audit method that records evidence, severity, confidence, and future remediation boundaries.
- The task phase produces diagnostic tasks first, then clearly separates any future remediation candidates.
- Findings distinguish confirmed violations from risks requiring further verification.
- Recommended future fixes include corresponding behavior or architecture-contract tests.
- Test recommendations prioritize stronger contracts: service/use-case behavior, controller boundary behavior, frontend runtime behavior, API module boundaries, and architecture rules.
- The plan avoids over-architecture and preserves existing working behavior unless later implementation explicitly changes it.

## Risks and Tradeoffs

- **Over-architecture risk:** Applying Gentleman Book ideas too rigidly could create unnecessary abstractions. Mitigation: prioritize incremental improvements with explicit evidence and user value.
- **False-positive audit risk:** Source-shape checks can mislabel acceptable implementation details as violations. Mitigation: pair structural checks with behavior evidence and manual review.
- **Under-scoped test risk:** Focusing only on architecture tests may miss behavior regressions. Mitigation: require future remediation slices to include behavior contracts where behavior is affected.
- **Full-stack breadth risk:** Auditing backend, frontend, and tests can grow large. Mitigation: rank findings and keep remediation gated behind later approval.
- **CI cost/stability risk:** Adding frontend CI may be valuable but could introduce flakiness. Mitigation: treat CI enforcement as a candidate follow-up unless explicitly approved.

## Rollback / Reversal Plan

This proposal phase only creates planning artifacts, so rollback is limited to removing or revising the SDD artifacts:

- `openspec/changes/architecture-responsibility-test-audit/proposal.md`
- Engram topic `sdd/architecture-responsibility-test-audit/proposal`

Future implementation slices must define their own rollback plans and keep tests with the code they validate.

## Proposed Phased Path

1. **Spec phase**
   - Convert this proposal into explicit acceptance criteria for the audit.
   - Define backend, frontend, and test-contract rules to verify.
   - Define finding categories such as aligned, partial, violation, unknown, and deferred.

2. **Design phase**
   - Design the audit workflow and evidence model.
   - Define how findings will be prioritized by severity, confidence, business risk, test gap, and estimated remediation size.
   - Define how future remediation slices should be separated from diagnostic tasks.

3. **Tasks phase**
   - Create diagnostic-first tasks to inspect architecture, responsibilities, and tests.
   - Produce a review workload forecast.
   - Separate future remediation candidates from immediate audit deliverables.

4. **Apply phase, only after later approval**
   - Execute the diagnostic audit tasks.
   - Record findings and recommended future slices.
   - Do not remediate code unless the user explicitly approves a remediation slice.

5. **Verify phase**
   - Validate that the audit output satisfies the spec and that recommendations are evidence-backed, incremental, and test-centered.

## Open Decisions for Later Phases

- Whether frontend test execution should become part of CI in a later slice.
- Whether request DTO migration should target only confirmed entity-exposing endpoints or all CRUD boundaries.
- Whether EJS cleanup should start with role/state rendering or with JavaScript API-module boundaries.
- Whether architecture-contract tests should be implemented as source-level checks, runtime tests, ArchUnit-style backend tests, or a combination.
