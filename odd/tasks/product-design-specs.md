# Product and design specs

Branch feat/product-and-design-specs (from fix/api-response-contract 5858d87). Documentation and design artifacts only; no production code changes.

## Specs

- S1: "establecemos un product.md y un desing.md" — two living documents: `docs/product.md` and `docs/design.md` (user chose "docs/").
- S2: "con un diseño frontend completo para el proyecto" — scope chosen: "Specs + sistema + artboards clave": product.md, design.md, design/system.md (+ system.html) and HTML artboards for landing, login/registro, dashboard, one list, one form.
- S3: Language of the documents: "Español". Generated technical artifacts elsewhere stay English.
- S4: Visual direction: "Evolucionar la marca actual": keep primary blue #4a90e2 + mint #a4e2c2, order tokens, remove hardcoded hex values and `!important` gradients (as design rules, not code changes in this feature).
- S5: product.md records only facts verified in code (roles, permission matrix, entities, appointment state machine, validation rules) and lists doc/code contradictions as "Known gaps", without fixing them.

## Tasks

- [x] T1 (S1, S3, S5) docs/product.md — route: inline — commit: 27c22c1, corrections 9b152df
- [x] T2 (S2, S4) design/system.md + design/system.html via design sync from frontend/static/css/**/ (worker unavailable after partial system.md; finished inline) — route: inline — commit: e667063, fixes 9b152df
- [x] T3 (S1, S3, S4) docs/design.md (tokens, type, components, patterns, per-screen specs, a11y) — route: inline — commit: 23fa20a
- [x] T4 (S2) design/frontend-key-screens/ artboards: landing, auth, dashboard, list, form + design.json — route: inline — commit: 92930f5
- [x] T5 (S1-S5) Verify docs vs code facts, format check, close — route: inline — commit: 9b152df (corrections), this file's closing commit

## Log

- L1: "antes que eso, te parece si establecemos un product.md y un desing.md con un diseño frontend completo para el proyecto?"
- L2: "opcion A" — new branch feat/product-and-design-specs from the current branch.
- L3: Decisions via questionnaire: idioma "Español (Recomendado)"; ubicación "docs/ (Recomendado)"; dirección visual "Evolucionar la marca actual (Recomendado)"; alcance "Specs + sistema + artboards clave (Recomendado)".
- L4: Subagent gentle-ai-worker failed as unavailable on T2 after leaving a partial design/system.md; not retried, finished inline. Contrast ratios recomputed by script: fixed #1b4332 on mint (7.51:1, not 5.45) and in-progress badge (#138496 is 4.40:1, uses #0e7490 at 5.36:1).
- L5: Verification (inline, bounded): @PreAuthorize annotations match product.md matrix for Appointment, Patient, Dentist, Specialty and Dashboard controllers; G1 refs corrected (landing +page.svelte:239,254,267; CONEXION.md:27); G3 corrected (no role gating in list pages; Agregar at patients:56 and dentists:56, Eliminar at patients:130 and appointments:156); G4 evidence added (appointments/+page.svelte:131). Prettier check passes on the new Markdown and JSON.
- L6: Design `design/frontend-key-screens/` created with artboards 01-landing, 02-acceso-y-registro, 03-dashboard, 04-lista-turnos, 05-formulario-turno (no chosen artboard yet; none handed off). Not visually inspected by the parent beyond the canvas refresh; AA contrast of text colors computed, muted text kept off tinted backgrounds.
- L7: Not verified: backend line numbers beyond controller annotations (entities, validators, DTOs) were taken from the exploration handoff and not re-read; no UI implementation was done; no push or PR.
