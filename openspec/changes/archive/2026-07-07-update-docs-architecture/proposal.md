<Proposal: Update Docs Architecture>
## Intent
Align the project's documentation and configuration with the modern decoupled SvelteKit architecture, replacing all legacy Express, EJS, Jest, and localStorage references with current stack realities to prevent developer confusion and tooling misalignment.

## Scope
### In Scope
- Update root documents: `README.md`, `AGENTS.md`, `CONEXION.md`, and `SPECIALTY_VERIFICATION.md` to reflect SvelteKit.
- Update frontend documentation: `frontend/README.md`, `frontend/API-CONFIG.md`, and `frontend/API-DOCS.md`.
- Update config: `openspec/config.yaml` to specify SvelteKit, Vitest, Playwright, and JSDoc/checkJs.
- Document SvelteKit routing, server-side hooks, cookie sessions, Vite configuration, and `svelte-check` type-checking.
- Update development ports (e.g., `5173` for SvelteKit, `8080` for backend) and testing commands.

### Out of Scope
- Modifying any application logic or source code files.
- Introducing new software dependencies or changing running code features.

## Capabilities
### New Capabilities
- `sveltekit-dev-workflow`: Documented SvelteKit-based development server, packaging, build commands, and port mapping.
- `vitest-playwright-testing`: Documented Vitest for unit tests and Playwright for E2E tests, replacing Jest.
- `svelte-check-type-safety`: Instructions on running JSDoc and `checkJs` validation for static analysis.

### Modified Capabilities
- `session-handling`: Documentation on HTTP-only cookie-based session management in SvelteKit hooks instead of client-side localStorage.
- `api-routing-proxy`: Documented Vite-based proxy configuration and SvelteKit endpoints for connecting to the Spring Boot REST API.

## Approach
- Systematically review and rewrite instructions in target markdown files.
- Re-map legacy Express controller/middleware design patterns to SvelteKit loaders/actions/hooks in `frontend/API-DOCS.md`.
- Update port mappings and workflow commands across all documentation to match SvelteKit + Vite setup.
- Update stack metadata inside `openspec/config.yaml`.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| Root Documentation (`README.md`, `AGENTS.md`, `CONEXION.md`, `SPECIALTY_VERIFICATION.md`) | High | Replaces Express/EJS instructions and port references with SvelteKit. |
| Internal Config (`openspec/config.yaml`) | Medium | Updates stack configuration metadata to SvelteKit/Vitest. |
| Frontend Documentation (`frontend/*`) | High | Rewrites architecture, config, and API documentation for SvelteKit. |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Inconsistent setup commands | Low | Verify commands against SvelteKit config and package.json scripts before applying. |

## Rollback Plan
- Revert all modified documentation and configuration files using `git checkout`.

## Dependencies
- Standard SvelteKit + Vite layout compatibility with the local Spring Boot backend.

## Success Criteria
- [ ] All target documentation files accurately describe SvelteKit SPA/MPA decoupled architecture.
- [ ] No remaining references to Express, EJS, or Jest.
- [ ] All ports, testing, and typechecking commands align with package.json scripts.
</Proposal: Update Docs Architecture>
