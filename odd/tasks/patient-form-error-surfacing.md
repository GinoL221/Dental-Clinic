# Patient Form Error Surfacing

Branch `feat/patient-form-error-surfacing` (from `main@99dc024`). Two approved UX adoptions of the unified error contract.

## Specs

User request verbatim: "vamos con estas dos entonces: 1. Mostrar mensajes reales del backend en los formularios de pacientes — patients/add y patients/+page ignoran el cuerpo del error y muestran texto duro; podrían surfear el 409 real ("El email ya está registrado", "El DNI ya está registrado"). 2. Adoptar fieldErrors para validación por campo — el backend ya manda el mapa campo → mensaje en los 400 de validación; el front podría marcar cada input inválido en lugar del string plano concatenado."

- S1: `patients/add` default action: when the API error carries a useful `message`, return it (`success:false, error: <message>`); otherwise keep the current fallback text "Ya existe un paciente con ese DNI o email.". Refinement (T3, verifier finding 1): when the error carries `fieldErrors`, the action returns the map ALONE (no joined message) — the FormCard list and inline marks already display that content. `oldData` preserved unchanged.
- S2: `patients/edit` update action: same rule (fallback "Error al actualizar el paciente.").
- S3: `patients/+page` delete action: same rule (fallback "No se puede eliminar el paciente porque tiene citas asociadas o error del servidor.").
- S4: actions also return `fieldErrors` (map) when the error response carries it; absent otherwise.
- S5: `FormCard.svelte` accepts optional `fieldErrors` and renders them; `patients/add` and `patients/edit` views mark each invalid input with an inline message (helper in `src/lib/utils` with unit tests). No hardcoded hex, no `!important`, WCAG AA palette respected.
- S6: dentists/appointments forms are NOT in this unit (future adoption of the mechanism).

## Tasks

- [x] T1 (S1-S3) Surface real backend messages with fallbacks — route: worker (mwe6z438-9-eepm) — commit: 6db0c48 (+ hygiene ff026cd: 3 pre-existing prettier violations fixed, CI does not run prettier)
- [x] T2 (S4-S5) fieldErrors passthrough + per-field rendering — route: worker (mwe763it-a-oju0) — commit: d78fd4f
- [ ] T3 Full verification + independent verify — route: gentle-ai-verify — commit: none
- [ ] T4 Merge/push with user consent — route: parent — commit: none

## Log

- L1: User selected the two backlog UX items verbatim (see Specs).
- L2: Plan approved: U1 fallback-preserving message surfacing in 3 server actions; U2 FormCard fieldErrors prop + inline per-field marking in patients add/edit only.
- L3: U1 done: three actions surface err.message when useful (rule shared in usefulErrorMessage later), fallbacks preserved; 3 RED→GREEN; 153/153 suite. Worker adjusted two pre-existing mock tests (Conflict → "HTTP error! status: 409") to keep the fallback-intent coverage.
- L4: U2 done: apiFetch parses the error body once and attaches `error.fieldErrors` additively (body already consumed for message — action-side parsing impossible); formatters gain fieldErrorFor + usefulErrorMessage (7 unit tests RED→GREEN); both create/update actions pass fieldErrors through (Spring nested paths `address.*` confirmed via PatientRequestDTO/AddressRequestDTO); FormCard renders optional fieldErrors list; patients add/edit mark inputs inline with aria-invalid/aria-describedby reusing token-based .field-error class; form-field-errors styled with --color-peligro-texto. 162/162, svelte-check 0/0, tsc clean, prettier clean. Commit d78fd4f.
- L5: T3 done: independent verify (mwe7ifvv-b-tfmp) PASS S1-S6, api.js regression check clean for all error-consuming sites, 164/164 after fixes, build + impeccable []. Its three non-blocking findings fixed inline in the follow-up fix commit: (1) map-or-message rule — actions return fieldErrors alone on validation 400s (the joined message, FormCard list and inline marks would have shown the same content three times); (2) apiFetch fieldErrors coverage (2 tests); (3) delete action uses shared usefulErrorMessage + pre-existing unused catch binding cleaned. S1/S2 refined accordingly (see S1 note).
