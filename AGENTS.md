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

## JavaScript / SvelteKit / Vite
- Use `const` and `let`, never `var`
- Read configuration from `process.env` (e.g. `BACKEND_URL`) — no hardcoded values
- Keep `+page.server.js` loaders/actions thin — delegate logic to `src/lib`
- Resolve session/auth in `hooks.server.js` into `event.locals.user` — never trust client-side state for authorization
- Backend calls go through `src/lib/api.js` (`apiFetch` → `BACKEND_URL`, default `http://localhost:8080`) — there is no Vite dev-server proxy
- Avoid `console.log` in production code paths
- Run `npm run check` (svelte-check) and `npm run typecheck` (`tsc -p jsconfig.json`) before committing frontend changes — JSDoc types must stay valid

## Svelte Components
- Keep components presentational — no business logic in markup
- Client-side JS must be modular (one responsibility per file)
- API calls go through dedicated modules in `src/lib` (e.g. `src/lib/api.js`)

## Git
- Commit messages follow conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- Each commit should be a coherent, deployable unit of work
- Never commit `node_modules`, `target/`, `.env`, or generated files

## Git Workflow Rules (OBLIGATORIAS)
- **Commit after each phase**: después de cada fase o cada ~200-400 líneas, informar al usuario qué hay pendiente de commitear antes de continuar
- **No git push sin permiso**: siempre preguntar antes de pushear, nunca hacerlo solo
- **Git reset requiere permiso explícito**: antes de cualquier reset (soft/hard/mixed), explicar desde dónde y qué se pierde, y obtener permiso explícito

## Skills

| Skill | Description | File |
|-------|-------------|------|
| `spring-boot-3` | Spring Boot 3 / JPA / Security 6 + JWT patterns for this project | [SKILL.md](~/.config/opencode/skills/spring-boot-3/SKILL.md) |
| `java-21` | Java 21 language and runtime patterns for modern, safe code | [SKILL.md](~/.config/opencode/skills/java-21/SKILL.md) |
