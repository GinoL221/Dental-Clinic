# Archive Report: Frontend XSS + Token Hardening

**Change**: frontend-xss-token-hardening
**Archived**: 2026-07-01 (filesystem archive; engram already marked this change ARCHIVED on 2026-06-26 as an engram-only close — this commit brings the openspec file store in sync with that record)
**Source**: `openspec/changes/frontend-xss-token-hardening/` → `openspec/changes/archive/2026-06-26-frontend-xss-token-hardening/`

## Summary

Closed security audit items 4 (frontend stored XSS) and 5 (JWT in localStorage) of `security/audit-2026-06-21`, sibling to the already-archived `backend-authz-hardening`. Delivered as 3 chained PRs, all merged to `main`:

- **PR1** (#15, `fix/jwt-cookie-fallback-auth`): backend httpOnly-cookie JWT fallback in `JwtAuthenticationFilter` — header-first, cookie only when header absent.
- **PR2** (#16, `fix/xss-safe-dom-list-rendering`): converted patient/appointment/dentist list renderers from `innerHTML` string interpolation to DOM-safe `textContent`/`createElement`.
- **PR3** (#17, `fix/postlogin-json-token-removal`): removed `authToken` from `localStorage` repo-wide, collapsed `postLogin.js`'s legacy branch into the same JSON shape as the modular branch.

## Capabilities Delivered

| Capability | Delta Spec | Status |
|---|---|---|
| cookie-authentication | `specs/cookie-authentication/spec.md` | NEW |
| safe-list-rendering | `specs/safe-list-rendering/spec.md` | NEW |
| client-token-handling | `specs/client-token-handling/spec.md` | NEW |

## Task Completion

All 5 phases in `tasks.md` are complete:

- Phase 0 — Locate non-modular login client script: DONE
- Phase 1 — Backend cookie-fallback filter (+ post-review remediation, 3 CRITICAL findings fixed): DONE, 61/61 backend tests
- Phase 2 — Cookie-path live verification checkpoint: PASS (200/200/200/403 as expected)
- Phase 3 — XSS safe-DOM conversion (3 list renderers): DONE — merged via PR #16; checkboxes were left unmarked in `tasks.md` until this archive pass, corrected retroactively (tracking-only fix, no code change)
- Phase 4 — postLogin JSON collapse + token removal: DONE
- Phase 5 — Final verification: DONE — backend 61/61, frontend 207 passed / 6 skipped (pre-existing), live e2e cookie-only auth confirmed

## Verification Result

**Verdict**: PASS (per engram apply-progress/4R review records, observation #1037)

- 4R review after PR3 surfaced 1 CRITICAL + 4 WARNINGs, all resolved before merge (native-form vs modular branch handling in `postLogin.js`, `credentials: "include"` gaps, comment harmonization, expanded token-handling test coverage).
- No separate fresh-context `sdd-verify` pass was recorded for this change (verification evidence lives in the apply-progress/4R findings, not a standalone `VERIFY.md` — no such file is included in this archive since none exists to preserve).

### Correction to a previously logged "known issue"

The engram archive-report (#1080) records an open concern from Phase 5.3 that the `authToken` cookie value might be the literal string `"undefined"`. This was investigated and **disproven** during the apply session itself (see `tasks.md`, the "Correction to the 5.3 note" section): the curl that produced that claim hit the wrong route (Node frontend's `/api/auth/login` convention instead of the real Spring Boot `/auth/login` mapping). The backend always returns a real JWT in `AuthenticationResponse.token`; no follow-up action is needed.

## Files Affected (production)

- `backend/src/main/java/com/dh/dentalClinicMVC/configuration/JwtAuthenticationFilter.java`
- `backend/src/main/java/com/dh/dentalClinicMVC/configuration/SecurityConfiguration.java` (comment correction only)
- `frontend/src/controllers/auth/postLogin.js`
- `frontend/public/js/patient/modules/ui-manager.js`
- `frontend/public/js/appointment/modules/ui-manager.js`
- `frontend/public/js/dentist/modules/ui-manager.js`
- `frontend/public/js/api/auth-api.js`, `frontend/public/js/api/config.js`, `frontend/public/js/api/dentist-api.js`
- `frontend/public/js/auth/modules/data-manager.js`
- `frontend/public/js/appointment/modules/appointment-enricher.js`, `data-manager.js`

## Archive Contents

- `proposal.md` — full proposal, scope decisions #1-5
- `design.md` — technical approach, both tracks (cookie auth + safe-DOM)
- `tasks.md` — 5 phases, all checkboxes `[x]`
- `specs/cookie-authentication/spec.md`
- `specs/safe-list-rendering/spec.md`
- `specs/client-token-handling/spec.md`
- `ARCHIVE.md` — this report

No `VERIFY.md` is included: this change was verified via post-apply 4R review + live e2e checkpoints recorded directly in `tasks.md` and engram, not via a separate `sdd-verify` phase output.

## Source of Truth

Delta specs are NEW capabilities (no prior main spec existed for cookie-authentication, safe-list-rendering, or client-token-handling), so they are archived as-is alongside this change rather than merged into `openspec/specs/`.

## Engram Observations (cross-session traceability)

- Proposal: #1029
- Spec: #1033
- Design: #1034
- Tasks: #1035
- Apply-Progress / 4R Verification: #1037
- Archive Report (engram-only close, 2026-06-26): #1080

## SDD Cycle Complete

Fully planned (propose → spec → design → tasks), implemented (5 phases, all merged across 3 PRs), verified (4R review + live e2e), and now archived on both engram and the openspec filesystem. Ready for the next change.
