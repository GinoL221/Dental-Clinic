## Exploration: Resolve client-side JSDoc/type warnings under public/js/

### Current State
Currently, `frontend/jsconfig.json` has `"checkJs": true` enabled. When running typescript checkJs diagnostics (`tsc --noEmit`), there are 1,314 type warnings/errors in 52 client-side JavaScript files under `public/js/`. The main categories of these warnings are:
1. **Implicit Any Types (TS7006, TS7019)**: Function parameters, rest parameters, and controller variables that lack explicit JSDoc type annotations.
2. **Missing Window Properties (TS2339)**: Client-side JS code sets or accesses custom attributes/methods on `window` (e.g., `window.patientController`, `window.loadPatientsList`, `window.APP_DEBUG`), which TypeScript flags as errors because they are not part of the standard `Window` declaration.
3. **DOM Elements Mismatch (TS2339)**: Accessing properties like `.value`, `.style`, `.disabled`, or `.classList` on generic `HTMLElement` or `Element` or `EventTarget` (from `e.target`) objects, which TypeScript does not guarantee will exist.
4. **Date Options Overload (TS2769)**: Passing literal date format options to `toLocaleDateString` causing type compatibility warnings.

### Affected Areas
- `frontend/public/js/utils/date-utils.js` — Parameters lack type definitions; incorrect option types in `toLocaleDateString`.
- `frontend/public/js/logger.js` — Rest parameter `...args` lacks a type; `window.APP_DEBUG` is not declared on `Window`.
- `frontend/public/js/**/*.js` — Controllers and modules under `public/js/` (e.g. `appointment-controller.js`, `patient-list-controller.js`) contain missing parameter type annotations, custom `window` assignments, and untyped DOM node queries.
- `frontend/src/config/apiConfig.js` — Circular dependency warning (`TS7022` and `TS2502`) due to self-referencing config object.

### Approaches
1. **Comprehensive Inline JSDoc & Casts** — Add JSDoc annotations to all functions/parameters and use inline JSDoc casting (e.g., `/** @type {any} */(window).someFunc`) for all window/DOM references.
   - Pros: Explicit type corrections; does not introduce extra files.
   - Cons: Clutters JavaScript source files with heavy casting boilerplate; highly repetitive; high maintenance.
   - Effort: High

2. **JSDoc Annotations + `global.d.ts` Declaration File** — Create a `global.d.ts` file in the frontend root to extend the `Window` interface with custom properties, and add clean JSDoc `@param` and `@type` comments in the JS files for parameters, local variables, and DOM operations.
   - Pros: Clean separation; zero clutter/casting needed for global `window` assignments; standard TypeScript/JS configuration pattern; significantly reduces code modifications.
   - Cons: Introduces a single `.d.ts` file (which is standard practice for JS workspaces with checkJs).
   - Effort: Medium

### Recommendation
We recommend **Approach 2 (JSDoc Annotations + `global.d.ts`)**. Adding `global.d.ts` resolves over 100+ global `Window` property errors without modifying the JavaScript files, while JSDoc annotations on parameters, variables, and DOM element casts resolve the remaining checkJs diagnostics in a clean, readable manner.

### Risks
- **Casting to `any`**: Injudicious use of `any` casts could hide actual type bugs. We should use specific types (e.g., `HTMLInputElement`, `HTMLSelectElement`, specific controller types) wherever possible.
- **Node vs. Browser environments**: The build/test environment (Jest) is Node-based, whereas public scripts run in the browser. Using a `global.d.ts` with browser-focused definitions must be configured carefully so it doesn't conflict with server-side tests.

### Ready for Proposal
Yes — the next step is to create a proposal to introduce `global.d.ts` and modify the affected JS files to add JSDoc annotations.
