# Code Review Rules — Dental-Clinic

Project-wide guidance for coding agents. Keep changes scoped to the user's request and preserve existing behavior outside that scope. These rules do not grant permission to commit, publish, deploy, or perform destructive operations.

## Read the relevant sources first

| Area                                                                               | Source of truth                                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Product scope, user roles, implemented capabilities, and remediated gaps           | [docs/product.md](docs/product.md)                                                    |
| Visual identity, token architecture, WCAG AA accessibility, and component patterns | [docs/design.md](docs/design.md) and [design/system.md](design/system.md)             |
| Available backend and frontend commands                                            | [backend/pom.xml](backend/pom.xml) and [frontend/package.json](frontend/package.json) |
| Required CI checks                                                                 | [.github/workflows/ci.yml](.github/workflows/ci.yml)                                  |
| Frontend package lockfile                                                          | [frontend/package-lock.json](frontend/package-lock.json)                              |

This file defines cross-cutting agent rules; it does not replace the documents above. `docs/product.md` and `docs/design.md` distinguish target experience from implemented capabilities: do not treat documented plans or artboards as proof of implementation, public deployment, or operational safety. Read any more specific instructions applicable to the files being changed. If requirements conflict, surface the conflict before changing code; do not silently choose a different product, security, or quality policy.

## Contextual references (when relevant)

Repository requirements and approved decisions remain authoritative. Keep reusable procedures in the vault or conditional skills, not duplicated here; do not copy personal host settings, historical version snapshots, or another project's exceptions into this repository.

- Before dependency installation, updates, or package-manager configuration changes in `frontend/`, read `01-Conocimiento/Tecnologías/Herramientas/npm-pnpm-security-hardening.md` through Obsidian MCP when available. Confirm the actual package manager (`npm` with `frontend/package-lock.json`), version, configuration scope, and active host policy; the note is context, not authorization to bypass security gates or modify `.npmrc`.
- Before visual frontend work, read `01-Conocimiento/Tecnologías/Herramientas/Adoptar el flujo de diseño en un proyecto avanzado.md` and `01-Conocimiento/Conceptos/Frontend responsive guiado por contenido.md` through Obsidian MCP when available, alongside `docs/design.md` and `design/system.md`. Choose a bounded process: refine existing UI using the official CSS custom properties in `frontend/static/css/base/tokens.css`, preserve WCAG AA contrast, and avoid hardcoded hex values or `!important` overrides in component styles; reserve new artboards under `design/` (self-contained HTML/CSS/SVG without external URLs or CDNs) for new or structurally redesigned flows. Do not install tools or redesign stable screens merely to adopt a workflow.
- For a concrete unresolved technical or architectural question, optionally consult Gentleman Book MCP. Search the relevant chapter, read sufficient section context, cite the chapter and section, and contrast the recommendation with repository conventions and current official documentation for the versions in use (Spring Boot 4.1, Java 21, SvelteKit 2). Do not consult it for routine tasks or treat examples as universal rules.

If a referenced note or MCP is unavailable, state that limitation and continue from repository evidence and official documentation where sufficient. Ask for missing context only when the proposed change depends on it; never invent note contents or assume access. Shared project rules must remain usable without the personal vault. Verify host-specific instruction and skill discovery before relying on automatic loading.

## Project notes in the vault

- Project note: `02-Proyectos/Dental-Clinic.md`. Sync convention: `01-Conocimiento/Tecnologías/Herramientas/Engram-Vault-Sync.md`. Before proposing note changes, read both and the vault's `AGENTS.md` through Obsidian MCP; vault policy governs notes, repository policy governs code.
- At meaningful milestones, scope/architecture/deployment changes, significant blocker changes, or user-confirmed pauses/resumptions/closure, compare the note with available evidence and group relevant differences into one proposal. Follow the central convention; minor changes alone do not warrant an update.
- Include sources, exact destination sections, proposed changes, and unverified aspects; distinguish planned, implemented, merged, and deployed. Preserve dated history and separate note maturity, project status, and verification freshness.
- Wait for explicit approval of each concrete proposal before writing through Obsidian MCP, then read back and verify the result. This instruction does not authorize future vault writes; do not repeat declined or deferred proposals without new evidence or a user request.
- Periodic reviews run when the user initiates them; this file creates no timers or background synchronization. Do not copy operational logs or active task lists into project notes.
- If MCP is unavailable, report the limitation without a vault-filesystem fallback or claiming synchronization; continue repository work where otherwise authorized. The vault is optional context, not a prerequisite for working on this repository.

## Before changing anything

- Confirm the repository, worktree, branch, and existing changes. Never assume the current checkout matches a published PR or another worktree.
- Preserve unrelated tracked changes and untracked files. Do not reset, overwrite, stage, or clean them as part of another task.
- Inspect the existing implementation and contracts before proposing a change. Keep write ownership clear when multiple agents or sessions are active.
- Ask before expanding scope or performing destructive operations. Investigation and review requests stay read-only unless the user authorizes implementation.

## General

- No hardcoded secrets, credentials, or API keys in source code
- Supply sensitive values through server-side environment variables or a secrets manager; `.env` is an optional local-development mechanism
- `.env` files must never be committed — always add to `.gitignore`
- Remove debug files, dead code, and unused dependencies before committing

## Java / Spring Boot

- Preserve the existing Controller → Service → Repository separation; use service interfaces where they provide a meaningful contract or substitution boundary
- Use DTOs for API responses — never expose JPA entities directly
- Enforce authorization on the backend using Spring Security rules, `@PreAuthorize`, and ownership/IDOR guards where appropriate — never rely solely on frontend checks
- Use `@Valid` for controller request DTOs that declare validation constraints
- Prefer constructor injection over `@Autowired` field injection
- Handle MVC application exceptions through `GlobalExceptionHandler` with structured logging (`log.error` for 500s, `log.warn` for 4xx); authentication and access-denied errors in the security filter chain use the corresponding Spring Security handlers
- Preserve Flyway database migrations (`backend/src/main/resources/db/migration/`) and Spotless formatting (`./mvnw spotless:check`)

## JavaScript / SvelteKit / Vite

- Use `const` and `let`, never `var`
- Read deployment configuration such as `BACKEND_URL` from the server environment; keep private values out of browser code and expose only explicitly public configuration
- Keep `+page.server.js` loaders/actions focused on request orchestration; extract complex or reusable logic into appropriately scoped modules
- Resolve session/auth in `hooks.server.js` into `event.locals.user` (including mandatory password-change enforcement via `mustChangePassword`) — never trust client-side state for authorization
- Backend calls go through `src/lib/api.js` (`apiFetch` → `BACKEND_URL`, default `http://localhost:8080`) — there is no Vite dev-server proxy
- Avoid `console.log` in production code paths
- Run `npm run check` (svelte-check) and `npm run typecheck` (`tsc -p jsconfig.json`) before committing frontend changes — JSDoc types and accessibility checks must stay valid with 0 errors and 0 warnings

## Svelte Components and Styling

- Presentational components focus on rendering; pages and containers may coordinate UI state, interactions, and data through dedicated modules
- Keep business rules out of markup; separate client-side responsibilities where doing so improves cohesion, reuse, or testability
- API calls go through dedicated modules in `src/lib` (e.g. `src/lib/api.js`)
- Centralize design tokens in `frontend/static/css/base/tokens.css`; do not introduce hardcoded hex colors or `!important` style overrides in component stylesheets (`buttons.css`, `header.css`, etc.), and maintain WCAG AA contrast ratios

## Verification, databases, and shared resources

- Use the existing Maven and npm scripts and `.github/workflows/ci.yml` to determine applicable checks:
  - Backend (`backend/`): `./mvnw spotless:check` and `./mvnw test`
  - Frontend (`frontend/`): `npm run check`, `npm run typecheck`, `npm test`, and `npm run build`
  - Full-stack runner unit tests (`frontend/`): `npm run test:e2e:process`
  - Full-stack Playwright suite (`frontend/`): `npm run test:e2e:fullstack` (requires explicit `JWT_SECRET`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_NON_ADMIN_EMAIL`, `E2E_NON_ADMIN_PASSWORD`; binds `8080`/`4173` by default — override with `E2E_BACKEND_PORT`/`E2E_FRONTEND_PORT` when those are taken; never reuses existing servers)
- Report what actually ran, what passed or failed, and what remains unverified. An interrupted run is not a PASS.
- Diagnose failures before rerunning. Do not silently skip checks, weaken assertions, or raise test timeouts to make a gate pass.
- Before DB-mutating tests or migrations against external databases, confirm the exact host and disposable schema. Never fall back to a shared development or production MySQL database.
- Shared containers, ports (`8080`, `4173`), temporary files, and background processes may belong to another session. Verify ownership and obtain explicit authorization before stopping or deleting them.

## Git

- Commit messages follow conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `style:`. No AI attribution in commit messages.
- Each commit should be a coherent, deployable unit of work
- Never commit `node_modules`, `target/`, `.env`, `.vitest/`, or generated files

## Git Workflow Rules (OBLIGATORIAS)

- **Phase checkpoints**: after each coherent phase, report changes and verification results before continuing; organize commits by reviewable work units, not line counts, and commit only with explicit user authorization
- **No git push sin permiso**: siempre preguntar antes de pushear, nunca hacerlo solo
- **Git reset requiere permiso explícito**: antes de cualquier reset (soft/hard/mixed), explicar desde dónde y qué se pierde, y obtener permiso explícito

## Skills

| Skill           | Description                                                      | File                                                         |
| --------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `spring-boot-3` | Spring Boot 3 / JPA / Security 6 + JWT patterns for this project | [SKILL.md](~/.config/opencode/skills/spring-boot-3/SKILL.md) |
| `java-21`       | Java 21 language and runtime patterns for modern, safe code      | [SKILL.md](~/.config/opencode/skills/java-21/SKILL.md)       |
