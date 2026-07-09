# Proposal: Authz Cleanup Round 2 (role-check consolidation + missing-backing-row status unification)

## Intent

Close two deferred WARNING items (R2, R3) from the archived `2026-06-22-backend-authz-hardening` change. Today the same two behaviors are implemented inconsistently across controllers, which is a maintainability and security-clarity risk: reviewers cannot reason about one authorization rule in one place, and one identical failure condition returns three different HTTP outcomes. Doing it now, while the authz surface is fresh, prevents drift as more endpoints are added. R1 (strip-list) was already fixed separately this session.

## Scope

### In Scope
- **R2 — role-check consolidation**: replace the 4 inline `getAuthorities()` role checks with calls to a shared, reusable form of `AppointmentController.hasRole()`. Call sites: `PatientController.update()`, `PatientController.findById()` (compound ADMIN||DENTIST), `DentistController.update()`, and `AppointmentController.findAll()` (own file, not using its own helper).
- **R3 — unify "valid JWT, no backing row" status** across BOTH layers so the identical condition returns ONE deliberate status:
  - Controller/service layer: 9 call sites split 6×400 (`IllegalArgumentException`) vs 3×403 (`AccessDeniedException`) for the `findByEmail`-miss condition.
  - Authentication-filter layer: `JwtAuthenticationFilter.doFilterInternal()`'s uncaught `UsernameNotFoundException` (valid JWT, entire `users` row gone) escaping before Spring Security's `ExceptionTranslationFilter` — surfaces as an untranslated 500. Same "valid JWT, no backing row" question, earlier layer.

### Out of Scope (noted non-goals / backlog)
- `AuthenticationService.login()`'s bare `.orElseThrow()` → `NoSuchElementException` → 500. Login-time race, different root cause/lifecycle than a stale already-issued JWT. Track as separate future change.
- Any change to `@PreAuthorize` gating semantics on any endpoint.
- Frontend / any non-authz behavior.

## Capabilities

### New Capabilities
- `stale-principal-resolution`: observable HTTP contract for a valid, unexpired JWT whose backing row is missing — at both the authentication-filter layer (`users` parent row gone) and the controller/service resolution layer (Patient/Dentist child row gone). One deliberate, tested status across all reachable paths.

### Modified Capabilities
- None. R2 is a behavior-preserving refactor (no spec-level change): existing `@PreAuthorize` and object-level-authorization outcomes MUST stay byte-for-byte identical.

## Approach

1. Extract/relocate the role-check helper into a shared location (interface default, static utility, or `@Component` — **design decides**) and route all 4 inline sites plus the existing in-file duplicate through it. `findById()`'s compound check becomes two helper calls.
2. Choose ONE status for the missing-backing-row condition (**design decides 400 vs 403 vs 404**) and apply it to all 9 controller/service sites AND add explicit handling so the `JwtAuthenticationFilter` path returns the same status instead of an untranslated 500 — without weakening the filter's existing `JwtException | IllegalArgumentException` handling.
3. Add tests covering every reachable path (currently zero coverage), including the filter-layer path.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `controller/AppointmentController.java` | Modified | Helper owner; `findAll()` inline → helper; 400-path sites |
| `controller/PatientController.java` | Modified | 2 inline checks → helper; 2×403 sites |
| `controller/DentistController.java` | Modified | 1 inline check → helper; 1×403 site |
| `service/impl/AppointmentServiceImpl.java` | Modified | 2×400 `findByEmail`-miss sites |
| `configuration/JwtAuthenticationFilter.java` | Modified | Catch/translate `UsernameNotFoundException` to unified status |
| `exception/GlobalExceptionHandler.java` | Possibly Modified | May need mapping for chosen status |
| shared helper (new location TBD) | New | Reusable role-check |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Refactor silently changes an authz outcome | Med | Behavior-preserving refactor; keep `@PreAuthorize` untouched; regression tests assert unchanged outcomes |
| Weakening filter's existing exception handling while adding coverage | Med | Additive catch only; preserve current `JwtException`/`IllegalArgumentException` branch; test both old and new paths |
| Changing a status code breaks a frontend consumer expecting old 400/403 | Med | Confirm chosen status with product before apply; document contract change |
| Compound `findById()` check mis-translated to single-role | Low | Explicit two-call `ADMIN || DENTIST` mapping, covered by test |

## Rollback Plan

Both items are additive/refactor-only and isolated to the listed files. Revert is a single-commit `git revert` of the change; no data migration, no schema change, no config change. If only the status-code unification proves problematic, R2 (pure refactor) and R3 can be reverted independently since they touch distinct logic.

## Dependencies

- None external. Follows archived `2026-06-22-backend-authz-hardening` (ARCHIVE.md R2/R3). R1 already resolved this session.

## Success Criteria

- [x] Every inline `ROLE_ADMIN`/`ROLE_DENTIST` `getAuthorities()` check across Patient/Dentist/Appointment controllers is replaced by the shared helper; grep confirms zero remaining inline duplicates.
- [x] Every code path reachable with a valid JWT + missing backing row returns the SAME deliberately-chosen HTTP status — including the `JwtAuthenticationFilter` path (no untranslated 500).
- [x] Tests exist for all previously-uncovered paths (9 controller/service sites + filter path); full backend suite green (`mvn test`).
- [x] No `@PreAuthorize` semantics changed; existing object-level-authorization scenarios still pass unchanged.
- [x] `AuthenticationService.login()` 500 path remains untouched and recorded as backlog.

## Proposal question round

Executor cannot converse directly; orchestrator should relay these before the specs/design go-ahead. Assumptions used if unanswered are noted.

1. **Product/status semantics**: when a client presents a valid-but-stale JWT whose account no longer has a backing row, what should the client experience — "re-authenticate" (401), "forbidden" (403), or "not found" (404)? (Exact code is design's call, but the intended UX shapes the choice.) *Assumption: treat as an authentication problem — client should be forced to re-auth — leaning toward a 401-style outcome; design finalizes.*
2. **Defensive value vs reachability**: exploration confirms the child-row-missing (Patient/Dentist) orphan state is NOT reachable via normal app deletion (joined-inheritance deletes both rows) — only via manual DB action, migration bug, or a test/seed truncation. Is the goal here full defensive hardening, or primarily (a) consistency of the contract and (b) closing the filter-layer 500 leak? *Assumption: primarily consistency + closing the 500 leak; defensive handling is a welcome side effect, not the driver.*
3. **Known consumers**: does any current frontend flow depend on receiving the existing 400/403 for this condition, such that changing it would break behavior? *Assumption: no consumer depends on it (condition is effectively unreachable in prod today); safe to standardize.*
4. **Slice boundary**: is R2 (refactor) + R3 (status) as a single change acceptable, or should they ship as two independent PRs given they touch distinct logic? *Assumption: single change, but tasks may split into two review-friendly slices.*
