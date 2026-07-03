# Design: Architecture, Responsibility, and Test Audit

## Change

`architecture-responsibility-test-audit`

## Scope

This design defines the methodology for a diagnostic-first, full-stack audit of Dental-Clinic architecture consistency, responsibility boundaries, and tests. It does not authorize code remediation, CI changes, feature redesign, or broad rewrites.

The future apply phase for this change should produce audit artifacts only. Any code remediation must be approved later as a separate slice or follow-up change.

## Design Goals

- Collect concrete repository evidence before classifying findings.
- Audit backend, frontend, and tests with the same evidence model.
- Map findings to Gentleman Book principles and `AGENTS.md` rules.
- Prioritize findings by impact, confidence, test gap, and review-size risk.
- Recommend future test-strengthening work before or alongside remediation.
- Keep recommendations incremental and reviewable under the 400 changed-line budget.
- Preserve existing behavior unless a later approved remediation explicitly changes it.

## Inputs and Review Lenses

### Required Inputs

- `openspec/changes/architecture-responsibility-test-audit/proposal.md`
- `openspec/changes/architecture-responsibility-test-audit/specs/architecture-responsibility-test-audit/spec.md`
- `openspec/changes/architecture-responsibility-test-audit/explore.md`
- `AGENTS.md`
- Representative source paths listed below

### Gentleman Book Lens

The audit applies these principles as diagnostic criteria, not as a rewrite mandate:

- Keep business/application decisions separate from transport, persistence, UI, and framework details.
- Keep controllers, routes, and views thin.
- Make responsibilities explicit and testable.
- Prefer behavior and boundary contracts over incidental source-shape assertions.
- Keep technology at the edges where practical.
- Improve incrementally; avoid architecture theater.

### Project Rules Lens

The audit must explicitly verify `AGENTS.md` expectations:

- Spring backend follows Controller → Service interface + implementation → Repository.
- API responses use DTOs; JPA entities are not exposed directly.
- Security uses backend `@PreAuthorize` annotations.
- Controllers use `@Valid` for request validation.
- Dependencies prefer constructor injection over field injection.
- Exception handling goes through `GlobalExceptionHandler`.
- EJS templates remain presentational.
- Client JavaScript is modular.
- API calls go through dedicated API modules.

## Audit Pipeline

### 1. Evidence Collection

Collect evidence before interpretation. The audit runner should inspect source and test files, then record observations in an evidence matrix.

Evidence collection must include:

- Repository path.
- Symbol or concern inspected.
- Responsibility category.
- Relevant rule or principle.
- Observation summary.
- Evidence type: direct source, test coverage, CI configuration, or absence evidence.
- Confidence: high, medium, or low.
- Notes for manual verification when evidence is incomplete.

Representative evidence already identified:

- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/AuthenticationController.java` injects `IUserRepository` directly alongside `AuthenticationService`, making it a candidate controller-to-repository boundary violation.
- `backend/src/main/java/com/dh/dentalClinicMVC/controller/SpecialtyController.java` is a positive controller/service/DTO/validation/security example.
- `backend/src/main/java/com/dh/dentalClinicMVC/controller/DashboardController.java` is a positive thin-controller and response DTO example.
- `backend/src/main/java/com/dh/dentalClinicMVC/exception/GlobalExceptionHandler.java` exists and should be checked against exception flows.
- Grep evidence found `@Autowired` in `DentistController`, `PatientController`, and `DashboardServiceImpl`, which must be classified against the constructor-injection rule.
- `frontend/src/views/dashboard/dashboard.ejs` initializes `window.serverData`, `window.currentUser`, and `window.isAdmin`, which must be classified as bootstrap data, view responsibility, or boundary leakage.
- `frontend/public/js/dashboard/dashboard-api.js` centralizes dashboard network access in an API module and is a positive API-boundary example.
- Grep evidence found raw `fetch` outside `frontend/public/js/api/` in auth and appointment modules; each instance must be classified as acceptable local adapter, migration candidate, or violation.
- `.github/workflows/ci.yml` must be inspected to confirm whether frontend tests are enforced.

### 2. Architecture Boundary Checks

Backend checks:

- Controllers should depend on service interfaces for this project, not repositories or concrete service implementations. Any concrete application-service exception must be recorded as a deviation with rationale.
- Service implementations own transaction/application orchestration boundaries where applicable.
- Repositories remain persistence adapters and should not be called from controllers.
- DTOs should protect API response boundaries; entity-shaped request bodies should be listed as suspected or confirmed gaps.
- Controller methods that mutate or validate request bodies should use `@Valid` where applicable.
- Protected endpoints should use `@PreAuthorize`, not rely only on frontend checks.
- Dependency injection should be constructor-based; field `@Autowired` should be classified as a project-rule violation unless there is a strong exception.
- Exceptions should be handled by `GlobalExceptionHandler` rather than ad hoc controller responses for domain/application failures.

Frontend checks:

- EJS templates should be presentational and should not own business decisions beyond rendering.
- `window.*` usage should be classified as bootstrap-only, shared state, global command wiring, or boundary leakage.
- Browser modules should have one clear responsibility: API access, state/data loading, rendering/UI management, orchestration, or utility.
- Raw network calls should preferably live in dedicated API modules. Raw `fetch` outside API modules should be reviewed for ownership and future migration risk.
- Role/state branching should be checked for whether it belongs in backend authorization, view rendering, or client orchestration.

Test checks:

- Backend tests should be mapped by type: service/use-case behavior, controller boundary, integration, security/authorization, validation, exception handling, and architecture-boundary checks.
- Frontend tests should be mapped by type: route behavior, jsdom runtime behavior, XSS/safety behavior, API-module boundaries, EJS presentation checks, source-contract checks, and global wiring guards.
- Source-shape tests should be accepted only when they protect explicit boundaries and, where practical, paired with runtime behavior evidence.
- CI should be checked for backend and frontend test execution coverage.

### 3. Responsibility Classification

Every inspected item should receive one classification:

- `aligned`: Evidence supports the rule/principle.
- `partial`: Direction is right, but gaps or mixed responsibilities remain.
- `violation`: Evidence shows a concrete rule/principle breach.
- `unknown`: Evidence is insufficient; follow-up verification is needed.
- `deferred`: Valid concern, but intentionally out of scope for this diagnostic slice.

Each classification must include:

- Evidence path(s).
- Rule or principle cited.
- Rationale.
- Confidence.
- Whether a test currently protects the behavior or boundary.

### 4. Test-Contract Mapping

For each confirmed or high-risk partial/unknown finding, map the missing or weak contract:

Backend contract categories:

- Service/use-case behavior tests for business rules and orchestration.
- Controller boundary tests for DTO shape, validation, status codes, and delegation boundaries.
- Security/authorization tests for protected endpoints and roles.
- Exception contract tests for `GlobalExceptionHandler` behavior.
- Architecture-boundary tests for controller → service → repository constraints.

Frontend contract categories:

- Runtime behavior tests for user-visible flows and DOM updates.
- API-module boundary tests for network access and error handling.
- EJS presentation-boundary checks for business/role/state logic leakage.
- Global-wiring/source-contract checks only when they protect explicit architecture boundaries.

The audit should not recommend tests merely to lock implementation trivia. Tests must explain the behavior or boundary they protect.

### 5. Priority Scoring

Each finding should be prioritized with a compact scoring model:

- `priority`: P0, P1, P2, or P3.
- `confidence`: high, medium, or low.
- `impact`: high, medium, or low.
- `test_gap`: none, weak, missing, or unknown.
- `review_size_risk`: low, medium, high, or requires-decision.
- `remediation_gate`: unapproved by default.

Recommended priority meanings:

- `P0`: High-confidence boundary or security/test-contract issue that can mislead maintainers or weaken correctness.
- `P1`: Responsibility leakage or test weakness with clear maintenance impact.
- `P2`: Improvement opportunity that strengthens consistency but is not urgent.
- `P3`: Deferred, cosmetic, or low-confidence concern.

### 6. Remediation Gate

The diagnostic apply phase must not modify application or test code. Future remediation candidates must be listed as unapproved backlog items.

A future remediation slice may be proposed only if it includes:

- Evidence basis.
- Intended outcome.
- Required or recommended tests.
- Likely affected areas.
- Estimated review-size risk.
- Rollback considerations.
- Statement that user approval is required before implementation.

## Output Artifacts for Future Tasks

Future tasks should produce these diagnostic artifacts:

### Audit Report

Suggested path: `openspec/changes/architecture-responsibility-test-audit/audit-report.md`

Required sections:

- Executive summary.
- Backend findings.
- Frontend findings.
- Test strategy findings.
- CI/test-enforcement findings.
- Prioritized top risks.
- Confirmed alignments worth preserving.
- Diagnostic-only remediation gate.

### Evidence Matrix

Suggested path: `openspec/changes/architecture-responsibility-test-audit/evidence-matrix.md`

Required columns:

| ID | Area | Path | Symbol/Concern | Rule/Principle | Evidence | Classification | Confidence | Test Coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

### Test-Strengthening Recommendations

Suggested path: `openspec/changes/architecture-responsibility-test-audit/test-recommendations.md`

Required fields per recommendation:

- Related finding ID.
- Contract type.
- Behavior or boundary protected.
- Candidate test location.
- Existing tests related to it.
- Whether it should precede remediation.

### Future Remediation Backlog / Slices

Suggested path: `openspec/changes/architecture-responsibility-test-audit/remediation-backlog.md`

Required fields per candidate slice:

- Slice title.
- Status: unapproved candidate.
- Evidence IDs.
- Intended outcome.
- Required tests.
- Affected areas.
- Review-size risk against 400 changed lines.
- Suggested sequencing.
- Rollback notes.

## Exact Inspection Areas

### Backend

Inspect:

- `backend/src/main/java/com/dh/dentalClinicMVC/controller/`
- `backend/src/main/java/com/dh/dentalClinicMVC/authentication/`
- `backend/src/main/java/com/dh/dentalClinicMVC/service/`
- `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/`
- `backend/src/main/java/com/dh/dentalClinicMVC/repository/`
- `backend/src/main/java/com/dh/dentalClinicMVC/dto/`
- `backend/src/main/java/com/dh/dentalClinicMVC/exception/`
- `backend/src/test/java/com/dh/dentalClinicMVC/`

Check:

- Controller/service/repository boundaries.
- Service interface and implementation usage.
- DTO boundaries for responses and request bodies.
- Auth/security annotations with `@PreAuthorize`.
- Validation with `@Valid`.
- Constructor injection versus field `@Autowired`.
- Exception handling through `GlobalExceptionHandler`.
- Backend integration/unit balance and missing service/use-case contracts.

### Frontend

Inspect:

- `frontend/app.js`
- `frontend/src/routes/`
- `frontend/src/controllers/`
- `frontend/src/middlewares/`
- `frontend/src/views/`
- `frontend/src/views/partials/`
- `frontend/public/js/`
- `frontend/public/js/api/`
- `frontend/public/js/auth/`
- `frontend/public/js/appointment/`
- `frontend/public/js/dashboard/`
- `frontend/test/`

Check:

- Express routes stay thin and delegate request handling to controllers/services instead of owning business rules.
- Express controllers do not duplicate backend/API responsibilities or hide domain decisions.
- Middleware responsibilities are explicit: authentication/session/user-data plumbing, not business workflows.
- EJS presentational boundaries.
- Role/state/business branching in templates.
- Client module responsibility boundaries.
- API module usage and raw `fetch` outside API modules.
- `window.*` bootstrap, shared state, and global command wiring.
- Runtime tests versus source-shape tests.

### CI and Test Enforcement

Inspect:

- `.github/workflows/ci.yml`
- `backend/pom.xml`
- frontend package/test configuration files if present.

Check:

- Backend test command coverage.
- Frontend test command coverage.
- Whether architecture/source-contract tests run in CI.
- Any known flakiness or missing setup that should keep CI changes deferred.

## Validation Approach for This Diagnostic Phase

The verify phase should validate artifact completeness, not application behavior changes.

Validation checks:

- Audit report exists and contains backend, frontend, test, and CI sections.
- Evidence matrix exists and each confirmed/suspected finding has path evidence or explicit absence evidence.
- Findings use only allowed classifications: aligned, partial, violation, unknown, deferred.
- Findings cite a Gentleman Book principle or `AGENTS.md` rule.
- Priority fields are present: priority, confidence, impact, test gap, review-size risk.
- Test recommendations map to findings and explain protected behavior/boundary.
- Remediation backlog is clearly marked as unapproved.
- No application, test, or CI source code is edited during the diagnostic apply phase.
- Recommendations avoid broad rewrites and preserve current behavior unless later approved.

Because this phase is diagnostic-only, no new tests are required now. Commands may be limited to read-only inspection and, if available, existing test-list or static search commands. If tests are run for discovery, their output should be recorded as evidence but failing tests must not trigger remediation in this change.

## Future Apply Constraints if Remediation Is Approved Later

- Use strict TDD where the project/session enables it.
- Add or strengthen the relevant behavior or architecture contract before changing risky behavior.
- Keep tests with the remediation work unit.
- Keep slices reviewable under the 400 changed-line budget; split or request a delivery decision when risk is high.
- Avoid broad rewrites, package-wide migrations, and cosmetic-only refactors.
- Preserve existing behavior unless the approved remediation explicitly changes it.
- Prefer constructor injection, DTO records or immutable DTOs where applicable, service-layer transaction boundaries, and backend authorization annotations.
- Do not push without user permission; do not reset without explicit permission.

## Decision Records

### DR-001: Diagnostic-only design

Decision: This change designs and later executes an audit, not remediation.

Rationale: The proposal and user decision explicitly require `solo diagnóstico`; implementing fixes now would widen scope and risk architecture theater.

Tradeoff: The project will keep known or suspected issues temporarily, but the next remediation decision will be evidence-backed.

### DR-002: Full-stack breadth before deep fixes

Decision: Audit backend, frontend, tests, and CI together before proposing fixes.

Rationale: Responsibility leaks can cross backend controllers, EJS templates, browser state, and tests. A full-stack map prevents fixing one layer while hiding rules in another.

Tradeoff: The audit may produce more findings than one remediation slice can handle, so scoring and review-size risk are mandatory.

### DR-003: Behavior and boundary contracts over incidental source shape

Decision: Prefer tests that protect behavior and explicit boundaries. Source-shape checks are allowed only when they guard a named architecture rule.

Rationale: Source-shape tests can create false confidence or brittle constraints. They are useful only when tied to an explicit rule such as no duplicate `window.*` ownership or no controller-to-repository dependency.

Tradeoff: Some architecture boundaries are easiest to detect structurally; those checks should be paired with behavior evidence where practical.

### DR-004: Avoid over-architecture

Decision: Do not recommend a wholesale Clean Architecture rewrite or package migration.

Rationale: Dental-Clinic is an existing Spring MVC + EJS application with useful structure already. Incremental corrections are safer and more reviewable.

Tradeoff: The architecture may remain mixed for a while, but changes stay focused on maintainability, testability, and real risk.

### DR-005: Test-first remediation later

Decision: Future remediation candidates should identify required or recommended tests before code changes.

Rationale: The user’s success metric is strengthened tests, especially architecture and behavior contracts.

Tradeoff: Some small mechanical cleanup may feel slower, but test-first sequencing prevents unverified reshaping.

## Rollout Plan

1. Tasks phase creates diagnostic tasks and a review workload forecast.
2. Apply phase, after approval, collects evidence and writes the audit artifacts only.
3. Verify phase checks completeness, traceability, classification quality, and no-remediation compliance.
4. User reviews the diagnostic output.
5. Any remediation proceeds only as a later approved work unit or SDD change.

## Risks and Mitigations

- False positives from source search: require path evidence, rationale, and confidence levels.
- Full-stack audit breadth: require priority scoring and split future remediation slices.
- Over-architecture: explicitly ban broad rewrites in this change.
- Test recommendations becoming implementation trivia: require each test to name the behavior or boundary protected.
- CI enforcement uncertainty: classify CI changes as future candidates unless explicitly approved.
