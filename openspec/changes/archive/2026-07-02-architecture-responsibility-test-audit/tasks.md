# Tasks: Architecture, Responsibility, and Test Audit

## Review Workload Forecast

| Field | Value |
| ------- | ------- |
| Estimated changed lines | 250-380 lines across diagnostic OpenSpec artifacts |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR / single diagnostic apply slice |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

## Apply Boundary

Only write files under `openspec/changes/architecture-responsibility-test-audit/` and update Engram SDD topics for this change. Do not edit application, test, CI, package, build, or workflow source files during this diagnostic apply phase.

Allowed diagnostic outputs:

- `openspec/changes/architecture-responsibility-test-audit/audit-report.md`
- `openspec/changes/architecture-responsibility-test-audit/evidence-matrix.md`
- `openspec/changes/architecture-responsibility-test-audit/test-recommendations.md`
- `openspec/changes/architecture-responsibility-test-audit/remediation-backlog.md`
- Engram topic updates for `sdd/architecture-responsibility-test-audit/*`

## Diagnostic Implementation Tasks

### 1. Reconfirm inputs and no-remediation boundary

- [x] Read `openspec/changes/architecture-responsibility-test-audit/proposal.md`, `openspec/changes/architecture-responsibility-test-audit/specs/architecture-responsibility-test-audit/spec.md`, `openspec/changes/architecture-responsibility-test-audit/design.md`, `openspec/changes/architecture-responsibility-test-audit/explore.md`, and `AGENTS.md` before collecting evidence.
- [x] Create `openspec/changes/architecture-responsibility-test-audit/audit-report.md` with an explicit diagnostic-only remediation gate stating that code, tests, CI, feature behavior, and broad architecture migrations are out of scope for this change.
- [x] Create `openspec/changes/architecture-responsibility-test-audit/evidence-matrix.md` with columns: `ID`, `Area`, `Path`, `Symbol/Concern`, `Rule/Principle`, `Evidence`, `Classification`, `Confidence`, `Test Coverage`, `Notes`.

### 2. Collect backend architecture and responsibility evidence

- [x] Inspect `backend/src/main/java/com/dh/dentalClinicMVC/controller/`, `backend/src/main/java/com/dh/dentalClinicMVC/authentication/`, `backend/src/main/java/com/dh/dentalClinicMVC/service/`, `backend/src/main/java/com/dh/dentalClinicMVC/service/impl/`, `backend/src/main/java/com/dh/dentalClinicMVC/repository/`, `backend/src/main/java/com/dh/dentalClinicMVC/dto/`, and `backend/src/main/java/com/dh/dentalClinicMVC/exception/` without editing them.
- [x] Record backend findings for controller-to-service-interface dependencies, controller-to-repository bypasses, concrete service dependencies, DTO/request-response boundaries, `@Valid`, `@PreAuthorize`, constructor injection versus field `@Autowired`, and `GlobalExceptionHandler` usage.
- [x] Classify each backend finding as `aligned`, `partial`, `violation`, `unknown`, or `deferred`, with confidence, path evidence, cited Gentleman Book principle or `AGENTS.md` rule, and whether an existing test protects the boundary.
- [x] Preserve the fixed design constraint that backend controllers must depend on service interfaces; any concrete service dependency exception must be recorded as a deviation, not normalized away.

### 3. Collect frontend server, EJS, and browser responsibility evidence

- [x] Inspect `frontend/app.js`, `frontend/src/routes/`, `frontend/src/controllers/`, `frontend/src/middlewares/`, `frontend/src/views/`, `frontend/src/views/partials/`, `frontend/public/js/`, `frontend/public/js/api/`, `frontend/public/js/auth/`, `frontend/public/js/appointment/`, and `frontend/public/js/dashboard/` without editing them.
- [x] Record frontend findings for Express route thinness, controller responsibility, middleware responsibility, EJS presentational boundaries, role/state branching, `window.*` bootstrap or shared state, raw `fetch` outside API modules, and browser module single-responsibility boundaries.
- [x] Classify each frontend finding as `aligned`, `partial`, `violation`, `unknown`, or `deferred`, with confidence, path evidence, cited Gentleman Book principle or `AGENTS.md` rule, and whether an existing test protects the boundary.

### 4. Collect test strategy and CI evidence

- [x] Inspect `backend/src/test/java/com/dh/dentalClinicMVC/`, `frontend/test/`, `.github/workflows/ci.yml`, `backend/pom.xml`, and frontend package/test configuration files without editing them.
- [x] Record test findings by category: backend service/use-case behavior, controller boundary, integration, security/authorization, validation, exception handling, architecture-boundary checks, frontend route behavior, jsdom runtime behavior, XSS/safety behavior, API-module boundaries, EJS presentation checks, source-contract checks, and CI enforcement.
- [x] Distinguish behavior/boundary contract coverage from incidental source-shape assertions, and mark source-shape tests as acceptable only when they protect an explicit architecture rule.

### 5. Produce the audit report

- [x] Complete `openspec/changes/architecture-responsibility-test-audit/audit-report.md` with sections for executive summary, backend findings, frontend findings, test strategy findings, CI/test-enforcement findings, prioritized top risks, confirmed alignments worth preserving, and diagnostic-only remediation gate.
- [x] Ensure each confirmed or suspected finding references one or more evidence IDs from `openspec/changes/architecture-responsibility-test-audit/evidence-matrix.md`, or explicitly records absence evidence where no matching file/test exists.
- [x] Include priority fields for findings: priority (`P0`-`P3`), confidence, impact, test gap, review-size risk, and remediation gate status.

### 6. Produce test-strengthening recommendations

- [x] Create `openspec/changes/architecture-responsibility-test-audit/test-recommendations.md` mapping findings to candidate backend service/use-case behavior tests, controller boundary tests, security/validation tests, exception contract tests, architecture-boundary tests, frontend runtime behavior tests, API-module boundary tests, EJS presentation-boundary checks, and guarded source-contract tests.
- [x] For every recommendation, state the related finding ID, contract type, behavior or boundary protected, candidate test location, existing related tests, and whether the test should precede remediation.
- [x] Verify recommendations prioritize behavior and explicit architecture boundaries over implementation trivia.

### 7. Produce future remediation backlog as unapproved candidates

- [x] Create `openspec/changes/architecture-responsibility-test-audit/remediation-backlog.md` with only future, unapproved remediation candidates; do not include approved implementation tasks.
- [x] For each candidate slice, record title, status `unapproved candidate`, evidence IDs, intended outcome, required tests, affected areas, review-size risk against 400 changed lines, suggested sequencing, rollback notes, and explicit user-approval requirement.
- [x] Split or flag any candidate likely to exceed 400 changed lines as requiring a future delivery decision before implementation.
- [x] Avoid broad Clean Architecture rewrites, package-wide migrations, feature redesign, cosmetic-only refactors, and behavior changes unless a later approved remediation explicitly authorizes them.

### 8. Validate diagnostic-only compliance

- [x] Confirm the apply diff only contains files under `openspec/changes/architecture-responsibility-test-audit/` plus Engram topic updates.
- [x] Confirm no files under `backend/src/main/`, `backend/src/test/`, `frontend/`, `.github/workflows/`, package/build files, or CI configuration were edited.
- [x] Confirm `audit-report.md`, `evidence-matrix.md`, `test-recommendations.md`, and `remediation-backlog.md` exist and cross-reference each other consistently.
- [x] Confirm every finding uses only allowed classifications: `aligned`, `partial`, `violation`, `unknown`, or `deferred`.
- [x] Confirm remediation candidates remain marked `unapproved candidate` and do not instruct apply to implement fixes in this change.

## Verification Notes

- No new application tests are required for this diagnostic-only apply phase.
- Existing tests may be listed or run only for evidence discovery; failing tests must be recorded as evidence and must not trigger remediation during this change.
- The verify phase should validate artifact completeness, traceability, classification quality, future-slice reviewability, and no-remediation compliance.
