# Product and design specs

Branch feat/product-and-design-specs (from fix/api-response-contract 5858d87). Documentation and design artifacts only; no production code changes.

## Specs

- S1: "establecemos un product.md y un desing.md" — two living documents: `docs/product.md` and `docs/design.md` (user chose "docs/").
- S2: "con un diseño frontend completo para el proyecto" — scope chosen: "Specs + sistema + artboards clave": product.md, design.md, design/system.md (+ system.html) and HTML artboards for landing, login/registro, dashboard, one list, one form.
- S3: Language of the documents: "Español". Generated technical artifacts elsewhere stay English.
- S4: Visual direction: "Evolucionar la marca actual": keep primary blue #4a90e2 + mint #a4e2c2, order tokens, remove hardcoded hex values and `!important` gradients (as design rules, not code changes in this feature).
- S5: product.md records only facts verified in code (roles, permission matrix, entities, appointment state machine, validation rules) and lists doc/code contradictions as "Known gaps", without fixing them.

## Tasks

- [ ] T1 (S1, S3, S5) docs/product.md — route: inline — commit: pending
- [ ] T2 (S2, S4) design/system.md + design/system.html via design sync from frontend/static/css/base/tokens.css — route: inline — commit: pending
- [ ] T3 (S1, S3, S4) docs/design.md (tokens, type, components, patterns, per-screen specs, a11y) — route: inline — commit: pending
- [ ] T4 (S2) design/frontend-key-screens/ artboards: landing, auth, dashboard, list, form + design.json — route: inline — commit: pending
- [ ] T5 (S1-S5) Verify docs vs code facts, format check, close — route: inline — commit: pending

## Log

- L1: "antes que eso, te parece si establecemos un product.md y un desing.md con un diseño frontend completo para el proyecto?"
- L2: "opcion A" — new branch feat/product-and-design-specs from the current branch.
- L3: Decisions via questionnaire: idioma "Español (Recomendado)"; ubicación "docs/ (Recomendado)"; dirección visual "Evolucionar la marca actual (Recomendado)"; alcance "Specs + sistema + artboards clave (Recomendado)".
