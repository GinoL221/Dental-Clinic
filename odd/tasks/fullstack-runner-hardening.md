# Fullstack Runner Hardening (SIGINT/SIGTERM Cleanup)

Branch feat/fullstack-runner-hardening (from main c325c6f). Hardens `frontend/tests/fullstack/run-fullstack.js` by registering signal handlers (SIGINT, SIGTERM) to invoke `cleanupAll` on detached process groups, preventing orphaned processes on ports 8080 and 4173 (Phase 5 of project plan).

## Specs

- S1: `runFullstack` must register `SIGINT` and `SIGTERM` signal handlers on `process` that trigger `cleanupAll(children)` and terminate all spawned background processes before exit.
- S2: Signal listeners must be cleanly removed on normal completion, early exit, readiness timeout, or failure to avoid listener leaks across invocations.
- S3: In CLI mode and test runner, cancellation via signal must cleanly shut down and set exit code 128 + signal number (130 for SIGINT, 143 for SIGTERM) or propagate cancellation status.
- S4: Unit tests in `frontend/tests/fullstack/` must test signal handling, child cleanup invocation, and handler unhooking.
- S5: Full verification: all backend and frontend tests pass, typechecks and format checks clean.

## Tasks

- [x] T1 (S1, S2, S3) Implement signal trapping and cleanup in `runFullstack` — route: inline — commit: this commit
- [x] T2 (S4) Add unit tests for signal handlers and cleanup lifecycle — route: inline — commit: this commit
- [x] T3 (S5) Full test suite verification, typecheck, format, and reviewable commits — route: inline — commit: this closing commit

## Log

- L1: User approved Phase 5: "si" to create feat/fullstack-runner-hardening from main (c325c6f).
- L2: T1 implemented: runFullstack traps SIGINT and SIGTERM, terminates early exit race, invokes cleanupAll(children), returns 130/143 exit codes, and guarantees listener removal via try..finally.
- L3: T2 implemented: added 3 unit tests in process-runner.spec.js (runner-signal-1, runner-signal-2, runner-signal-3) covering SIGINT during readiness wait, SIGTERM during preparation, and zero listener leaks on completion.
- L4: Fixed occupyPort/releasePort in process-runner-fixtures.js to handle pre-occupied ports gracefully.
- L5: T3 verified: 14/14 process runner tests pass, 18/18 fullstack node tests pass, 132/132 frontend vitest tests pass, svelte-check 0 errors 0 warnings, 269/269 backend tests pass.
