# Design: fix-svelte-typecheck

## Technical Approach
Implement static type-checking in the Svelte frontend by integrating `svelte-check` and resolving all existing type-checking and accessibility compilation errors. We will use JSDoc annotations to add typings in JavaScript files/templates, apply type assertions for DOM manipulation, relocate global declarations to `src/global.d.ts` so they are within the compiler's entry scopes, and fix unassociated HTML labels and navigation elements to satisfy a11y checks.

## Architecture Decisions
### Decision: uPlot Global Declaration Strategy
- **Choice**: Relocate `global.d.ts` to `frontend/src/global.d.ts` and define `uPlot` as a global class and namespace within `declare global`.
- **Alternatives**: Leave it at `frontend/global.d.ts` and reference it as `var uPlot: any`.
- **Rationale**: Declaring it as a class inside the `src/` directory ensures SvelteKit's compiler auto-discovers it. Specifying its constructor and methods enables proper static analysis and prevents implicit `any` and missing method compiler errors.

### Decision: JSDoc Annotations for Template Scripts
- **Choice**: Use JSDoc annotations (`/** @type {...} */` and `/** @param {...} */`) inside `<script>` blocks.
- **Alternatives**: Migrate the project to TypeScript (`.ts`) files, or disable strict type checks (`checkJs: false`).
- **Rationale**: Preserves the pure JS workflow of the frontend while enforcing compilation-level type checking and keeping development overhead low.

## Data Flow
The dynamic loading and rendering flow for the chart component in `dashboard/+page.svelte` behaves as follows:

```
[Page Mount] ---> [onMount()] ---> [Dynamic Load: uPlot.min.js]
                                              |
                                              v
[Data Update] ---> [renderChart()] <--- [uPlot Global Resolved]
                         |
                         v
       [chart = new uPlot(options, data, container)]
                         |
                         +---> [window.onresize: chart.setSize]
                         +---> [destroy(): chart.destroy]
```

## File Changes
| File | Action | Description |
|---|---|---|
| `frontend/package.json` | Modify | Add `svelte-check` to `devDependencies` and add `"check": "svelte-check --tsconfig ./jsconfig.json"` to `"scripts"`. |
| `frontend/global.d.ts` | Delete | Remove obsolete root-level declaration file. |
| `frontend/src/global.d.ts` | Create | Declare global `uPlot` class/namespace and migrate existing `Window` types. |
| `frontend/src/routes/+layout.svelte` | Modify | Fix property check `user.firstName` (removing reference to `user.name`) and change `href="#"` anchors to `<button>` elements or include a11y ignores. |
| `frontend/src/routes/dashboard/+page.svelte` | Modify | Type `chart`, `chartContainer`, `chartLabelMap`, and add `@param` types to `formatLocalDate`, `getStatusLabel`, and `getStatusClass`. |
| `frontend/src/routes/login/+page.svelte` | Modify | Add `/** @type {HTMLElement | null} */` cast on the `auth-card` DOM query selector. |
| `frontend/src/routes/appointments/add/+page.svelte` | Modify | Convert read-only labels for "Nombre", "Apellido", and "Email" to `<span>` tags. |
| `frontend/src/routes/appointments/edit/[id]/+page.svelte` | Modify | Convert read-only labels for "Nombre", "Apellido", and "Email" to `<span>` tags. |

## Interfaces / Contracts
### 1. Global Declarations (`frontend/src/global.d.ts`)
```typescript
declare global {
  class uPlot {
    constructor(opts: any, data: any[], target: HTMLElement);
    destroy(): void;
    setData(data: any[]): void;
    setScale(scale: string, limits: any): void;
    setSize(size: { width: number; height: number }): void;
    static paths: {
      spline: () => any;
      [key: string]: any;
    };
  }
}
```

### 2. JSDoc Function Signatures (`dashboard/+page.svelte`)
```javascript
/** @type {HTMLElement} */
let chartContainer;

/** @type {uPlot | null} */
let chart;

/** @type {Record<number, string>} */
let chartLabelMap = {};

/**
 * @param {string | null | undefined} dateString
 * @returns {string}
 */
function formatLocalDate(dateString);

/**
 * @param {string} status
 * @returns {string}
 */
function getStatusLabel(status);

/**
 * @param {string} status
 * @returns {string}
 */
function getStatusClass(status);
```

### 3. Type Assertion (`login/+page.svelte`)
```javascript
const authCard = /** @type {HTMLElement | null} */ (document.querySelector(".auth-card"));
```

## Testing Strategy
| Layer | What to Test | Approach |
|---|---|---|
| Static Analysis | Svelte Template Compilation | Run `npm run check` in the frontend directory. Must output 0 errors and 0 warnings. |
| Unit Testing | Utility Helpers | Run `npm run test` to verify helper formatting results. |

## Migration / Rollout
1. **Dependencies**: Run `npm install --save-dev svelte-check` in `/home/ginopc/Desarrollo/Dental-Clinic/frontend`.
2. **Move and Edit Global Types**: Relocate `global.d.ts` to `src/global.d.ts` and add `class uPlot` inside `declare global`.
3. **Configure scripts**: Register `"check"` script in `package.json`.
4. **Fix Components**: Apply JSDoc annotations and DOM/layout fixes in routes.
5. **Verify**: Run `npm run check` and ensure compile passes.

## Open Questions
- None.
