# Apply Progress: Harden Playwright E2E

## Status

- **Work unit**: PR 1A — E2E profile foundation and fail-closed boundary
- **Mode**: Strict TDD
- **Delivery**: stacked-to-main; PR 1A targets `main`
- **Tasks complete**: 1.1–1.2; PR1B tasks 1.3–1.4 remain deferred
- **Changed-line estimate**: measured against `main`; below the 400-line budget

## Split History

The original combined PR1 attempt passed its combined focused tests and runtime readiness check, but the maintainer rejected its 441-line total and explicitly split it. This PR1A preserves the original RED-before-GREEN chronology while removing all PR1B seed and authorization implementation/tests. PR1B remains concrete and unchecked in `tasks.md`.

## Completed Tasks

- [x] 1.1 RED tests for secret-safe validation, next UTC weekday slot, and non-H2 profile rejection.
- [x] 1.2 GREEN/REFACTOR H2 `e2e` profile, typed credential validation, profile boundary, and registration; no fixtures or authorization integration in PR1A.
- [ ] 1.3 PR1B RED integration evidence for seeded roles/appointment, `/api/auth/me`, appointment DTO persistence, and non-admin dashboard `403`.
- [ ] 1.4 PR1B GREEN/REFACTOR seed initializer and integration wiring.

## TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1 | `E2eSeedPropertiesTest`, `E2eProfileBoundaryTest` | Unit | N/A (new) | ✅ Compile failure before implementation | ✅ 3/3 passed | ✅ Missing credentials, weekend/weekday, H2/non-e2e paths | ✅ Spotless and pure boundary validation |
| 1.2 | `E2eSeedPropertiesTest`, `E2eProfileBoundaryTest` | Unit/runtime | ✅ Existing focused baseline passed | ✅ Tests referenced absent classes | ✅ 3/3 passed plus startup | ✅ H2 accepted and unsafe URL rejected | ✅ Boot 3 registration verified through runtime |
| 1.3 | Deferred PR1B | Integration | N/A | ⏸ Deferred by maintainer split | ⏸ Deferred | ⏸ Deferred | ⏸ Deferred |
| 1.4 | Deferred PR1B | Integration | N/A | ⏸ Deferred by maintainer split | ⏸ Deferred | ⏸ Deferred | ⏸ Deferred |

## Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command and exact result | `mvn -q -f backend/pom.xml '-Dtest=E2eSeedPropertiesTest,E2eProfileBoundaryTest' test` — exit 0; 3 tests, 0 failures, 0 errors |
| Runtime harness command/scenario and exact result | `SPRING_PROFILES_ACTIVE=e2e mvn -q -f backend/pom.xml spring-boot:run`; `GET http://127.0.0.1:8080/api/v3/api-docs` returned 200; process stopped cleanly; secret values were not printed |
| Rollback boundary | Revert `application-e2e.properties`, `E2eSeedProperties.java`, `E2eProfileConfiguration.java`, `E2eProfileBoundary.java`, the `spring.factories` registration, and the two focused unit tests; no seed or integration files belong to PR1A |

## Remaining Tasks

- [ ] 1.3–1.4 PR1B deterministic fixtures and authorization evidence
- [ ] 2.1–2.8 Process integration and evidence modes
- [ ] 3.1–3.4 Browser journeys
- [ ] 4.1–4.2 CI and hygiene
