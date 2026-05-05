# Code Review Rules — Dental-Clinic

## General
- No hardcoded secrets, credentials, or API keys in source code
- Use environment variables via `.env` for all sensitive values
- `.env` files must never be committed — always add to `.gitignore`
- Remove debug files, dead code, and unused dependencies before committing

## Java / Spring Boot
- Follow standard Spring layered architecture: Controller → Service (interface + impl) → Repository
- Use DTOs for API responses — never expose JPA entities directly
- Annotate security rules with `@PreAuthorize` — never rely solely on frontend checks
- Use `@Valid` for request validation in controllers
- Prefer constructor injection over `@Autowired` field injection
- Exception handling must go through `GlobalExceptionHandler`

## JavaScript / Node.js / Express
- Use `const` and `let`, never `var`
- Read configuration from `process.env` — no hardcoded values
- Keep Express routes thin — delegate logic to controllers/services
- Avoid `console.log` in production code paths

## EJS / Frontend
- Keep EJS templates presentational — no business logic in views
- Client-side JS must be modular (one responsibility per file)
- API calls go through dedicated api modules (e.g. `dentist-api.js`)

## Git
- Commit messages follow conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- Each commit should be a coherent, deployable unit of work
- Never commit `node_modules`, `target/`, `.env`, or generated files
