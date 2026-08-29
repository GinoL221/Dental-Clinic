# Spec: Appointment Collection Mapping

## Determination: No Spec Delta

This change introduces **no new or modified capability spec**. It is a pure
internal refactor of `AppointmentServiceImpl.findAll()` and
`findAllForCurrentUser()` that extracts the existing duplicated
`List<Appointment>` -> `List<AppointmentDTO>` loop into a new
`AppointmentResponseMapper.toDTOs(List<Appointment>)` helper.

### Basis for this determination

1. **Proposal's own Capabilities section** (`openspec/changes/appointment-collection-mapping/proposal.md`)
   states explicitly: New Capabilities = None, Modified Capabilities = None —
   "observable behavior is preserved exactly (same public signatures, same DTO
   fields, same order, same mutability, same exceptions, same role/repository
   routing)."
2. **Verification search performed**: `Grep` across every
   `openspec/specs/**/spec.md` for `findAll`, `findAllForCurrentUser`, and
   `AppointmentResponseMapper` found no spec that documents the internal
   collection-mapping mechanics (the loop, the mapper call, or the
   intermediate list construction) as observable behavior. Two files
   reference the method names, but only for unrelated, already-satisfied
   concerns — see cross-references below.
3. No product-facing behavior, DTO contract, HTTP response shape, or
   authorization rule changes as a result of this refactor. There is
   therefore no requirement text to add, modify, remove, or rename.

### Cross-References (behavior this refactor MUST continue to honor — no new requirement text needed)

- **`openspec/specs/stale-principal-resolution/spec.md`** — scenarios
  "`AppointmentServiceImpl.findAllForCurrentUser()` PATIENT branch with
  missing backing row" and "... DENTIST branch with missing backing row"
  assert that a stale principal on `findAllForCurrentUser()` yields
  `401 Unauthorized` via `StalePrincipalException`. The proposal's scope
  ("same exceptions") already commits to preserving this; the refactor only
  touches the DTO-mapping step and leaves the pre-mapping principal
  resolution and exception throw sites untouched.
- **`openspec/specs/object-level-authorization/spec.md`** — line 93 cites
  `findAll`'s existing role policy (`ADMIN, DENTIST`) as a reference point
  for an unrelated requirement (patient read-by-id). This is a passive
  citation of current behavior, not a requirement on `findAll` itself, and
  the proposal's scope ("same role/repository routing") already preserves it.

Both references describe pre-existing, already-specified behavior at layers
this change does not touch (principal resolution, `@PreAuthorize` role
gating one layer up in `AppointmentController`). No MODIFIED Requirements
block is warranted for either file.

### Explicitly excluded from this determination

The null/unrecognized-`Role` hardening finding (proposal decision D2,
target `401 Unauthorized`) is out of scope for this change and is not
addressed by this spec artifact. It is deferred to a future change, which
will own its own spec delta against `openspec/specs/stale-principal-resolution/spec.md`
or a new capability, as appropriate.

## Outcome

No `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED
Requirements`, or `## RENAMED Requirements` sections are produced by this
phase. `sdd-tasks` and `sdd-verify` should treat this as an intentional,
auditable "no spec delta" outcome, not a skipped phase.
