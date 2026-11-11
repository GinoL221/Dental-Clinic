# Backend Error Handling and Observability

Branch feat/backend-error-handling (from main b5897d7). Remediation of unhandled HTTP message errors and missing exception logging (Observation #12798).

## Specs

- S1: "GlobalExceptionHandler:146 catch-all, no handlers for malformed JSON/type mismatch → 500" — Requests with malformed JSON bodies (`HttpMessageNotReadableException`) or parameter type mismatches (`MethodArgumentTypeMismatchException`, e.g. string for numeric path variable) must return HTTP 400 Bad Request with a structured `ErrorResponse`, never HTTP 500.
- S2: Implement explicit `@ExceptionHandler(HttpMessageNotReadableException.class)` returning HTTP 400 with a user-friendly Spanish message indicating invalid JSON syntax or unparseable payload.
- S3: Implement explicit `@ExceptionHandler(MethodArgumentTypeMismatchException.class)` returning HTTP 400 with a clear explanation of which parameter or path variable had an invalid type.
- S4: Add SLF4J structured logging to `GlobalExceptionHandler`: log `ERROR` with exception message and full stack trace for unexpected 500 errors; log `WARN` with request path for client errors (400, 404, 409).

## Tasks

- [x] T1 (S1) Write RED tests proving malformed JSON and path variable type mismatch produce 500 instead of 400 — route: inline — commit: this commit
- [x] T2 (S2) Implement HttpMessageNotReadableException handler in GlobalExceptionHandler — route: inline — commit: this commit
- [x] T3 (S3) Implement MethodArgumentTypeMismatchException handler in GlobalExceptionHandler — route: inline — commit: this commit
- [x] T4 (S4) Add SLF4J logger and structured logging for 500 errors and 4xx client warnings — route: inline — commit: this commit
- [x] T5 (S1-S4) Full verification across test suites, Spotless formatting, and work-unit commits — route: inline — commit: this closing commit

## Log

- L1: User approved Phase 2: "si" to create feat/backend-error-handling branch from main (b5897d7).
- L2: T1 RED test observed in GlobalExceptionHandlerMalformedRequestTest (2 failures: 500 returned instead of 400).
- L3: T2 HttpMessageNotReadableException mapped to HTTP 400 with structured ErrorResponse.
- L4: T3 MethodArgumentTypeMismatchException mapped to HTTP 400 with parameter name and required type ErrorResponse.
- L5: T4 SLF4J Logger added: log.error with stack trace on 500, log.warn on 400/4xx client errors.
- L6: T5 Verification: 266 backend tests pass, 130 frontend tests pass, Spotless check passes, Prettier passes.
