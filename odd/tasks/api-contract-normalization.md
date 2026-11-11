# API Contract Normalization (Brecha G6)

Branch feat/api-contract-normalization (from main 9b8f379). Normalizes AppointmentDTO JSON serialization from legacy snake_case (patient_id, dentist_id) to idiomatic camelCase (patientId, dentistId) with dual compatibility, aligning with AppointmentRequestDTO and frontend models (Phase 4 of project plan).

## Specs

- S1: `AppointmentDTO` must expose `patientId` and `dentistId` as primary camelCase properties in JSON responses, matching `AppointmentRequestDTO` and Spring Boot standards.
- S2: `AppointmentDTO` must preserve backward compatibility for legacy clients by also exposing `patient_id` and `dentist_id` (via Jackson getters or aliases) to avoid breaking third-party integrations.
- S3: `AppointmentResponseMapper` and `AppointmentRequestMapper` must use the normalized accessors.
- S4: Backend integration tests (`AppointmentControllerTest`, `E2eProfileIntegrationTest`) must verify both `patientId` and `patient_id` in response payloads.
- S5: Frontend routes (`/appointments` list and `/appointments/edit/[id]`) and test fixtures must consume `patientId` and `dentistId` with seamless fallback.
- S6: Document resolution of Brecha G6 in `docs/product.md`.

## Tasks

- [x] T1 (S1, S2) Normalize AppointmentDTO fields with dual camelCase/snake_case serialization — route: inline — commit: this commit
- [x] T2 (S3) Update AppointmentResponseMapper and AppointmentRequestMapper — route: inline — commit: this commit
- [x] T3 (S4) Update backend tests for AppointmentDTO serialization — route: inline — commit: this commit
- [x] T4 (S5) Update frontend appointment views and Vitest mocks to canonical camelCase — route: inline — commit: this commit
- [x] T5 (S6) Update docs/product.md marking G6 resolved — route: inline — commit: this commit
- [x] T6 (S1-S6) Full test verification (backend & frontend), spotless and format checks — route: inline — commit: this closing commit

## Log

- L1: User approved Phase 4: "si" to create feat/api-contract-normalization from main (9b8f379).
- L2: T1 & T2 implemented: AppointmentDTO normalized to camelCase fields (patientId, dentistId) with Jackson backward-compatible accessors for patient_id and dentist_id; mappers updated.
- L3: T3 implemented: E2eProfileIntegrationTest, AppointmentControllerTest, and mapper tests assert both camelCase and snake_case properties. Fixed null auth check in DentistController/PatientController findById.
- L4: T4 implemented: appointments/+page.svelte, appointments/edit/[id]/+page.svelte, and Vitest mocks updated to canonical camelCase with fallback.
- L5: T5 implemented: docs/product.md updated with Brecha G6 marked resolved.
- L6: T6 verified: 269 backend tests pass, 132 frontend tests pass, svelte-check 0 errors 0 warnings, Spotless and Prettier clean.
