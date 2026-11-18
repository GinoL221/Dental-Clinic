# Sistema de Diseño — Dental Clinic (`design/system.md`)

Documento sincronizado desde los archivos fuente vigentes en `frontend/static/css/**`, `frontend/src/app.css`, `frontend/src/routes/+layout.svelte`, `frontend/src/lib/charts/dashboardCharts.js`, `frontend/package.json` y `frontend/src/lib/components/ConfirmDialog.svelte`.
Registra exclusivamente los valores observados en el código fuente actual.

---

## 1. Fuentes auditadas y dependencias

### 1.1 Dependencias de UI empaquetadas localmente

- **Bootstrap `5.3.3`** (`frontend/package.json`): importado vía Vite en `frontend/src/routes/+layout.svelte` (`bootstrap/dist/css/bootstrap.min.css` y `bootstrap/dist/js/bootstrap.bundle.min.js` en `onMount`). No usa CDN externo.
- **Bootstrap Icons `1.11.3`** (`frontend/package.json`): importado vía Vite en `frontend/src/routes/+layout.svelte` (`bootstrap-icons/font/bootstrap-icons.css`).
- **uPlot** (gráficos del dashboard): hoja local `/css/lib/uPlot.min.css` enlazada en `frontend/src/routes/dashboard/+page.svelte` y script `/js/lib/uPlot.min.js` cargado en `frontend/src/lib/charts/dashboardCharts.js`.
- **Regla de artboards (`design/**/*.html`):** todo artboard debe ser HTML autocontenido (CSS, JS y SVGs embebidos, pilas tipográficas del sistema), sin URLs externas ni CDNs.

### 1.2 Hojas de estilo propias (`frontend/src/app.css:9-35`)

Importadas en este orden exacto en `frontend/src/app.css`:

1. **Base:** `frontend/static/css/base/normalize.css`, `frontend/static/css/base/tokens.css`, `frontend/static/css/base/typography.css`, `frontend/static/css/base/layout.css`
2. **Componentes:** `frontend/static/css/components/buttons.css`, `frontend/static/css/components/cards.css`, `frontend/static/css/components/forms.css`, `frontend/static/css/components/alerts.css`, `frontend/static/css/components/tables.css`
3. **Layout:** `frontend/static/css/layout/header.css`, `frontend/static/css/layout/footer.css`
4. **Utilidades (movimiento):** `frontend/static/css/utilities/animations.css`
5. **Vistas:** `frontend/static/css/views/landing.css`, `frontend/static/css/views/auth.css`, `frontend/static/css/views/dashboard.css`, `frontend/static/css/views/error.css`
6. **Responsive:** `frontend/static/css/utilities/responsive.css` (cargado después de `views/*` para que los overrides de breakpoints ganen limpiamente sin `!important`).

---

## 2. Tokens oficiales (`frontend/static/css/base/tokens.css`)

29 custom properties declaradas en `:root` (`frontend/static/css/base/tokens.css:10-67`):

### 2.1 Paleta de marca y neutros (10 tokens)

| Token CSS               | Valor     | Fuente               | Uso observado en el código                                                                                                                                                                                              |
| :---------------------- | :-------- | :------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--color-primario`      | `#4a90e2` | `base/tokens.css:12` | Azul institucional (**3.29:1** sobre blanco; no se usa en texto): borde inferior de `thead th` (`components/tables.css:178`), filetes decorativos (`.navbar.sticky-top::after`, `.section-rule`, `.title-rule`) y foco. |
| `--color-primario-dark` | `#2b6cb0` | `base/tokens.css:13` | Azul oscuro accesible (**5.42:1 AA** sobre blanco): botones primarios (`--gradient-brand-aa`), enlaces, labels de formularios, `footer` (`layout/footer.css:15`), `.stat-card-total` y `td::before` móvil.              |
| `--color-secundario`    | `#a4e2c2` | `base/tokens.css:14` | Verde menta secundario (**1.48:1** sobre blanco, solo fondos/acentos): `.alert-success` (`components/alerts.css:18`), `--gradient-mint-sky` y filetes de acento.                                                        |
| `--color-acento`        | `#b3ddf2` | `base/tokens.css:15` | Celeste pastel (**1.44:1** sobre blanco, solo fondos): hover de filas en tablas (`components/tables.css:187`), `.privacy-notice` (`views/auth.css:352`) y hover de `.auth-input` (`views/auth.css:98`).                 |
| `--color-fondo-claro`   | `#f5f5f5` | `base/tokens.css:16` | Gris claro neutro: inputs deshabilitados (`views/auth.css:116`), `.dashboard-chip-time`, `.chart-empty` y `.skeleton-line` (`views/dashboard.css`).                                                                     |
| `--color-blanco`        | `#ffffff` | `base/tokens.css:17` | Superficies de tarjetas y tablas, botones outline y texto sobre botones sólidos y chips de estado.                                                                                                                      |
| `--color-texto`         | `#212529` | `base/tokens.css:20` | Texto principal (**16.06:1 AAA** sobre blanco): títulos, `thead th`, botones outline, botón de usuario y `ConfirmDialog.svelte`.                                                                                        |
| `--color-texto-muted`   | `#6c757d` | `base/tokens.css:21` | Texto secundario (**4.69:1 AA** sobre blanco): subtítulos, `.result-count`, `.btn-eye-toggle`, texto auxiliar y `--color-status-neutral`.                                                                               |
| `--color-borde-suave`   | `#e9ecef` | `base/tokens.css:22` | Bordes de inputs, tarjetas `.auth-card`/`.error-card`/`.dashboard-card`, botones outline, botón de usuario y separadores.                                                                                               |
| `--color-fondo-input`   | `#f8f9fa` | `base/tokens.css:35` | Fondo base de `.auth-input`, `.filter-bar-field`, `.auth-info-summary`, `.auth-disclosure-panel` y cabecera neutra `thead th` (`components/tables.css:174`).                                                            |

### 2.2 Tokens semánticos y de contraste AA (10 tokens)

| Token CSS                  | Valor     | Fuente               | Uso observado y contraste                                                                                                                                                        |
| :------------------------- | :-------- | :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--color-peligro`          | `#dc3545` | `base/tokens.css:25` | Bordes de error y `:is(:user-invalid, .is-invalid)`, `.field-error`. **4.53:1 AA** sobre blanco.                                                                                 |
| `--color-peligro-hover`    | `#c82333` | `base/tokens.css:26` | `.btn-danger`, hover de `.btn-danger-outline`, hover de `.auth-specialty-remove` y `--color-status-cancelled`. **5.61:1 AA** con blanco.                                         |
| `--color-peligro-fondo`    | `#f8d7da` | `base/tokens.css:27` | Fondo de `.alert-danger` y `.dashboard-filter-alert`.                                                                                                                            |
| `--color-peligro-texto`    | `#721c24` | `base/tokens.css:28` | Texto de `.alert-danger` (**8.25:1 AAA** sobre `--color-peligro-fondo`), `.form-field-errors`, `.btn-danger-outline` y hover de `.btn-danger`.                                   |
| `--color-peligro-suave`    | `#fff5f5` | `base/tokens.css:29` | Fondo de `.auth-input:is(:user-invalid, .is-invalid)` (`views/auth.css:104`).                                                                                                    |
| `--color-info-dark`        | `#0e7490` | `base/tokens.css:30` | Parada de `--gradient-brand-aa` y `--gradient-brand-hover`, borde hover de outline/usuario, `.stat-card-patients` y `--color-status-in-progress`. **5.36:1 AA**.                 |
| `--color-info-hover`       | `#0c627a` | `base/tokens.css:31` | Variante oscura de acento informativo (**6.67:1 AAA** con blanco).                                                                                                               |
| `--color-secundario-hover` | `#7dd3a0` | `base/tokens.css:32` | Hover menta secundario reservado en paleta.                                                                                                                                      |
| `--color-exito-texto`      | `#1b4332` | `base/tokens.css:33` | Texto sobre menta (**7.51:1 AAA** sobre `--color-secundario`): `.alert-success`, `.hero-badge`, `.error-code`, parada final de `--gradient-brand-hover` y `.stat-card-dentists`. |
| `--color-acento-texto`     | `#2c5d8f` | `base/tokens.css:34` | Subtítulo `.hero-subtitle`, texto de `.privacy-notice` (**4.74:1 AA** sobre `--color-acento`), `.stat-card-today` y gradiente de `footer`.                                       |

### 2.3 Tokens de estado de turnos (5 tokens)

Definidos en `frontend/static/css/base/tokens.css:38-42` y aplicados con texto `var(--color-blanco)` en `frontend/static/css/components/tables.css:202-225`:

| Token / Clase                                              | Mapeo                                    | Contraste con blanco |
| :--------------------------------------------------------- | :--------------------------------------- | :------------------- |
| `--color-status-scheduled` / `.badge.status-scheduled`     | `var(--color-primario-dark)` (`#2b6cb0`) | **5.42:1 (AA)**      |
| `--color-status-in-progress` / `.badge.status-in-progress` | `var(--color-info-dark)` (`#0e7490`)     | **5.36:1 (AA)**      |
| `--color-status-completed` / `.badge.status-completed`     | `var(--color-exito-texto)` (`#1b4332`)   | **11.08:1 (AAA)**    |
| `--color-status-cancelled` / `.badge.status-cancelled`     | `var(--color-peligro-hover)` (`#c82333`) | **5.61:1 (AA)**      |
| `--color-status-neutral` / `.badge.status-neutral`         | `var(--color-texto-muted)` (`#6c757d`)   | **4.69:1 (AA)**      |

### 2.4 Gradientes (4 tokens)

(`--gradient-primary-hover` fue eliminado de `tokens.css`.)

| Token CSS                | Valor                                                                                 | Fuente                  | Uso observado                                                                                                                                                                                                   |
| :----------------------- | :------------------------------------------------------------------------------------ | :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--gradient-brand-aa`    | `linear-gradient(135deg, var(--color-primario-dark) 0%, var(--color-info-dark) 100%)` | `base/tokens.css:45-49` | Botones primarios (`.btn-primary`, `.auth-btn-primary`, `.error-btn-primary`, `.btn-add-primary`), `.dropdown-item:hover`, `.landing-cta`, `.portfolio-badge`, `.auth-specialty-chip` (≥ 5.36:1 AA con blanco). |
| `--gradient-brand-hover` | `linear-gradient(135deg, var(--color-info-dark) 0%, var(--color-exito-texto) 100%)`   | `base/tokens.css:50-54` | Hover unificado de botones primarios y `.btn-add-primary` / `.portfolio-badge` (≥ 5.36:1 AA con blanco).                                                                                                        |
| `--gradient-mint-sky`    | `linear-gradient(135deg, var(--color-secundario) 0%, var(--color-acento) 100%)`       | `base/tokens.css:55-59` | `.hero-badge`, `.feature-icon`, `.tech-item:hover .tech-icon` y `.btn-cta-primary:hover` (con `--color-exito-texto`).                                                                                           |
| `--gradient-primary`     | `linear-gradient(135deg, var(--color-primario) 0%, var(--color-acento) 100%)`         | `base/tokens.css:60-64` | Gradiente de marca claro reservado en paleta (sin texto blanco encima).                                                                                                                                         |

### 2.5 Limpieza de literales fuera de `tokens.css`

- **CSS propio:** `0` declaraciones `!important` y `0` valores hexadecimales fuera de `tokens.css`. Se conservan valores `rgba(...)` puntuales para sombras, tintes suaves (`rgba(74, 144, 226, 0.08–0.25)`, `rgba(164, 226, 194, 0.14–0.32)`) y fondos translúcidos (`.navbar.sticky-top`, `.auth-card`, `.error-card`).
- **JavaScript de gráficos (`frontend/src/lib/charts/dashboardCharts.js`):** `0` hexadecimales literales; lee `--color-primario-dark`, `--color-info-dark`, `--color-exito-texto` y `--color-peligro-hover` en tiempo de ejecución vía `getComputedStyle`.

---

## 3. Tipografía

### 3.1 Familias declaradas

- **Pila base:** `"Segoe UI", Tahoma, Geneva, Verdana, sans-serif` (`frontend/static/css/base/typography.css:18` sobre `body`, combinada con la pila `system-ui` de Bootstrap `5.3.3`).
- **Monoespaciada:** `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` en `.role-creds` (`views/landing.css:195`); `monospace, monospace` en `base/normalize.css`.
- **Artboards (`design/**/*.html`):** pila nativa del sistema `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`, sin fuentes externas.

### 3.2 Escala y pesos observados

| Tamaño     | Peso          | Uso y fuente                                                                                                                       |
| :--------- | :------------ | :--------------------------------------------------------------------------------------------------------------------------------- |
| `2.95rem`  | `700`         | `.hero-title` (`views/landing.css:73`; baja a `2.25rem` en `<=767.98px` y `1.9rem` en `<=575.98px` en `utilities/responsive.css`). |
| `3rem`     | —             | `.empty-state-icon` (`components/cards.css:23`).                                                                                   |
| `2.25rem`  | `700`         | `.error-title` (`views/error.css:93`; baja a `1.75rem` en `<=767.98px` y `1.5rem` en `<=575.98px`).                                |
| `2.15rem`  | `700`         | `.features-title`, `.tech-title` (`views/landing.css:213,309`; baja a `1.75rem` en `<=767.98px`).                                  |
| `2rem`     | `700`         | `.auth-title` (`views/auth.css:50`), `.cta-title` (`views/landing.css:379`).                                                       |
| `1.8rem`   | `700`         | `.page-title` (`views/dashboard.css:30`), `.patient-list-header h1` (`components/tables.css:73`).                                  |
| `1.5rem`   | `700`         | `.navbar-brand` (`layout/header.css:44`).                                                                                          |
| `1.3rem`   | `500`         | `.hero-subtitle` (`views/landing.css:81`).                                                                                         |
| `1.2rem`   | `600` / `700` | `.access-panel-title` (`views/landing.css:123`), `.feature-title` (`views/landing.css:273`).                                       |
| `1.15rem`  | `700`         | `.dashboard-card-header .card-title` (`views/dashboard.css:178`).                                                                  |
| `1.05rem`  | `400` / `600` | `.hero-description`, botones hero/CTA (`views/landing.css`), `.auth-section-heading` (`views/auth.css:210`).                       |
| `1rem`     | `400` / `600` | Botones primarios, `.auth-subtitle`, `.auth-input`, `.appointment-patient`.                                                        |
| `0.9rem`   | `500` / `600` | Botones del navbar (`components/buttons.css:26`), `.footer-text` (`layout/footer.css:39`), `.result-count`, `.auth-info-summary`.  |
| `0.875rem` | `600`         | `.hero-badge`, `.error-code` / `.text-token-muted` / `.dashboard-date` / `.auth-required-legend` / `.auth-specialty-chip`.         |
| `0.85rem`  | `600`         | `.table thead th` (`text-transform: uppercase; letter-spacing: 0.08em`), `.list-search-label`, `.field-error`, `.auth-help-text`.  |

---

## 4. Espaciado, radios, sombras, movimiento y breakpoints

### 4.1 Espaciado y contenedores

- Paddings y gaps recurrentes en `rem`: `0.35rem` / `0.5rem` / `0.65rem` / `0.75rem` / `1rem` / `1.25rem` / `1.5rem` / `1.75rem` / `2rem` / `3rem` / `4.25rem` / `4.5rem`.
- Tarjetas de flujo auth/form: `.auth-card` `max-width: 500px; min-width: 400px` (`views/auth.css:34-36`); variante ancha `.auth-card--wide` `max-width: 700px` (`views/auth.css:206`).

### 4.2 Radios de borde

| Radio          | Uso y fuente                                                                                                                                                                                                                      |
| :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `4px`          | `.btn-eye-toggle` (`components/forms.css:69`).                                                                                                                                                                                    |
| `6px`          | `.skeleton-line` (`views/dashboard.css:345`).                                                                                                                                                                                     |
| `8px`          | Botones primarios, outline, danger, `.btn-add-primary`, `.nav-link`, `.user-dropdown .dropdown-toggle`, `.alert`, `.table-container`, tarjetas móviles de tabla y `.filter-bar-field`.                                            |
| `0.5rem`       | `.user-dropdown .dropdown-menu` (`layout/header.css:164`).                                                                                                                                                                        |
| `10px`         | `.content-card`, `.dropdown-menu`, `.auth-input`, `.auth-info-summary`, `.auth-disclosure-panel`, `.privacy-notice`, `.dashboard-header`, `.stat-card`, `.filter-bar`, `.dashboard-card`, `.chart-empty`, `ConfirmDialog.svelte`. |
| `12px`         | `.feature-card`, `.tech-item`, `.tech-icon` (`views/landing.css`).                                                                                                                                                                |
| `16px`         | `.access-panel` (`views/landing.css:118`).                                                                                                                                                                                        |
| `20px`         | `.auth-card` (`views/auth.css:30`), `.error-card` (`views/error.css:39`).                                                                                                                                                         |
| `50px` / `50%` | `.hero-badge`, `.role-chip`, `.portfolio-badge`, `.error-code`, `.auth-specialty-chip`, `.badge.status-*`; `50%` en `.auth-specialty-remove`.                                                                                     |

### 4.3 Sombras y anillos de foco

- **Sutil de control / tarjeta:** `0 2px 6px rgba(0, 0, 0, 0.06)` (`.btn-outline-primary`, `.btn-danger-outline`, `.user-dropdown .dropdown-toggle`, `.dashboard-header`), `0 2px 4px rgba(0, 0, 0, 0.1)` (`.alert`, tarjetas móviles).
- **Tarjeta estándar:** `0 4px 6px rgba(0, 0, 0, 0.08–0.1)` (`.content-card`, `.dashboard-card`), `0 4px 10px rgba(0, 0, 0, 0.08)` (`.stat-card`).
- **Hover interactivo neutral:** `0 6px 16px rgba(0, 0, 0, 0.16)` en botones primarios/danger/add y `0 6px 16px rgba(0, 0, 0, 0.12)` en outline/usuario.
- **Menús / diálogo / auth:** `0 10px 30px rgba(0, 0, 0, 0.1)` (`.dropdown-menu`), `0 20px 40px rgba(0, 0, 0, 0.08)` (`.access-panel`, `.auth-card`, `.error-card`).
- **Foco visible:** `outline: 3px solid var(--color-primario-dark); outline-offset: 2px;` en botones, `.nav-link`, `.navbar-toggler`, `.navbar-brand`, `.user-dropdown .dropdown-toggle`, `.btn-eye-toggle`, `.portfolio-badge`; anillo de input `0 0 0 0.2rem rgba(74, 144, 226, 0.25)` y de error `0 0 0 0.2rem rgba(220, 53, 69, 0.15)`.

### 4.4 Movimiento y `prefers-reduced-motion`

- `@keyframes slideUp` (`utilities/animations.css:18-27`, `0.6s ease-out` en `.auth-card`); sin animación JS `onMount` en `/login`.
- Transición estándar de botones: `0.25s ease` con `translateY(-2px)` en hover y `:active:not(:disabled) { transform: scale(0.98); }` (`components/buttons.css`, `components/tables.css`, `layout/header.css`).
- `@media (prefers-reduced-motion: reduce)` (`utilities/animations.css:43-112`) neutraliza `transform` y `transition` duplicando selectores (`.x.x`) sin `!important`, manteniendo feedback de color/borde/foco.

### 4.5 Breakpoints observados

| Media query                    | Archivo fuente                                                                                | Propósito                                                                                                                      |
| :----------------------------- | :-------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| `@media (max-width: 991.98px)` | `utilities/responsive.css:24`                                                                 | `.hero-split-grid` pasa a 1 columna.                                                                                           |
| `@media (max-width: 767.98px)` | `components/tables.css:133,238`, `views/dashboard.css:262`, `utilities/responsive.css:31,148` | Buscador/filtros apilados, tablas en tarjetas clave-valor, `.appointment-item` en columna, tipografía móvil y footer centrado. |
| `@media (max-width: 575.98px)` | `utilities/responsive.css:85,179`                                                             | Escala móvil compacta, `.auth-actions` en columna, padding reducido.                                                           |
| `@media (max-width: 400px)`    | `utilities/responsive.css:235`                                                                | `.auth-card` / `.error-card` en móviles estrechos.                                                                             |
| `@media (max-height: 700px)`   | `utilities/responsive.css:249`                                                                | Desactiva centrado vertical en viewports bajos.                                                                                |

---

## 5. Reglas de componentes observadas

### 5.1 Botones (`components/buttons.css`, `components/tables.css`)

- **Primario unificado (`.btn-primary`, `.navbar .btn-primary`, `.auth-btn-primary`, `.error-btn-primary`, `.btn-add-primary`):** fondo `--color-primario-dark` + `--gradient-brand-aa`, texto `--color-blanco`, radio `8px`, peso `600`; hover `--color-info-dark` + `--gradient-brand-hover`, `translateY(-2px)`, sombra `0 6px 16px rgba(0, 0, 0, 0.16)`; `:active:not(:disabled)` `scale(0.98)`; `:focus-visible` `outline: 3px solid var(--color-primario-dark)`.
- **Outline limpio (`.btn-outline-primary`, `.navbar .btn-outline-primary`, `.btn.auth-btn-secondary`, `.error-btn-secondary`):** fondo `--color-blanco`, borde `1px solid var(--color-borde-suave)`, texto `--color-texto`, radio `8px`, sombra `0 2px 6px rgba(0, 0, 0, 0.06)`; hover con tinte suave azul-menta (`rgba(74, 144, 226, 0.1)` → `rgba(164, 226, 194, 0.24)` sobre blanco), borde `--color-info-dark` y texto `--color-texto`.
- **Destructivos (`.btn-danger`, `.btn-danger-outline`):** `--color-peligro-hover` sólido (hover `--color-peligro-texto`) y versión outline blanca con texto `--color-peligro-texto` que pasa a sólido `--color-peligro-hover` al hover.
- **CTA de landing (`.btn-cta-primary`, `.btn-cta-secondary`):** blanco con texto `--color-primario-dark` (hover `--gradient-mint-sky` + `--color-exito-texto`) y transparente con borde blanco `2px`.

### 5.2 Tarjetas y contenedores

- **Superficies limpias sin franjas `::before`:** `.content-card`, `.auth-card`, `.error-card`, `.feature-card`, `.tech-item`, `.access-panel` y `.dashboard-card` mantienen bordes suaves (`--color-borde-suave`), reservando el filete degradado azul-menta para anclas focales (`.navbar.sticky-top::after`, `.section-rule`, `.page-title-rule`, `.list-title-rule`, `.auth-title-rule`, `.error-title-rule`).
- **`.stat-card` (`views/dashboard.css:80-118`):** `.stat-card-total` (`--color-primario-dark` → `--color-info-dark`), `.stat-card-dentists` (`--color-exito-texto` → `--color-info-dark`), `.stat-card-patients` (`--color-info-dark` → `--color-acento-texto`), `.stat-card-today` (`--color-acento-texto` → `--color-primario-dark`), todas con texto `--color-blanco` AA/AAA.

### 5.3 Formularios, especialidades y diálogo (`components/forms.css`, `views/auth.css`, `ConfirmDialog.svelte`)

- **`.auth-input` + `.form-label`:** borde `2px solid var(--color-borde-suave)`, fondo `var(--color-fondo-input)`, radio `10px`; validación `:is(:user-invalid, .is-invalid)` usa `--color-peligro` y fondo `--color-peligro-suave`; `:disabled` usa `--color-fondo-claro` y `--color-texto-muted`.
- **Especialidades inline (`.auth-specialty-chip`, `.auth-specialty-chip--removable`, `.auth-specialty-remove`):** chip en `--gradient-brand-aa` con texto blanco que aloja el botón `×` (`.auth-specialty-remove`, `28×28px`, radio `50%`, hover `--color-peligro-hover`) directamente dentro de la misma pastilla, con `gap: 0.65rem` entre chips.
- **`.btn-eye-toggle`:** `44×44px` con `aria-pressed` y foco visible de `3px`.
- **`ConfirmDialog.svelte`:** overlay oscuro, tarjeta blanca `10px`, foco inicial en «Cancelar», trampa de `Tab`, cierre con `Escape` y restauración de foco.

### 5.4 Alertas, tablas y dashboard

- **`.alert-success` / `.alert-danger` (`components/alerts.css`):** `--color-secundario` + `--color-exito-texto` (**7.51:1**) y `--color-peligro-fondo` + `--color-peligro-texto` (**8.25:1**).
- **Tablas (`components/tables.css:173-183`):** cabecera neutra clara (Opción 1) con `background-color: var(--color-fondo-input)`, `color: var(--color-texto)` y `border-bottom: 2px solid var(--color-primario)`, `text-transform: uppercase; letter-spacing: 0.08em`. En `<=767.98px` cada `tr` se apila como tarjeta con `td::before` en `--color-primario-dark` y acciones `44×44px`.
- **Dashboard (`views/dashboard.css`, `dashboardCharts.js`):** `<search>` para `.filter-bar`, gráficos uPlot alimentados por tokens CSS desde `:root`, `.upcoming-list` (`max-height: 350px`), `.chart-empty` y `.skeleton-row`.

### 5.5 Navegación y pie (`layout/header.css`, `layout/footer.css`)

- **Navbar sticky:** `rgba(255, 255, 255, 0.96)` con `backdrop-filter: blur(10px)` y filete inferior de `2px` azul-menta (`.navbar.sticky-top::after`).
- **Links de navegación (`.nav-link`):** `padding: 0.45rem 0.85rem; border-radius: 8px; color: var(--color-texto)`, hover `rgba(74, 144, 226, 0.08)`, estado activo `[aria-current="page"]` y `.is-active` (también en dropdowns padre) con pastilla suave azul-menta (`rgba(74, 144, 226, 0.14)` → `rgba(164, 226, 194, 0.28)`), borde `1px solid rgba(74, 144, 226, 0.25)`, texto `--color-primario-dark` y `font-weight: 700` (sin subrayado).
- **Menú usuario y dropdowns:** `.user-dropdown .dropdown-toggle` blanco con `border-radius: 8px`, `border: 1px solid var(--color-borde-suave)`, sombra sutil y hover con tinte suave; `.dropdown-item:hover` usa `--gradient-brand-aa` con texto blanco; `.navbar-toggler` de `44×44px`.
- **Footer:** gradiente AA (`--color-acento-texto` → `--color-primario-dark`), texto `--color-blanco`, logo invertido (`brightness(0) invert(1)`).

---

## 6. Estado actual de contraste y deuda técnica remediada

### Verificado y remediado

- **Contraste WCAG AA/AAA:** botones primarios y `.btn-add-primary` (`--gradient-brand-aa` / `--gradient-brand-hover`, ≥ 5.36:1 con blanco), `.dropdown-item:hover`, `thead th` claro neutro (`--color-texto` sobre `--color-fondo-input` con borde `2px solid var(--color-primario)`), `.error-title` y títulos de landing en `--color-texto`, chips `.badge.status-*` (4.69:1 a 11.08:1), `.stat-card-*` (5.36:1 a 11.08:1), `.alert-success` / `.alert-danger`, `.privacy-notice` y `footer`.
- **Cascada y limpieza CSS:** `0` declaraciones `!important` en el CSS propio, `0` valores hexadecimales fuera de `tokens.css` y `0` en `dashboardCharts.js`, `utilities/responsive.css` importado después de `views/*`, breakpoints unificados en `991.98px` / `767.98px` / `575.98px`, selectores muertos eliminados (`.btn-action`, `.btn-edit`, `.btn-delete`, `--gradient-primary-hover`), animación JS de `login` reemplazada por CSS sujeto a `prefers-reduced-motion`.
- **Consistencia de templates Svelte:** un único `<main>` y un único `<h1>` por vista, `FormCard` unificado en auth/ABM, `ListPageHeader` con `<search>` etiquetado y contador de resultados, `ConfirmDialog` con gestión completa de foco, toggles de contraseña con `aria-pressed`, campos bloqueados por rol con mirror server-side y chips de especialidad con botón `×` integrado.

### Notas menores conservadas

- Se conservan valores `rgba(...)` literales para sombras y tintes suaves donde no existe token alpha dedicado.
- En `/dashboard`, las tarjetas `.stat-card` conservan `<h4>` (en lugar de `<h3>`) por compatibilidad con el selector E2E `#stats-cards .card h4`.
