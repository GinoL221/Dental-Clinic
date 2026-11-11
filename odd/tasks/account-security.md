# Account Security: Secure Passwords and Access Control

Branch feat/account-security (from main 7ba88ed). Remediation of critical account takeover vulnerability (Observation #12798) and environment security hardening.

## Specs

- S1: "UserPasswordPolicy:17-34 default password = firstName+lastName+last3(DNI/matrícula) allows account takeover" — eliminate deterministic default password generation. When an account is created without an explicit password, generate a cryptographically secure random temporary password (minimum 12 characters with mixed case, numbers, and symbols).
- S2: Users created with a temporary password must be flagged with `mustChangePassword = true` on `User` entity. Database schema updated with Flyway migration `V3__add_must_change_password.sql`.
- S3: Creation endpoints `POST /api/patients` and `POST /api/dentists` return the generated `temporaryPassword` in `PatientResponseDTO` and `DentistResponseDTO` so the administrator can convey it securely to the user once. Subsequent reads (`GET`) never expose the password.
- S4: Add endpoint `POST /api/auth/change-password` allowing an authenticated user to change their password by supplying current password and new valid password. On success, clears `mustChangePassword = false`.
- S5: `AuthenticationResponse` and `SessionProfileResponse` expose `mustChangePassword` boolean so client applications can enforce password reset before allowing normal operations.
- S6: Environment security: `application.properties` must not silently expose H2 / dev seeds in production. Swagger/OpenAPI documentation must be restricted or disabled in production profile.

## Tasks

- [x] T1 (S1) Write RED test proving predictable default password vulnerability and account takeover — route: inline — commit: 17b620c
- [x] T2 (S2) Flyway migration V3 and User entity mustChangePassword attribute — route: inline — commit: 17b620c
- [x] T3 (S1, S3) Secure temporary password generator in UserPasswordPolicy and DTO responses — route: inline — commit: 17b620c
- [x] T4 (S4, S5) Change-password endpoint and SessionProfile/AuthenticationResponse contract update — route: inline — commit: 917db9c
- [x] T5 (S6) Environment profile default and Swagger configuration hardening — route: inline — commit: 55e7f87
- [x] T6 (S3, S5) Frontend integration: display temporary password on create and handle mustChangePassword prompt — route: inline — commit: 81875ef
- [x] T7 (S1-S6) Full test verification (backend test suite + frontend tests), Conventional Commits and closure — route: inline — commit: this closing commit

## Log

- L1: User approved plan: "si lo apruebo" to initiate Phase 1 (Account security: random temporary password + forced change on first login).
- L2: Branch feat/account-security checked out from main (7ba88ed).
- L3: T1 RED test observed in UserPasswordPolicyTest (3 failures on predictable strings and missing mustChangePassword).
- L4: T2 Flyway migration V3__add_must_change_password.sql and User entity updated with mustChangePassword boolean.
- L5: T3 Secure random temporary password generator (SecureRandom, 14 chars, alphanumeric + symbols) implemented in UserPasswordPolicy. PatientResponseDTO and DentistResponseDTO updated with temporaryPassword and mustChangePassword fields; verified with PatientControllerTest.
- L6: T4 POST /api/auth/change-password implemented with current password verification and mustChangePassword reset; SessionProfileResponse and AuthenticationResponse updated; verified with AuthenticationControllerTest (12 tests) and AuthenticationSessionIntegrationTest (5 tests).
- L7: T5 Swagger UI and OpenAPI disabled under prod profile in application-prod.properties; verified with SwaggerProductionSecurityTest (2 tests).
- L8: T6 Frontend change-password route created (/users/change-password), hooks.server.js guards mustChangePassword redirect, and add forms updated with optional explicit password input; verified with 130 tests and svelte-check (0 errors).
- L9: T7 Full test verification: 264 backend tests pass, 130 frontend tests pass, Spotless check passes, Prettier passes. Work-unit commits organized into reviewable slices.
