# API Error Contract + OpenAPI Documentation

Branch `feat/api-error-contract-openapi` (from `main@3597921`). Unify the backend error contract, prove OpenAPI works in dev, annotate the API, and document it. Evidence: explorer task `mwdo1959-1-0zt4`.

## Specs

Quotes from the user's approval of the plan (2026-11-12), verbatim intent:

- S1: All `GlobalExceptionHandler` handlers return `ErrorResponse` JSON — no plain `String` bodies (`DataIntegrityViolationException` at `GlobalExceptionHandler.java:67-82`, `EmailAlreadyExistsException` at `:252`).
- S2: Unique-constraint DB violations map to 409 when the constraint is a uniqueness violation (`uk_appointment_active_dentist_slot`, email, DNI, matrícula); other data-integrity violations stay 400.
- S3: `EmailAlreadyExistsException` and its handler are removed (dead code — nothing throws it).
- S4: Duplicate email on registration (`AuthenticationService.java:39-40`) returns 409 like the rest of the duplicate cases — service throws `DuplicateResourceException`.
- S5: Spring Security 403 (role-denied) returns `ErrorResponse` JSON via a custom `AccessDeniedHandler` (currently default handler at `SecurityConfiguration.java:64`).
- S6: `DashboardController` no longer returns an empty 400 (`DashboardController.java:30-31`); it throws an exception that the handler maps to a structured 400.
- S7: `ConstraintViolationException` has a handler returning structured 400 (currently unhandled → 500).
- S8: `MethodArgumentNotValidException` responses gain an optional additive `fieldErrors` map (`field: message`); the existing `message` text stays unchanged.
- S9: A dev/test smoke test asserts `GET /v3/api-docs` returns 200 with expected paths. Springdoc 2.0.3 is upgraded only if this test fails for version reasons.
- S10: Controllers carry `@Tag`; endpoints carry `@Operation`; a global `OpenApiCustomiser` adds `ErrorResponse` as the error response schema so `@ApiResponse` is not repeated 36 times; typo "autehtication" fixed in `OpenApiConfiguration.java:27`.
- S11: `docs/api-errors.md` documents the error body shape, HTTP-status table, and an example; README mentions Swagger URL in dev, links the contract, and stops claiming "respuestas JSON consistentes" while it was false (`README.md:97`); `CONEXION.md` references the contract.
- S12: Frontend must keep working without changes: `api.js:36` reads only `message`; no `+page.server.js` branches on 400 vs 409. Verified by the frontend suite, not by changing frontend code.

## Tasks

- [ ] T1 (S1-S8) Unify backend error contract, test-first — route: inline — commit: U1
- [ ] T2 (S9) OpenAPI dev smoke test — route: inline — commit: U2
- [ ] T3 (S10) Annotate controllers with springdoc — route: inline — commit: U3a (clinic controllers), U3b (appointments + auth)
- [ ] T4 (S11) Documentation: api-errors.md, README, CONEXION.md — route: inline — commit: U4
- [ ] T5 (S1-S12) Full verification + independent verify — route: gentle-ai-verify — commit: none (closing)

## Log

- L1: User asked (2026-11-12): "esta completa la documentacion del proyecto? es consistente con el manejo de errores? esta documentado la api del backend? usamos openapi o algo similiar?"
- L2: Exploration (mwdo1959-1-0zt4) found 7 error-handling inconsistencies (E1-E7), springdoc integrated with 0 annotations, no error-shape docs, and frontend reads only `message` (no 400/409 branching).
- L3: User approved the 4-unit plan: "si, lo apruebo".
