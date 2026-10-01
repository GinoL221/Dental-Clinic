# Code Review Rules — Dental-Clinic

## General
- No hardcoded secrets, credentials, or API keys in source code
- Supply sensitive values through server-side environment variables or a secrets manager; `.env` is an optional local-development mechanism
- `.env` files must never be committed — always add to `.gitignore`
- Remove debug files, dead code, and unused dependencies before committing

## Java / Spring Boot
- Preserve the existing Controller → Service → Repository separation; use service interfaces where they provide a meaningful contract or substitution boundary
- Use DTOs for API responses — never expose JPA entities directly
- Enforce authorization on the backend using Spring Security rules and `@PreAuthorize` where appropriate — never rely solely on frontend checks
- Use `@Valid` for controller request DTOs that declare validation constraints
- Prefer constructor injection over `@Autowired` field injection
- Handle MVC application exceptions through `GlobalExceptionHandler`; authentication and access-denied errors in the security filter chain use the corresponding Spring Security handlers

## JavaScript / SvelteKit / Vite
- Use `const` and `let`, never `var`
- Read deployment configuration such as `BACKEND_URL` from the server environment; keep private values out of browser code and expose only explicitly public configuration
- Keep `+page.server.js` loaders/actions focused on request orchestration; extract complex or reusable logic into appropriately scoped modules
- Resolve session/auth in `hooks.server.js` into `event.locals.user` — never trust client-side state for authorization
- Backend calls go through `src/lib/api.js` (`apiFetch` → `BACKEND_URL`, default `http://localhost:8080`) — there is no Vite dev-server proxy
- Avoid `console.log` in production code paths
- Run `npm run check` (svelte-check) and `npm run typecheck` (`tsc -p jsconfig.json`) before committing frontend changes — JSDoc types must stay valid

## Svelte Components
- Presentational components focus on rendering; pages and containers may coordinate UI state, interactions, and data through dedicated modules
- Keep business rules out of markup; separate client-side responsibilities where doing so improves cohesion, reuse, or testability
- API calls go through dedicated modules in `src/lib` (e.g. `src/lib/api.js`)

## Git
- Commit messages follow conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- Each commit should be a coherent, deployable unit of work
- Never commit `node_modules`, `target/`, `.env`, or generated files

## Git Workflow Rules (OBLIGATORIAS)
- **Phase checkpoints**: after each coherent phase, report changes and verification results before continuing; organize commits by reviewable work units, not line counts, and commit only with explicit user authorization
- **No git push sin permiso**: siempre preguntar antes de pushear, nunca hacerlo solo
- **Git reset requiere permiso explícito**: antes de cualquier reset (soft/hard/mixed), explicar desde dónde y qué se pierde, y obtener permiso explícito

## Skills

| Skill | Description | File |
|-------|-------------|------|
| `spring-boot-3` | Spring Boot 3 / JPA / Security 6 + JWT patterns for this project | [SKILL.md](~/.config/opencode/skills/spring-boot-3/SKILL.md) |
| `java-21` | Java 21 language and runtime patterns for modern, safe code | [SKILL.md](~/.config/opencode/skills/java-21/SKILL.md) |
