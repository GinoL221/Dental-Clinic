## Exploration: fix-svelte-typecheck

### Current State
Currently, running `svelte-check` inside `frontend/` using `jsconfig.json` fails with 51 errors and 10 warnings across 5 files:
1. `src/routes/+layout.svelte` — 1 error regarding a nonexistent property on `user`, plus 4 accessibility warnings (invalid `href="#"`).
2. `src/routes/appointments/add/+page.svelte` — 3 accessibility warnings regarding unassociated labels.
3. `src/routes/appointments/edit/[id]/+page.svelte` — 3 accessibility warnings regarding unassociated labels.
4. `src/routes/dashboard/+page.svelte` — 46 errors regarding implicit `any` parameter types, lack of index signatures on types, implicitly typed variables, and a missing global definition for dynamic library `uPlot`.
5. `src/routes/login/+page.svelte` — 5 errors due to accessing `.style` property on a generic `Element` returned by `document.querySelector(".auth-card")`.

### Affected Areas
- `frontend/package.json` — Add `svelte-check` to `devDependencies` and define `"check": "svelte-check --tsconfig ./jsconfig.json"` script.
- `frontend/src/routes/+layout.svelte` — Fix property check (`user.firstName`) and correct the invalid `#` `href` links or add proper roles.
- `frontend/src/routes/appointments/add/+page.svelte` — Fix non-associated form labels by wrapping or linking them to the displayed text.
- `frontend/src/routes/appointments/edit/[id]/+page.svelte` — Fix non-associated form labels similar to the add page.
- `frontend/src/routes/dashboard/+page.svelte` — Add JSDoc types (`/** @type {...} */` and `/** @param {...} */`) for chart references, date formatting parameters, callback functions, and handle standard types for uPlot initialization.
- `frontend/src/routes/login/+page.svelte` — Cast `document.querySelector` element to `HTMLElement`.
- `frontend/global.d.ts` — Relocate to `frontend/src/global.d.ts` or add `global.d.ts` to `jsconfig.json`'s files/include so TypeScript/checkJs compiler reads `uPlot` global definition.

### Approaches
1. **Dynamic / JSDoc Type Annotations & Typecasting** — Declare/cast implicit `any` types using standard JSDoc (`/** @type {any} */` or specific types/interfaces) and move `global.d.ts` to `src/global.d.ts`.
   - Pros: Corrects all 51 type errors without migrating files to `.ts`, preserving pure `.js` / Svelte setup.
   - Cons: JSDoc type syntax can be verbose in inline arrow functions.
   - Effort: Low

2. **Disable checkJs or Strict check in jsconfig.json** — Lower the compiler strictness settings in `jsconfig.json` (e.g. setting `checkJs: false` or `noImplicitAny: false`).
   - Pros: Instantly removes the errors from the build check.
   - Cons: Disables valuable static analysis and type safety checks for Svelte routes.
   - Effort: Low

### Recommendation
Option 1 (JSDoc Type Annotations & Typecasting) is recommended as it preserves the target level of strict type safety configured in `jsconfig.json` while successfully eliminating all compiler warnings and errors. Moving `global.d.ts` to `src/global.d.ts` will ensure that all global variables like `uPlot` are correctly registered by the compiler.

### Risks
- Minor runtime assumptions about the shape of `user` or dynamically loaded `uPlot` API might not be fully checked if typing is too loose (`any`), but JSDoc casting is safer than no check.

### Ready for Proposal
Yes
