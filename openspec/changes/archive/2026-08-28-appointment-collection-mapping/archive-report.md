# Archive Report — appointment-collection-mapping

## Status

PASS — archived after clean verify and full implementation completion.

## Change Summary

**Name:** `appointment-collection-mapping`  
**Type:** Backend refactor (pure internal behavior-preserving optimization)  
**Scope:** Extract duplicated `List<Appointment>` → `List<AppointmentDTO>` conversion logic from `AppointmentServiceImpl` into a new static mapper method `AppointmentResponseMapper.toDTOs(List<Appointment>)`.

## What Shipped

**Production Code Changes:**
- `AppointmentResponseMapper.java`: Added `public static List<AppointmentDTO> toDTOs(List<Appointment> appointments)` using an explicit `for`-loop into an un-presized `new ArrayList<>()`, delegating to existing `toDTO(Appointment)` for each element.
- `AppointmentServiceImpl.java`: Replaced two duplicated collection-mapping loops in `findAll()` (L201–207) and `findAllForCurrentUser()` (L227–231) with single-line delegations to `AppointmentResponseMapper.toDTOs(appointments)`. Removed unused `import java.util.ArrayList;` (L19). Role-dispatch block at L212–225 unchanged.

**Test Coverage:**
- `AppointmentResponseMapperTest.java`: Added 4 test cases covering empty input, multiple-element order preservation, DTO formatting delegation, and mutability validation.
- `AppointmentServiceImplTest.java` (new): Created 8 service-level characterization tests (JUnit 5 + Mockito) validating `findAll()` and `findAllForCurrentUser()` behavior against mocked repositories, with role-based routing and `StalePrincipalException` propagation verified.

**Total tests (new + modified):** 12 test cases  
**All backend tests:** 248/248 passing (reconfirmed by verify phase's independent `mvn -o clean test` run)

## Why This Change

Last duplicated collection-mapping logic remaining in `AppointmentServiceImpl` after the prior extraction series (`AppointmentSearchQuery`, `AppointmentScheduleValidator`, `AppointmentResponseMapper` — see commit 09e2077). Removing the duplication reduces maintenance drift risk and establishes the first direct unit test coverage for both `findAll()` and `findAllForCurrentUser()` methods, which previously had only indirect MockMvc coverage via `AppointmentControllerTest`.

## Spec Delta Determination

**Result:** No Spec Delta  
**Rationale:** This change preserves all observable behavior exactly:
- Method signatures unchanged (`findAll()`, `findAllForCurrentUser(String, Role)`, `toDTO(Appointment)`)
- DTO field mappings unchanged
- Iteration order preservation (repository order)
- Mutable return type (required by both call sites today)
- Role-based repository routing logic untouched
- Exception behavior preserved (`StalePrincipalException` on missing principal rows)
- Authorization layer unchanged (`@PreAuthorize` on `AppointmentController.findAll()`)

Grep verification across all `openspec/specs/**/spec.md` found zero requirement documents citing the internal loop structure as observable behavior. Therefore, no new or modified capability requirements exist to merge into the spec registry.

## Test Evidence

**Independent verification run (sdd-verify phase):**
- Full backend suite: `mvn -o clean test` → 248 tests, 0 failures, 0 errors, 0 skipped, BUILD SUCCESS
- Targeted suite: `mvn -o clean test -Dtest=AppointmentResponseMapperTest,AppointmentServiceImplTest` → 14/14 passing (8 service + 6 mapper)
- Code formatting: `mvn -o spotless:check` → 130 files clean, no violations
- Regression nets: `AppointmentControllerTest` 28/28 green, `AppointmentServiceCacheAnnotationsTest` 4/4 green

**Test strategy compliance:**
- Strict TDD enabled (`openspec/config.yaml`): RED (4 mapper test cases) → GREEN (mapper implementation) → CHARACTERIZATION (8 service tests against current loop-based code, must pass immediately) → REFACTOR (loop replacement, all prior tests must stay green unmodified) → VERIFY (full suite).
- All 12 tests survive the refactor with zero edits, confirming the pure-refactor claim.

## Scope Boundaries Honored

✅ Backend-only: No frontend files touched  
✅ No Flyway migrations: Database schema unchanged  
✅ No null/unrecognized-`Role` hardening: D2 feature (target 401 Unauthorized) deliberately deferred per design scope boundary  
✅ No commit/push performed: Working tree remains uncommitted for user review before git operations  
✅ Diff size: 265 changed lines (+10/−0 mapper, +2/−12 service, +81/−0 mapper test, +160 new service test) vs. 400-line review budget → Low risk, single PR

## Design Conformance

All design decisions honored:
- **D1:** Explicit `for`-loop into un-presized `new ArrayList<>()` (no `Collectors.toList()` / `Stream.toList()`, no presizing) — preserved mutability guarantee and null-on-null behavior.
- **Test location:** `AppointmentServiceImplTest` correctly placed in `backend/src/test/java/com/dh/dentalClinicMVC/service/impl/` (matching production package and sibling convention).
- **Mockito setup:** `@ExtendWith(MockitoExtension.class)` with real 5-arg constructor, no `@InjectMocks`, strict stubs — validated against current `DashboardServiceImplTest` pattern.
- **No test edits during refactor:** All assertions in `AppointmentServiceImplTest` reference only externally observable behavior (counts, DTO field order, role routing, exceptions) and never mention `toDTOs` or `ArrayList`, making the test suite a genuine black-box specification that survives the loop replacement unchanged.

## Recommended Follow-Up Work

**Title:** `appointment-role-null-hardening` (or similar)  
**Scope:** Implement D2 — the null/unrecognized-`Role` defensive hardening for `findAllForCurrentUser()`'s `else` branch to return 401 Unauthorized instead of silently granting global access.  
**Rationale:** `users.role` is DB-nullable with no null-guard in the current code, creating a potential authorization bypass. The target response is specified in `openspec/specs/stale-principal-resolution/spec.md`. This should be proposed as a separate change with its own proposal/spec/design/tasks cycle to maintain SDD hygiene and allow independent risk/test review.  
**Status:** Not blocking this archive; purely an accepted future optimization aligned with existing spec contract.

## Artifacts Read (Engram Observation IDs)

- Proposal: #6840
- Spec (No Delta Determination): #6841
- Design: #6843
- Tasks (Strict TDD ordering): #6844
- Apply Progress: #6850
- Verify Report (PASS, 0 CRITICAL, 0 WARNING): #6853

## Archive Metadata

- **Archive Date:** 2026-08-28
- **Archive Path:** `openspec/changes/archive/2026-08-28-appointment-collection-mapping`
- **Artifact Store:** hybrid (Engram + OpenSpec files)
- **Phase Completion:** All 5 SDD phases (propose, spec, design, tasks, apply) + verify, now archived
- **Skill Resolution:** paths-injected (`~/.config/opencode/skills/{spring-boot-3,java-21}/SKILL.md`)
- **Delivery Status:** Working tree uncommitted; ready for user's git commit/push authorization

## Next Recommended Action

None for this change. Cycle is complete. Follow-up item flagged above is independent and should be proposed separately.

---

**End of Archive Report**
