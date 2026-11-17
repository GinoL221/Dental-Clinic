# Frontend Visual Consistency — Open Design + Impeccable

Branch: `feat/frontend-visual-consistency`
Scope: Vault-guided frontend audit, root cleanup, design-system sync (`design/system.md` + `design/system.html`), selective Open Design artboards for missing/structural screens, and sector-by-sector Impeccable remediation.

## Specs

- S1: "que te parece si hacemos una revision total del front con open desing e impeccable para que la identidad visual del proyecto quede consistente? siguiendo la guia de mi vault"
- S2 (Identidad visual): "Open Design solo en pantallas faltantes/estructura" — Conservar la paleta actual (`#4a90e2` + `#a4e2c2`) y crear artboards en `design/` solo para pantallas faltantes o con problemas estructurales.
- S3 (Limpieza raíz): "si agrega esa limpieza" / "Eliminarlo y actualizar CONEXION.md (Recomendado)" — Eliminar `SPECIALTY_VERIFICATION.md` de la raíz y quitar su mención al final de `CONEXION.md`.
- S4 (Alcance inicial — Fase 1): "Solo Fase 1 + limpieza primero y revisar antes de editar" — Re-sincronizar `design/system.md` y `design/system.html` contra `frontend/static/css/**` y `frontend/src/routes/+layout.svelte`, ejecutar la limpieza S3, y entregar el plan acotado por sectores para revisión del usuario antes de modificar código Svelte/CSS.
- S5 (Ejecución página por página — gated tras Fase 1): Revisar y remediar página por página para verificar que cada una respete la identidad visual (`docs/design.md` + `design/system.md`), combinando Open Design en pantallas faltantes/estructurales y Impeccable (`critique`/`audit`/`polish`) sobre el código de cada página:
  1. Shell global (`+layout.svelte`, navbar, footer, cascada `app.css`, `responsive.css`, `animations.css`)
  2. Landing (`/`)
  3. Acceso y cuenta (`/login`, `/users/register`, `/users/change-password` — artboard nuevo para change-password)
  4. Error (`+error.svelte` — artboard nuevo)
  5. Dashboard (`/dashboard` — artboard estructural si hace falta)
  6. Listados (`/patients`, `/dentists`, `/appointments`, `ListPageHeader`, `EmptyState`, `ConfirmDialog`, `tables.css`)
  7. Formularios ABM (`/patients/add|edit`, `/dentists/add|edit`, `/appointments/add|edit` — artboard para `/dentists/edit/[id]`)

## Tasks

- [x] T1 (S3) Remove `SPECIALTY_VERIFICATION.md` and update `CONEXION.md` — route: inline — commit: pending (awaiting user commit auth)
- [x] T2 (S2, S4) Re-sync `design/system.md` and `design/system.html` from `frontend/static/css/**` and `+layout.svelte` — route: inline — commit: pending (awaiting user commit auth)
- [x] T3 (S1, S4) Document Phase 1 diagnosis and sector-by-sector Phase 2–3 plan for user review before any Svelte/CSS edits — route: inline — commit: pending (awaiting user commit auth)
- [ ] T4 (S2, S5) [Gated] Shell global: `+layout.svelte`, navbar, footer, cascada `app.css`, breakpoints, `animations.css` — route: inline — commit: pending
- [ ] T5 (S2, S5) [Gated] Página `/` (Landing): alinear `landing.css` / `+page.svelte` vs `01-landing.html` y contraste AA — route: inline — commit: pending
- [ ] T6 (S2, S5) [Gated] Páginas `/login`, `/users/register`, `/users/change-password`: artboard change-password + `FormCard`/`<h1>`/animación/tokens — route: gentle-design+inline — commit: pending
- [ ] T7 (S2, S5) [Gated] Página `+error.svelte`: artboard + título AA sin gradiente sobre claro — route: gentle-design+inline — commit: pending
- [ ] T8 (S2, S5) [Gated] Página `/dashboard`: revisar estructura (`03-dashboard.html`), eliminar `!important`, tokens en `dashboardCharts.js` y `<h1>` — route: gentle-design+inline — commit: pending
- [ ] T9 (S2, S5) [Gated] Páginas de listados (`/patients`, `/dentists`, `/appointments`): `tables.css` `thead` AA, `ListPageHeader` a11y/contador y `ConfirmDialog` tokens — route: inline — commit: pending
- [ ] T10 (S2, S5) [Gated] Formularios ABM (`/patients/*`, `/dentists/*`, `/appointments/*`): artboard `dentists/edit/[id]`, `.auth-input`, `Cancelar`/submit y campos bloqueados por rol + verificación final — route: gentle-design+inline — commit: pending

## Log

- L1: User request: "que te parece si hacemos una revision total del front con open desing e impeccable para que la identidad visual del proyecto quede consistente? siguiendo la guia de mi vault"
- L2: User answered structured questions and confirmed cleanup: (1) "Open Design solo en pantallas faltantes/estructura", (2) "Eliminarlo y actualizar CONEXION.md (Recomendado)" for `SPECIALTY_VERIFICATION.md` ("si agrega esa limpieza"), (3) "Solo Fase 1 + limpieza primero y revisar antes de editar". Branch `feat/frontend-visual-consistency` created from `main@a411f88`.
- L3: Phase 1 completed on `feat/frontend-visual-consistency` (no Svelte/CSS edits): removed `SPECIALTY_VERIFICATION.md` and updated `CONEXION.md`; re-synced `design/system.md` (28 `:root` tokens across 17 CSS files + Vite-bundled Bootstrap 5.3.3 / Bootstrap Icons 1.11.3) and `design/system.html` (1440px self-contained board); `gentle_design(list)` confirms `design/system.md is up to date`; Prettier check passes. Ready for user review of Phase 1 + Phase 2/3 plan and commit authorization.
- L4: User clarified workflow preference: "bien, igual mi idea es pasar pagina por pagina para revisar que se respete la identidad visual en cada una de ellas". Plan restructured into page-by-page slices (Shell global → Landing → Auth/Cuenta → Error → Dashboard → Listados → Formularios ABM), keeping Open Design for missing/structural screens and Impeccable checks per page.
