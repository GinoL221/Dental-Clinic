# Pre-commit repair

## Intent
Restore missing frontend/scripts/pre-commit.sh and provide opt-in reproducible installation for new clones. User authorized implementation; existing local hook already invokes the missing script.

## Constraints
Run npm test, npm run check, npm run typecheck in order; fail-fast and resolve frontend relative to script. No formatting gate (known separate failure), dependencies, hook override, actual repo config mutation or push. Existing API commit separately authorized. Strict TDD inherited explicit user choice; runner bash tools/tests/pre-commit.test.sh. User explicitly approved deletion only of new test-created temporary fixtures, guarded mktemp cleanup.
Routes: delegated scout, writer and independent verifier. Hook candidate 152 changed lines; ask-on-risk. Separate coherent tooling work unit.

## Tasks
- [x] H1 Gate, opt-in safe installer, docs and isolated shell regressions.
- [x] H2 Independent shell tests and real frontend gate verification.
- [x] H3 Native review and report tooling commit scope for authorization.
- [x] H4 User authorized separate tooling commit: 78c5be1 on fix/api-response-contract. Local pre-commit passed 119 tests, check and typecheck; no bypass or push.

## Implementation surfaces
frontend/scripts/pre-commit.sh
.githooks/pre-commit
tools/scripts/install-pre-commit.sh
tools/tests/pre-commit.test.sh
tools/package.json
README.md (hook instructions only)

## Evidence
Initial RED failed for missing gate; GREEN passed stub-npm order/cwd/fail-fast at each stage and disposable installer success/idempotency/conflict tests. Independent verifier found substring-based recognition and linked-worktree placement limitations; correction RED reproduced lookalike acceptance. Final tests pass exact bytes/executable permission and linked-worktree resolved Git hooks directory. Test fixtures cleanup scoped to newly created mktemp directory only.
Real sh frontend/scripts/pre-commit.sh passed:119 tests, check0 errors/warnings, typecheck exit0. Existing local hook and config untouched. It successfully ran these checks during authorized API commit 1e01696 on fix/api-response-contract; no bypass. API source/tests unchanged by tooling task.
Final independent bash tools/tests/pre-commit.test.sh and git diff --check exit0.
Native review review-377347843d931428: high tier, four lenses, approved, exact acknowledgement burned. Advisory nonblockers R2-001 (tracking evidence stale at freeze) and R3-001 installer lines4-11; no correction offered. Final verifier notes mkdir may precede configured hooksPath rejection; no actual install performed here. Findings remain informational follow-ups, not reasons to reopen review.
Generated .vitest report remains untracked and excluded. No full format-check, E2E, backend scanner, MySQL, push or installer execution in actual repo.

## Next step
Tooling committed as 78c5be1, API fix as 1e01696. Main untouched; feature branch not pushed. Publishing and remaining audit follow-ups require separate authorization.
