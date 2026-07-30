# Apply Progress: Harden Playwright E2E

## Status

- **Completed work units**: PR1A and PR1B
- **Current boundary**: PR1B targets `main` after PR1A merge
- **Mode**: Strict TDD
- **Tasks complete**: 1.1–1.4 of 18
- **Remaining**: PR2 tasks 2.1–2.8; PR3 tasks 3.1–3.4 and 4.1–4.2
- **Git accounting**: PR1B total 366 authored lines relative to `main`; this follow-up delta is 95 lines (both under their limits)

## Split History

The original combined PR1 attempt passed its combined focused tests and runtime readiness check, but the maintainer rejected its 441-line total and explicitly split it. PR1A was then implemented and merged first. PR1B contains only deterministic fixtures and backend authorization/persistence evidence.

## Cumulative TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATION | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1 | `E2eSeedPropertiesTest`, `E2eProfileBoundaryTest` | Unit | N/A (new) | Compile failure before implementation | 3/3 passed | Missing-value/secret case; unsafe e2e versus safe H2/non-e2e; Saturday versus weekday slot inputs | Spotless and pure boundary validation |
| 1.2 | `E2eSeedPropertiesTest`, `E2eProfileBoundaryTest` | Unit/runtime | Existing focused baseline passed | Absent production classes | 3/3 plus startup passed | H2 accepted and unsafe datasource rejected | Boot 3 registration verified by startup |
| 1.3 | `E2eProfileIntegrationTest` | Integration | N/A (new) | Initial RED: 4 tests, 2 failures, 2 errors; follow-up RED: 5 tests, 0 failures, 1 error before idempotency adjustment | 5/5 passed after adjustment | Normal minimum seed versus appointment-removal reinitialization; admin `/auth/me` versus patient `403`; persisted repository entity versus HTTP DTO representation | Shared login helper and repository assertions |
| 1.4 | `E2eProfileIntegrationTest` | Integration/runtime | 4/4 | Contract tests preceded initializer and adjustment | 5/5 plus runtime passed | Separate admin/non-admin JWT paths and two actual initializer states | Profile-only initializer; normal profiles unchanged |

### Triangulation Note

PR1A has the required alternate cases in its focused unit tests. PR1B now has two actual initializer cases: the normal minimum seed and reinitialization after removing the appointment. It also exercises separate authentication roles and persistence/HTTP evidence paths. The future-weekday calculation was already triangulated in PR1A.

## Work Unit Evidence — PR1A

| Evidence | Exact result |
|---|---|
| Focused test command | `mvn -q -f backend/pom.xml '-Dtest=E2eSeedPropertiesTest,E2eProfileBoundaryTest' test` — exit 0; 3 tests, 0 failures, 0 errors |
| Runtime command/scenario | `SPRING_PROFILES_ACTIVE=e2e mvn -q -f backend/pom.xml spring-boot:run` with required environment variables supplied; `GET http://127.0.0.1:8080/api/v3/api-docs` returned 200 |
| Cleanup/no-secret evidence | Spring process stopped cleanly; readiness diagnostics printed no credential values |
| Rollback boundary | Revert PR1A `application-e2e.properties`, typed configuration, boundary/configuration classes, `spring.factories` registration, and focused unit tests; leave application behavior untouched |

## Work Unit Evidence — PR1B

| Evidence | Exact result |
|---|---|
| RED command/result | Initial: `mvn -q -f backend/pom.xml -Dtest=E2eProfileIntegrationTest test` — exit 1; 4 tests, 2 failures, 2 errors. Follow-up idempotency RED: same command — exit 1; 5 tests, 0 failures, 1 error (`NoSuchElementException` after the second initializer call). |
| GREEN command/result | `mvn -q -f backend/pom.xml -Dtest=E2eProfileIntegrationTest test` — exit 0; 5 tests, 0 failures, 0 errors |
| Post-refactor command/result | `mvn -q -f backend/pom.xml '-Dtest=E2e*Test' test` — exit 0; 8 tests, 0 failures, 0 errors |
| Runtime command/scenario | `SPRING_PROFILES_ACTIVE=e2e mvn -q -f backend/pom.xml spring-boot:run` with required environment variables supplied; readiness returned 200, admin `/api/auth/me` returned 200, appointment DTO fields matched, and patient `/api/dashboard/snapshot` returned 403 |
| Cleanup/no-secret evidence | Spring process stopped cleanly after the harness; no credential values were printed |
| Rollback boundary | Revert `backend/src/main/java/com/dh/dentalClinicMVC/configuration/E2eDataInitializer.java`, `backend/src/test/java/com/dh/dentalClinicMVC/configuration/E2eProfileIntegrationTest.java`, and the PR1B task/progress edits; retain merged PR1A files |

### Idempotency Follow-up Evidence

- RED test added first: `reinitializingAfterAppointmentRemovalRestoresOneStableFixtureSet` deletes the persisted appointment, invokes the real `E2eDataInitializer` again, and asserts stable user/dentist/patient counts plus stable appointment fields.
- Minimum GREEN adjustment: when the admin already exists but the appointment set is empty, restore the appointment from the existing seeded patient and dentist instead of returning immediately.
- Follow-up delta remains below 150 authored lines; the cumulative PR1B diff remains below 400.

## Hybrid Persistence

- OpenSpec tasks: `openspec/changes/harden-playwright-e2e/tasks.md` — 1.1–1.4 checked; all PR2/PR3 tasks remain unchecked.
- OpenSpec progress: `openspec/changes/harden-playwright-e2e/apply-progress.md` — this cumulative artifact.
- Engram tasks: observation **#3471**, topic `sdd/harden-playwright-e2e/tasks`.
- Engram apply progress: observation **#3475**, topic `sdd/harden-playwright-e2e/apply-progress`.

## Changed-Line Evidence

The implementation candidate bytes were not changed by this correction. Documentation persistence was corrected only in `tasks.md` and this file. The existing candidate hash check remains the comparison boundary for the two implementation files; no test or runtime command was rerun during this correction.
