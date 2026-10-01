# API response contract

## Intent
Fix audit F03: successful mutations with text or empty bodies must not be reported as failures. Preserve JSON results and HTTP error metadata and plain-text error messages. Reject malformed declared JSON successes.

## Scope and constraints
Implementation: frontend/src/lib/api.js and frontend/src/lib/api.test.js only. Backend unchanged. No audit closure, formatting sweep, E2E, dependency upgrades, commit or push authorized.
Strict TDD: explicit user selection. Runner: `cd frontend && npm test`.
Route: delegated worker (two non-trivial files); independent verifier. Authored candidate: 179 changed lines; strategy ask-on-risk.

## Tasks
- [x] T1 Implement and verify response parsing and regression tests.
- [x] T2 Run check/typecheck and independent contract verification; inspect generated artifacts.
- [x] T3 Complete native review and report candidate and outstanding checks.
- [ ] T4 Commit work unit only after explicit user authorization; branch before commit. This delivery gate remains pending.

## Evidence
Worker RED/GREEN rounds: initial 3 regressions, then 2 correction regressions, then 3 edge cases. Initial parent readback found text-error message loss and silent malformed JSON fallback; independent verification found mixed-case Content-Type and null error-body failures. All addressed before native freeze.
Final verification by gentle-ai-verify: npm test exit 0 (119 tests, 18 files; 14 API tests); npm run check exit 0 (0 errors/warnings); npm run typecheck exit 0; git diff --check exit 0.
Coverage includes JSON/+json, mixed-case media types, text, empty 200/204, error metadata, null/malformed JSON errors, non-string messages, malformed successful JSON, network failures.
Native review review-8cfbf8f8ae945a43: medium, review-reliability, approved; exact acknowledgement completed, authority burned. Candidate contains only the two source/test files; tracking and generated report excluded.
.vitest/json/output.json is an untracked generated test report; not deleted, not part of candidate. No build, backend, browser E2E, MySQL or dependency scan run in this work unit.

## Process deviation
Tracking was created after initial source writes instead of before them. Work happened on main, without commit or branch. No retroactive claims; no push. Functional completion does not imply delivery completion.

## Next step
Ask user for commit authorization; isolate feature branch before committing. Do not include generated .vitest output. Outstanding audit items remain separate.
