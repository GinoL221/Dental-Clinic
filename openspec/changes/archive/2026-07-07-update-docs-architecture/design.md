# Design: Update Docs Architecture

## Technical Approach

This is a documentation-and-metadata change (no application code). The strategy: make **`frontend/package.json` scripts and the real config files the single source of truth**, then rewrite eight docs plus `openspec/config.yaml` to describe the actual SvelteKit stack. Every command, port, and pattern written into a doc MUST be traceable to a verified file, not to the legacy narrative or to the proposal's own wording. Satisfies specs `sveltekit-dev-workflow`, `vitest-playwright-testing`, and `svelte-check-type-safety`.

## Verified Ground Truth (source of truth)

| Fact | Verified source |
|------|-----------------|
| SvelteKit 2.5 + Svelte 4 + Vite 5, `adapter-auto` | `frontend/package.json`, `svelte.config.js` |
| `dev`→5173, `build`, `preview`/`start`→`vite preview` (4173) | `frontend/package.json` scripts |
| `test`=`vitest run`, `test:watch`=`vitest`, `test:e2e`=`playwright test` | `frontend/package.json` |
| Type check: `check`=`svelte-check`, `typecheck`=`tsc -p jsconfig.json` (JSDoc/checkJs, JS-first) | `frontend/package.json`, `jsconfig.json` |
| Auth = HTTP-only cookies `authToken`/`userRole`/`userEmail`, validated in `hooks.server.js` | `frontend/src/hooks.server.js` |
| Backend calls = server-side `apiFetch` → `process.env.BACKEND_URL \|\| http://localhost:8080` | `frontend/src/lib/api.js`, `config/apiConfig.js` |

## Architecture Decisions

### Decision: Document the real integration pattern, not a Vite proxy
**Choice**: Describe backend connectivity as **server-side `fetch` from SvelteKit load/actions/hooks to `BACKEND_URL`** (env-driven, default `:8080`).
**Alternatives considered**: Follow the proposal/spec wording that mentions a "Vite-based proxy" and SvelteKit endpoints.
**Rationale**: `vite.config.js` contains **no `server.proxy`** block. Documenting a proxy that does not exist would repeat the exact drift this change removes. Docs must reflect code.

### Decision: Cookie-session narrative replaces localStorage
**Choice**: Document HTTP-only cookie auth resolved in `hooks.server.js` into `event.locals.user`.
**Alternatives considered**: Keep client-side localStorage/JWT header language.
**Rationale**: Matches actual guard flow; localStorage is not used server-side.

### Decision: JS-first type safety via JSDoc + `checkJs`
**Choice**: Document `npm run check` (svelte-check) and `npm run typecheck` (tsc against `jsconfig.json`) as JSDoc validation, not a TypeScript rewrite.
**Rationale**: Project uses `jsconfig.json`, not `tsconfig.json`; per `svelte-check-type-safety` spec.

### Decision: Apply cognitive-doc-design shape to each file
**Choice**: Lead-with-answer, a "Quick path" command block, tables over prose, and a legacy→current mapping table as a recognition aid.
**Rationale**: Reduces reader/reviewer cognitive load; keeps commands scannable and verifiable.

## Legacy → Current Mapping (reusable across docs)

| Legacy reference | Replace with |
|------------------|--------------|
| Express 5 + EJS, `node app.js` | SvelteKit + Vite, `npm run dev` |
| Frontend port `3000`/`3001` | `5173` (dev), `4173` (preview) |
| Jest 29, `npm test`→jest | Vitest (`npm run test`) + Playwright (`npm run test:e2e`) |
| localStorage JWT + Authorization header (client) | HTTP-only cookies + `hooks.server.js` |
| `public/js/` controllers, global helpers | `+page.server.js` loaders/actions, `src/lib/api.js` |
| Vite dev proxy | Server-side `apiFetch` to `BACKEND_URL` |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `README.md` | Modify | Stack, quick-path commands, ports, testing, type-check |
| `AGENTS.md` | Modify | SvelteKit/Vite rules; require `npm run check` + `typecheck` |
| `CONEXION.md` | Modify | Dev startup (`npm run dev` @5173), cookie session, `BACKEND_URL` |
| `SPECIALTY_VERIFICATION.md` | Modify | Fix port refs, start commands |
| `frontend/README.md` | Modify | Overhaul to SvelteKit app description |
| `frontend/API-CONFIG.md` | Modify | `apiConfig.js`/`lib/api.js` + `BACKEND_URL` env |
| `frontend/API-DOCS.md` | Modify | Re-map controllers→loaders/actions/hooks |
| `openspec/config.yaml` | Modify | `stack.frontend` + `testing` → SvelteKit/Vitest/Playwright |

## config.yaml Target (metadata)

`stack.frontend`: framework `SvelteKit 2 + Svelte 4 + Vite 5`; `test_runner.command` `npm run test`, `framework` `Vitest + Playwright`. `testing.frontend.command` → `npm run test`; notes → Vitest unit + Playwright E2E, `npm run check` type safety.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Docs verification | Every command/port matches `package.json` | Manual grep of docs vs scripts |
| Consistency | Zero `Express`/`EJS`/`Jest`/`localStorage`/`3000`/`3001` left | `rg` sweep across changed files |
| Metadata | `config.yaml` parses and reflects stack | YAML lint + review |

## Migration / Rollout

No migration required. Docs-only; rollback via `git checkout` per proposal.

## Open Questions

- [ ] Confirm `preview` port is documented as `4173` (Vite default) even though `sveltekit-dev-workflow` spec text says `4173`/`5173`.
- [ ] Confirm no future Vite proxy is planned; if it is, `api-routing-proxy` docs should note it as roadmap, not current state.
