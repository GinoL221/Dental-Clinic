## Technical Approach
Replaces the legacy Express/EJS server and client-side Vanilla JS fetch handlers with a unified SvelteKit SSR and client application.
- Centralizes authentication checks inside SvelteKit server hooks (`hooks.server.js`).
- Migrates page rendering and data fetching to Svelte components and server-side page loaders (`+page.server.js`).
- Utilizes Form Actions for API mutations, forwarding backend tokens via custom request headers.
- Reuses 100% of existing CSS stylesheets by importing them globally or scoped per route.

## Architecture Decisions
### Decision: Centralized Session Validation Hook
- **Choice**: Validating auth cookies inside `hooks.server.js` and injecting user metadata into `event.locals.user`.
- **Alternatives**: Client-side auth checks or validation inside every page loader.
- **Rationale**: Centralized hook execution guarantees that all guarded routes are protected before execution, preventing layout and page leaks.

### Decision: Reusing Existing Styling System
- **Choice**: Load base CSS globally in `+layout.svelte` and load view-specific CSS directly within views via static file links.
- **Alternatives**: Rewriting CSS into Svelte scoped classes or TailwindCSS.
- **Rationale**: Maintains design fidelity, prevents UI regressions, and saves migration effort.

### Decision: Test Runner Migration
- **Choice**: Migrating from Jest/Supertest to Vitest (for loaders, components, hook unit tests) and Playwright (for full E2E journeys).
- **Alternatives**: Retaining Jest for unit testing and using Cypress for E2E.
- **Rationale**: Playwright is SvelteKit's standard for E2E. Vitest offers faster compilation and seamless integration with Vite.

## Data Flow
```
[Client Browser]
       │
   (1) Request Page / Form Submit
       │
       ▼
┌─────────────────────────────────────────┐
│            SvelteKit Server             │
│                                         │
│  (2) hooks.server.js                    │
│      ├── Extract Cookies (authToken)    │
│      └── Fetch /api/auth/validate ──────┼─────────┐
│                                         │         │ (3) Validation Check
│  (4) +layout.server.js / +page.server.js │         │
│      ├── Read event.locals.user         │         │
│      └── Fetch Data (Spring Boot API) ──┼──┐      │
│                                         │  │      ▼
└──────────────────┬──────────────────────┘  │  ┌───────────────────────┐
                   │                         │  │   Spring Boot Backend │
            (5)    │ Render Page (SSR)       │  │   REST API            │
            HTML   │                         └─►│                       │
                   ▼                            │                       │
[Client Browser (Hydration / SPA)]              └───────────────────────┘
```

## File Changes
| File | Action | Description |
|---|---|---|
| `frontend/app.js` | Delete | Legacy Express configuration. |
| `frontend/src/views/` | Delete | Removed EJS templates. |
| `frontend/src/routes/` | Delete | Removed Express controllers & routes. |
| `frontend/public/js/` | Delete | Removed Vanilla JS controllers. |
| `frontend/public/` | Move | Moved assets/CSS to `frontend/static/`. |
| `frontend/svelte.config.js` | Add | SvelteKit configuration. |
| `frontend/vite.config.js` | Add | Vite/Vitest configuration. |
| `frontend/playwright.config.js` | Add | Playwright E2E configuration. |
| `frontend/src/hooks.server.js` | Add | Session verification hook. |
| `frontend/src/lib/api.js` | Add | Spring Boot API wrapper. |
| `frontend/src/routes/+layout.svelte` | Add | Global layout with header/footer. |
| `frontend/src/routes/login/` | Add | Login view and form action. |
| `frontend/src/routes/users/register/` | Add | Register view and form action. |
| `frontend/src/routes/dashboard/` | Add | Admin stats dashboard. |
| `frontend/src/routes/patients/` | Add | Patients route folder (add, edit, list). |
| `frontend/src/routes/dentists/` | Add | Dentists route folder (add, edit, list). |
| `frontend/src/routes/appointments/` | Add | Appointments route folder (add, edit, list). |

## Interfaces / Contracts
```typescript
interface SessionUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'PATIENT' | 'DENTIST';
  token: string;
}

// event.locals Schema (hooks.server.js)
interface Locals {
  user: SessionUser | null;
}

// Spring Boot API client function signatures
export function getAuthHeaders(token: string): { Authorization: string };
export function apiFetch(endpoint: string, options?: RequestInit): Promise<any>;
```

## Testing Strategy
| Layer | What to Test | Approach |
|---|---|---|
| Unit | Helper utilities | Test date formats/validators in Vitest. |
| Integration | Hook & Loaders | Mock `/api/auth/validate` responses; verify redirects to `/login`. |
| E2E | Auth Journeys | Automate user logins and verify role-based redirection to `/dashboard` or `/login`. |
| E2E | Resource CRUD | Create, edit, and delete patients/dentists/appointments in browser. |

## Vitest & Playwright Configurations
### Vitest Configuration (`frontend/vite.config.js`)
```javascript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.js']
  }
});
```

### Playwright Configuration (`frontend/playwright.config.js`)
```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI
  },
  testDir: 'tests',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
```

## Migration / Rollout
1. **Scaffold Infrastructure**: Configure `package.json`, `svelte.config.js`, and config files.
2. **Hook Integration**: Implement `hooks.server.js` and `/api/auth/validate` check.
3. **Core Shell**: Setup global `+layout.svelte`, `Header.svelte`, and global styling rules.
4. **Incremental Views Migration**: Auth pages -> Landing -> Dashboard (Admin validation) -> Patients -> Dentists -> Appointments.
5. **Clean Up**: Remove legacy EJS, Express, and Jest test runner configs.
6. **Validation**: Execute Vitest unit suite and Playwright E2E suites.

## Open Questions
- Should `/users/login` redirect permanently with HTTP 301 to `/login` for external bookmarks?
- Do we support JWT token refresh automatically inside `hooks.server.js` if `/api/auth/validate` fails with 401 but a refresh cookie is active?
