# Archive Report: patient-dentist-request-dtos

## Status

PASS — archive completed successfully.

## Artifacts Read

- `openspec/changes/patient-dentist-request-dtos/proposal.md`
- `openspec/changes/patient-dentist-request-dtos/specs/patient-dentist-request-dtos/spec.md`
- `openspec/changes/patient-dentist-request-dtos/design.md`
- `openspec/changes/patient-dentist-request-dtos/tasks.md`
- `openspec/changes/patient-dentist-request-dtos/verify-report.md`
- `openspec/changes/patient-dentist-request-dtos/sync-report.md`
- `openspec/specs/patient-dentist-request-dtos/spec.md`
- Engram topic `sdd/patient-dentist-request-dtos/*` (explore, proposal, spec, design, tasks, apply-progress, verify-report — obs #1355-#1364)

## Structured Status and Action Context

- Artifact store: `hybrid` (OpenSpec files + Engram)
- Change: `patient-dentist-request-dtos`
- Workspace root: `/home/ginopc/Desarrollo/Dental-Clinic`
- Native status: verify `PASS`, sync `synced`, archive eligible
- Same-domain active changes: none
- Destructive merge blockers: none

## Domains Synced

- `patient-dentist-request-dtos`

## Requirement Names Synced

- Validated Request DTOs for Patient/Dentist Writes
- Request DTO Structurally Excludes Server-Owned Fields
- Update Uses Full-Replace Semantics
- Canonical Address Field Name Is `location`
- Bean Validation Rejects Malformed Input
- One-Time Read-Only Validation Audit

## Delivery Summary

Delivered as 3 chained work units (stacked-to-main), 4 commits on `main`:

- `996eb47` feat(patient): Patient DTO/mapper/controller + frontend patient-api.js (Slice A)
- `2c7be07` test(patient): email-preservation-on-self-update coverage (gate-review fix)
- `64aa370` feat(dentist): Dentist DTO/mapper/controller + frontend dentist-api.js (Slice B)
- `4f9e84a` feat(audit): read-only validation audit runner (Slice C)

Key binding decisions: D1 full-replace update, D2 canonical `address.location`,
D3 split request/response DTOs, D4 validate-new + read-only audit, D5 Lombok
POJOs over records, D6 manual mapping over MapStruct, D7 admin role-setting
via these endpoints removed with no replacement (escalated mid-design by a
fresh-context gatekeeper review as an unapproved functional regression, then
explicitly approved by the user).

## Tasks / Completion Check

- Implementation task checkboxes: none unchecked (21/21, tasks.md)
- Verification report status: PASS (0 CRITICAL, 0 blocking WARNING)
- Sync report status: synced
- Full backend suite: 87/87 pass (orchestrator-verified `mvn test`, BUILD SUCCESS)
- Full frontend suite: 245/245 pass (17 suites, `npm test`)

## Archived Path

- `openspec/changes/archive/2026-07-03-patient-dentist-request-dtos/`

## Residual Risks

- None blocking. Two minor SUGGESTIONs noted in the verify report (pre-existing
  dead code in `patient-api.js` unrelated to this change; a since-corrected
  test-count discrepancy in the apply-progress note) — both non-blocking and
  out of scope for remediation here.
- Follow-up SDD candidates identified going in: Appointment
  validation/orchestration, and frontend API-module boundaries/global state
  (this change's minimal frontend touch is not a substitute for that broader
  rework).

## Notes

- No application code was edited during archive.
- Canonical spec content remains in English.
- Archive executed only after verified sync and clean task completion.
