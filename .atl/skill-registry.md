# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When writing or reviewing Java backend code — controllers, services, repositories, entities, DTOs, Spring Security, exception handling | spring-boot | /home/gino/.config/opencode/skills/spring-boot/SKILL.md |
| When adding routes, controllers, EJS views, or client-side JS modules in the Node/Express/EJS frontend | express-ejs | /home/gino/.config/opencode/skills/express-ejs/SKILL.md |
| When a PR would exceed 400 changed lines, when planning chained PRs, stacked PRs, or reviewable slices | gentle-ai-chained-pr | /home/gino/.config/opencode/skills/chained-pr/SKILL.md |
| When implementing a change, preparing commits, splitting PRs, or planning chained or stacked PRs | work-unit-commits | /home/gino/.config/opencode/skills/work-unit-commits/SKILL.md |
| When drafting or posting feedback, review comments, maintainer replies, Slack messages, or GitHub comments | comment-writer | /home/gino/.config/opencode/skills/comment-writer/SKILL.md |
| When writing guides, READMEs, RFCs, onboarding docs, architecture docs, or review-facing documentation | cognitive-doc-design | /home/gino/.config/opencode/skills/cognitive-doc-design/SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature | issue-creation | /home/gino/.config/opencode/skills/issue-creation/SKILL.md |
| When creating a pull request, opening a PR, or preparing changes for review | branch-pr | /home/gino/.config/opencode/skills/branch-pr/SKILL.md |
| When writing Go tests, using teatest, or adding test coverage | go-testing | /home/gino/.config/opencode/skills/go-testing/SKILL.md |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" | judgment-day | /home/gino/.config/opencode/skills/judgment-day/SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI | skill-creator | /home/gino/.config/opencode/skills/skill-creator/SKILL.md |
| When managing React state with Zustand | zustand-5 | /home/gino/.config/opencode/skill/zustand-5/SKILL.md |
| When using Zod for validation - breaking changes from v3 | zod-4 | /home/gino/.config/opencode/skill/zod-4/SKILL.md |
| When writing TypeScript code - types, interfaces, generics | typescript | /home/gino/.config/opencode/skill/typescript/SKILL.md |
| When styling with Tailwind - cn(), theme variables, no var() in className | tailwind-4 | /home/gino/.config/opencode/skill/tailwind-4/SKILL.md |
| When writing React components - no useMemo/useCallback needed | react-19 | /home/gino/.config/opencode/skill/react-19/SKILL.md |
| When writing Python tests - fixtures, mocking, markers | pytest | /home/gino/.config/opencode/skill/pytest/SKILL.md |
| When user asks to review a PR, check a PR, or gives a PR URL | pr-review | /home/gino/.config/opencode/skill/pr-review/SKILL.md |
| When writing E2E tests - Page Objects, selectors, MCP workflow | playwright | /home/gino/.config/opencode/skill/playwright/SKILL.md |
| When working with Next.js - routing, Server Actions, data fetching | nextjs-15 | /home/gino/.config/opencode/skill/nextjs-15/SKILL.md |
| When user asks to create a Jira task, ticket, or issue | jira-task | /home/gino/.config/opencode/skill/jira-task/SKILL.md |
| When user asks to create an epic, large feature, or multi-task initiative | jira-epic | /home/gino/.config/opencode/skill/jira-epic/SKILL.md |
| When building REST APIs with Django - ViewSets, Serializers, Filters | django-drf | /home/gino/.config/opencode/skill/django-drf/SKILL.md |
| When building AI chat features - breaking changes from v4 | ai-sdk-5 | /home/gino/.config/opencode/skill/ai-sdk-5/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### spring-boot
- Architecture: `Controller → IService (interface) → ServiceImpl → IRepository`. No business logic in controllers.
- Always use constructor injection (or `@RequiredArgsConstructor`). Never `@Autowired` on fields.
- Never return JPA entities from endpoints. Always return DTO via `ResponseEntity<DTO>`.
- Every non-public endpoint needs `@PreAuthorize`. Roles: `ADMIN`, `DENTIST`, `PATIENT`.
- All exceptions go through `GlobalExceptionHandler` (`@RestControllerAdvice`). Throw `ResourceNotFoundException` or `IllegalArgumentException` from service. Never return raw errors from controllers.
- Secrets via `@Value("${property}")`. Never hardcode credentials or keys.
- Use `@Valid` on `@RequestBody` in controllers; use Bean Validation annotations on DTO fields.
- Pagination: `Pageable` in repository, `PageRequest.of(page, size)` in controller.
- JWT stateless. Get current user from `SecurityContextHolder.getContext().getAuthentication().getPrincipal()`.
- Entity inheritance: `User → Patient/Dentist` with `InheritanceType.JOINED`. Use `@EqualsAndHashCode(callSuper = true)` on subclasses.
- Always `.orElseThrow(() -> new ResourceNotFoundException(...))` — never `.get()` without empty check.
- Package root: `com.dh.dentalClinicMVC`. File layout: `controller/`, `service/I*Service.java`, `service/impl/*ServiceImpl.java`, `repository/`, `dto/`, `entity/`, `exception/`.

### express-ejs
- `const`/`let` only — never `var`.
- Thin routes → controller functions → `res.render()`. Zero logic in route files.
- One controller file per action (`dentistList.js`, `dentistAdd.js`…); barrel re-export in `{entity}/index.js`.
- EJS templates = presentational only; no business logic in `<% %>` blocks beyond iteration and conditionals.
- `user`, `isAdmin`, `isPatient`, `isDentist`, `clearAuthScript` already in `res.locals` via `userDataMiddleware` — never pass manually to `res.render()`.
- Client JS = ES modules (`type="module"`); server JS = CommonJS (`require`/`module.exports`). Never mix.
- Client API calls → `public/js/api/{entity}-api.js` (imports `API_BASE_URL`, `getAuthHeaders` from `config.js`).
- Client UI logic → `public/js/{entity}/{page}-controller.js`.
- Server logs → `require('../../utils/logger-server')`; browser logs → `import logger from '../logger.js'`. Never `console.log` in production paths.
- All config from `process.env`. Validate required vars at startup (fail-fast before app creation).
- Secrets in `.env` (gitignored); every var documented in `.env.example`.

### gentle-ai-chained-pr
- MUST split when a PR exceeds 400 changed lines (additions + deletions), unless maintainer-approved `size:exception`
- Design each PR for an approximately ≤60-minute human review
- One deliverable work unit per PR — do not mix unrelated refactors, features, tests, or docs
- Every chained PR MUST state start, end, what came before, and what comes next
- Every chained PR MUST include a dependency diagram marking the current PR with 📍
- Ask the user to choose chain strategy: Stacked PRs to main, Feature Branch Chain, or size:exception
- In Feature Branch Chain: PR #1 targets the tracker branch; every later child PR targets the immediate previous PR branch
- Do NOT mix stacked and feature branch patterns in the same chain

### work-unit-commits
- A commit represents a deliverable behavior, fix, migration, or docs unit — not a file type
- Keep tests in the same commit as the behavior they verify
- Keep docs with the user-visible change they explain
- Each commit must have one clear purpose and the repo must make sense after applying only that commit
- Commit message explains the outcome, not the file list (use Conventional Commits)
- If SDD tasks forecast a >400-line change, group commits into chained PR slices before implementation

### comment-writer
- Start with the actionable point — no preamble or PR recap
- Be warm and direct, like a thoughtful teammate, not a corporate bot
- Prefer 1-3 short paragraphs or a tight bullet list
- Give the technical reason when asking for a change
- Match thread language; in Spanish use Rioplatense/voseo: `podés`, `tenés`, `fijate`
- No em dashes — use commas, periods, or parentheses instead
- Comment on highest-value issues only, not every preference

### cognitive-doc-design
- Lead with the answer — decision/action/outcome first, context after
- Progressive disclosure: happy path first, then details and edge cases
- Group related information into small sections (chunking)
- Use headings, labels, callouts so readers know where they are (signposting)
- Prefer tables, checklists, examples over prose that must be remembered
- In PRs: state what to review first, what's out of scope, link previous/next PR

### issue-creation
- Blank issues are disabled — MUST use a template (bug report or feature request)
- Every issue gets `status:needs-review` automatically on creation
- A maintainer MUST add `status:approved` before any PR can be opened
- Questions go to Discussions, not issues
- Workflow: search duplicates → choose template → fill all required fields → submit → wait for `status:approved` → then open PR

### branch-pr
- Every PR MUST link an approved issue (Closes/Fixes/Resolves #N) — no exceptions
- Every PR MUST have exactly one `type:*` label
- Branch names MUST match: `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\/[a-z0-9._-]+$`
- Commit messages MUST match Conventional Commits: `type(scope): description`
- No `Co-Authored-By` trailers
- Run shellcheck on modified scripts before pushing

### go-testing
- Use table-driven tests: `tests := []struct{name, input, expected, wantErr}{}` with `t.Run(tt.name, ...)`
- Test TUI Model state transitions directly via `m.Update(tea.KeyMsg{...})`
- Use `teatest.NewTestModel()` for full interactive TUI flow testing
- Use golden files in `testdata/` for visual output comparisons with `-update` flag support
- Mock `os/exec` via interfaces; use `t.TempDir()` for file operations

### judgment-day
- Launch TWO independent blind judge sub-agents in parallel via `delegate` — never sequential, never self-review
- Resolve skill registry first (engram → .atl/skill-registry.md) and inject matching compact rules into BOTH judge prompts
- Classify every WARNING: `WARNING (real)` = normal user can trigger it; `WARNING (theoretical)` = requires contrived scenario
- Theoretical warnings are INFO only — do NOT fix, do NOT re-judge, do NOT block approval
- APPROVED criteria: 0 confirmed CRITICALs + 0 confirmed real WARNINGs
- After Round 1: ASK user before fixing. After Round 2: only re-judge for confirmed CRITICALs
- After 2 fix iterations with remaining issues: ASK user whether to continue

### skill-creator
- Skills live in `skills/{skill-name}/SKILL.md` with optional `assets/` and `references/`
- Frontmatter MUST have: `name`, `description` (includes Trigger), `license: Apache-2.0`, `metadata.author`, `metadata.version`
- Start SKILL.md with Critical Patterns — the most important rules first
- Use tables for decision trees, minimal focused code examples
- Do NOT add Keywords section; do NOT duplicate existing docs
- After creating, register in AGENTS.md

### zustand-5
- Use `create<StoreType>((set) => ({...}))` — always type the store interface
- Select specific fields to prevent unnecessary re-renders: `useStore((state) => state.field)`
- For multiple fields use `useShallow`: `useStore(useShallow((state) => ({ a: state.a, b: state.b })))`
- Never select the entire store object — causes re-render on any change
- Use persist middleware with `name` key for localStorage persistence
- Use slices pattern for large stores; compose with `...createSlice(...args)`
- Use immer middleware for complex nested state mutations

### zod-4
- Breaking: `z.string().email()` → `z.email()`, same for `z.uuid()`, `z.url()`
- Breaking: `z.string().nonempty()` → `z.string().min(1)`
- Breaking: error messages use `error` param, not `message`: `z.string({ error: "..." })`
- Use `safeParse` for non-throwing validation; `parse` throws on error
- Use `z.discriminatedUnion` over `z.union` for better performance on tagged unions
- Use `z.coerce.number()` / `z.coerce.date()` for type coercion from strings

### typescript
- ALWAYS use const objects with `as const` then extract type: `type T = (typeof OBJ)[keyof typeof OBJ]` — never direct union literals
- ALWAYS flat interfaces — one level deep; nested objects get dedicated interfaces
- NEVER use `any` — use `unknown` for truly unknown types, generics for flexible types
- Use `import type` for type-only imports
- Type guards: `function isX(val: unknown): val is X { ... }`
- Utility types: `Pick`, `Omit`, `Partial`, `Required`, `Readonly`, `ReturnType`, `Parameters`

### tailwind-4
- NEVER use `var()` in `className` — use Tailwind semantic classes instead
- NEVER use hex colors in `className` — use Tailwind color classes
- Use `cn()` (clsx + twMerge) for conditional or merged classes; static classes need no `cn()`
- `var()` is only allowed in `style` prop for libraries that can't accept `className` (e.g. Recharts)
- Dynamic values go in `style` prop: `style={{ width: \`${x}%\` }}`
- Use Tailwind arbitrary values `w-[327px]` only for one-off values not in design system

### react-19
- No `useMemo`/`useCallback` — React Compiler handles memoization automatically
- Always named imports: `import { useState, useEffect } from "react"` — never default import
- Server Components by default (no directive); add `'use client'` only for interactivity/hooks/browser APIs
- `ref` is a regular prop — no `forwardRef` needed
- Use `use()` hook for promises and context (can be used conditionally)
- Use `useActionState` for form mutations; `useOptimistic` for optimistic UI

### pytest
- Use class-based test grouping: `class TestFeature:` with `def test_case(self):`
- Fixtures via `@pytest.fixture`; use `yield` for setup/teardown; scope: function (default), class, module, session
- Shared fixtures go in `conftest.py`
- Mock with `patch("module.path.to.object")` as context manager or decorator
- Use `@pytest.mark.parametrize("input,expected", [...])` for data-driven tests
- `@pytest.mark.asyncio` for async tests
- Run specific tests: `pytest -k "test_name"`, markers: `pytest -m "not slow"`

### pr-review
- Fetch PR diff excluding lockfiles: `gh pr diff {N} -- ':(exclude)**/pnpm-lock.yaml'`
- Only comment on CRITICAL (production break/security/data loss), NEEDS REVIEW (confirm intent), or QUESTION
- Do NOT comment on style preferences, nitpicks, or "I'd do it differently" items
- NEVER assume — verify claims against docs before flagging as wrong
- Write like a Slack message to a colleague, not a formal review template
- Put all findings in ONE comment, not separate comments per issue

### playwright
- If Playwright MCP tools are available, ALWAYS navigate and snapshot BEFORE writing any test code
- Selector priority: `getByRole` > `getByLabel` > `getByText` (sparingly) > `getByTestId` (last resort)
- NEVER use `.locator(".class")` or `.locator("#id")` selectors
- All tests for a page in ONE spec file: `{page-name}.spec.ts` — no split spec files
- All page objects extend `BasePage`; check for existing page objects before creating new ones
- Common patterns (notifications, modals, navigation) belong in `BasePage`, not per-page classes
- "a test" / "one test" = single `test()` in existing spec; "comprehensive tests" = full suite

### nextjs-15
- Server Components by default (no directive needed) — async functions that fetch data directly
- Add `'use server'` to Server Actions files; use `revalidatePath()` after mutations
- Add `'use client'` only when using hooks, event handlers, or browser APIs
- Data fetching: use `Promise.all` for parallel, `<Suspense>` for streaming
- Metadata: `export const metadata = {...}` (static) or `export async function generateMetadata()` (dynamic)
- Use `server-only` package to prevent server code from leaking to client bundles
- Route handlers: `app/api/{route}/route.ts` with named exports `GET`, `POST`, etc.

### jira-task
- For bugs: create separate sibling tasks per component (API first, UI blocked by API)
- For features: create parent task (user perspective, no tech details) + child tasks per component
- Title format: `[BUG|FEATURE|ENHANCEMENT|REFACTOR|DOCS|CHORE] Description (Component)`
- Every task needs: Description, Acceptance Criteria, Technical Notes (affected files), Testing checklist
- Always specify blocked-by / blocks relationships in Related Tasks section
- Multi-component work MUST be split — never one task for API + UI + SDK together

### jira-epic
- Title format: `[EPIC] Feature Name`
- Required sections: Feature Overview, Requirements (by functional area), Technical Considerations, Implementation Checklist
- Technical Considerations MUST include: Performance, Data Integration, UI Components
- Each Implementation Checklist item = potential separate Jira task
- Order checklist by dependency (API before UI)
- After creating epic, generate suggested tasks table with component and blocked-by columns

### django-drf
- Use `ModelViewSet` for standard CRUD; override `get_serializer_class()` for action-specific serializers
- Create separate serializers: Read, Create, Update — never one serializer for all operations
- Use `FilterSet` classes for query filtering, never manual `filter()` in views
- Custom permissions extend `BasePermission` with `has_permission` and `has_object_permission`
- Use `DefaultRouter` for URL registration — no manual URL patterns for ViewSets
- Tests use `APIClient` with `force_authenticate(user=user)` — no password auth in tests

### ai-sdk-5
- Breaking: import `useChat` from `@ai-sdk/react`, not from `ai`
- Breaking: pass transport object: `useChat({ transport: new DefaultChatTransport({ api: "/api/chat" }) })`
- Breaking: `message.content` (string) → `message.parts` (array of typed parts)
- Extract text: `message.parts.filter(p => p.type === "text").map(p => p.text).join("")`
- `sendMessage({ text: input })` replaces the old `handleSubmit` pattern
- Server route returns `result.toDataStreamResponse()` from `streamText()`
- For LangChain integration use `toUIMessageStream()` from `@ai-sdk/langchain`

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | /home/gino/Desarrollo/Dental-Clinic/AGENTS.md | Index — references spring-boot and express-ejs skill files below |
| spring-boot SKILL.md | /home/gino/.config/opencode/skills/spring-boot/SKILL.md | Java/Spring Boot patterns (referenced by AGENTS.md) |
| express-ejs SKILL.md | /home/gino/.config/opencode/skills/express-ejs/SKILL.md | Node.js/Express/EJS patterns (referenced by AGENTS.md) |

### Convention Summary (from AGENTS.md)

**General**: No hardcoded secrets; use `.env`; `.env` never committed; remove dead code before committing.

**Java / Spring Boot**: Controller → Service (interface + impl) → Repository layering; DTOs for API responses (never expose entities); `@PreAuthorize` for security; `@Valid` for request validation; constructor injection preferred over `@Autowired`; all exceptions through `GlobalExceptionHandler`.

**JavaScript / Node.js / Express**: `const`/`let` only (no `var`); config from `process.env`; thin Express routes (logic in controllers/services); no `console.log` in production paths.

**EJS / Frontend**: Templates presentational only (no business logic); client-side JS one responsibility per file; API calls through dedicated api modules (e.g. `dentist-api.js`).

**Git**: Conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`); each commit a coherent deployable unit; never commit `node_modules`, `target/`, `.env`, or generated files.
