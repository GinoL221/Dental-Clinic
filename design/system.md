# Sistema de Diseño — Dental Clinic (`design/system.md`)

Documento sincronizado desde los archivos fuente vigentes en `frontend/static/css/**`, `frontend/src/app.css`, `frontend/src/routes/+layout.svelte`, `frontend/package.json` y `frontend/src/lib/components/ConfirmDialog.svelte`.
Registra exclusivamente los valores observados en el código fuente actual (sin inventar tokens ni ocultar deuda vigente).

---

## 1. Fuentes auditadas y dependencias

### 1.1 Dependencias de UI empaquetadas localmente

- **Bootstrap `5.3.3`** (`frontend/package.json:31`): importado vía Vite en `frontend/src/routes/+layout.svelte:2,10` (`bootstrap/dist/css/bootstrap.min.css` y `bootstrap/dist/js/bootstrap.bundle.min.js` en `onMount`). No usa CDN externo.
- **Bootstrap Icons `1.11.3`** (`frontend/package.json:32`): importado vía Vite en `frontend/src/routes/+layout.svelte:3` (`bootstrap-icons/font/bootstrap-icons.css`).
- **uPlot** (gráficos del dashboard): hoja local `/css/lib/uPlot.min.css` enlazada en `frontend/src/routes/dashboard/+page.svelte:281` y script `/js/lib/uPlot.min.js` cargado en `frontend/src/lib/charts/dashboardCharts.js:11`.
- **Regla de artboards (`design/**/*.html`):** todo artboard debe ser HTML autocontenido (CSS, JS y SVGs embebidos, pilas tipográficas del sistema), sin URLs externas ni CDNs.

### 1.2 Hojas de estilo propias (`frontend/src/app.css:11-31`)

Importadas en este orden exacto en `frontend/src/app.css`:

1. **Base:** `frontend/static/css/base/normalize.css`, `frontend/static/css/base/tokens.css`, `frontend/static/css/base/typography.css`, `frontend/static/css/base/layout.css`
2. **Componentes:** `frontend/static/css/components/buttons.css`, `frontend/static/css/components/cards.css`, `frontend/static/css/components/forms.css`, `frontend/static/css/components/alerts.css`, `frontend/static/css/components/tables.css`
3. **Layout:** `frontend/static/css/layout/header.css`, `frontend/static/css/layout/footer.css`
4. **Utilidades:** `frontend/static/css/utilities/animations.css`, `frontend/static/css/utilities/responsive.css`
5. **Vistas:** `frontend/static/css/views/landing.css`, `frontend/static/css/views/auth.css`, `frontend/static/css/views/dashboard.css`, `frontend/static/css/views/error.css`

> **Nota de cascada observada:** `utilities/responsive.css` (`frontend/src/app.css:24`) se importa **antes** que `views/landing.css` (`frontend/src/app.css:27`), por lo que las reglas base de `.tech-icon img` / `.tech-icon svg` en `views/landing.css:469-490` sobreescriben los ajustes responsivos de `utilities/responsive.css:101-118`.

---

## 2. Tokens oficiales (`frontend/static/css/base/tokens.css`)

28 custom properties declaradas en `:root` (`frontend/static/css/base/tokens.css:10-51`):

### 2.1 Paleta de marca y neutros (10 tokens)

| Token CSS               | Valor     | Fuente               | Uso observado en el código                                                                                                                                                                                                                                   |
| :---------------------- | :-------- | :------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--color-primario`      | `#4a90e2` | `base/tokens.css:12` | Azul institucional: bordes, `thead` de tablas (`components/tables.css:72`), anillos de foco y acentos. **3.29:1 sobre blanco** (no apto para texto normal; todavía usado como texto en títulos de `views/landing.css:59,172,235,266`).                       |
| `--color-primario-dark` | `#2b6cb0` | `base/tokens.css:13` | Azul oscuro accesible (**5.42:1 AA** sobre blanco): botones primarios sólidos, texto de enlaces, labels de formularios, `footer` (`layout/footer.css:15`), `.stat-card-total` (`views/dashboard.css:61`) y `td::before` móvil (`components/tables.css:215`). |
| `--color-secundario`    | `#a4e2c2` | `base/tokens.css:14` | Verde menta secundario (**1.48:1** sobre blanco, solo fondos): `.alert-success` (`components/alerts.css:18`), `.btn-add-primary` (`components/tables.css:16`) y parada del gradiente `.error-title` (`views/error.css:86`).                                  |
| `--color-acento`        | `#b3ddf2` | `base/tokens.css:15` | Celeste pastel (**1.44:1** sobre blanco, solo fondos): hover de filas en tablas (`components/tables.css:81`), `.privacy-notice` (`views/auth.css:229`) y hover de `.auth-input` (`views/auth.css:88`).                                                       |
| `--color-fondo-claro`   | `#f5f5f5` | `base/tokens.css:16` | Gris claro neutro: `.filter-bar` (`views/dashboard.css:85`), `.chart-empty` (`views/dashboard.css:175`) y `.skeleton-line` (`views/dashboard.css:198`).                                                                                                      |
| `--color-blanco`        | `#ffffff` | `base/tokens.css:17` | Superficies de tarjetas y tablas, texto sobre botones sólidos y chips de estado.                                                                                                                                                                             |
| `--color-texto`         | `#212529` | `base/tokens.css:20` | Texto principal (**16.06:1 AAA** sobre blanco): usado en `ConfirmDialog.svelte:101` (en `body` hereda de Bootstrap).                                                                                                                                         |
| `--color-texto-muted`   | `#6c757d` | `base/tokens.css:21` | Texto secundario (**4.69:1 AA** sobre blanco): subtítulos, `.btn-eye-toggle` (`components/forms.css:65`) y `--color-status-neutral`.                                                                                                                         |
| `--color-borde-suave`   | `#e9ecef` | `base/tokens.css:22` | Bordes de inputs, tarjetas `.auth-card`/`.error-card` y separadores de esqueleto.                                                                                                                                                                            |
| `--color-fondo-input`   | `#f8f9fa` | `base/tokens.css:35` | Fondo base de inputs `.auth-input` (`views/auth.css:76`).                                                                                                                                                                                                    |

### 2.2 Tokens semánticos y de contraste AA (11 tokens)

| Token CSS                  | Valor     | Fuente               | Uso observado y contraste                                                                                                                                                                                                                      |
| :------------------------- | :-------- | :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--color-peligro`          | `#dc3545` | `base/tokens.css:25` | Bordes de error, `.field-error`, `.btn-delete` (`components/tables.css:112`). **4.53:1 AA** sobre blanco.                                                                                                                                      |
| `--color-peligro-hover`    | `#c82333` | `base/tokens.css:26` | Hover de `.btn-delete` (`components/tables.css:118`) y base de `--color-status-cancelled`. **5.61:1 AA** con blanco.                                                                                                                           |
| `--color-peligro-fondo`    | `#f8d7da` | `base/tokens.css:27` | Fondo de `.alert-danger` (`components/alerts.css:23`).                                                                                                                                                                                         |
| `--color-peligro-texto`    | `#721c24` | `base/tokens.css:28` | Texto de `.alert-danger` (**8.25:1 AAA** sobre `--color-peligro-fondo`), `.form-field-errors` (`components/forms.css:25`) y `.btn-outline-danger` móvil (`components/tables.css:264`).                                                         |
| `--color-peligro-suave`    | `#fff5f5` | `base/tokens.css:29` | Fondo de `.auth-input.is-invalid` (`views/auth.css:94`).                                                                                                                                                                                       |
| `--color-info-dark`        | `#0e7490` | `base/tokens.css:30` | `.btn-edit` (`components/tables.css:99`), `.stat-card-patients` (`views/dashboard.css:69`) y base de `--color-status-in-progress`. **5.36:1 AA** con blanco.                                                                                   |
| `--color-info-hover`       | `#0c627a` | `base/tokens.css:31` | Hover de `.btn-edit` (`components/tables.css:105`). **6.67:1 AAA** con blanco.                                                                                                                                                                 |
| `--color-secundario-hover` | `#7dd3a0` | `base/tokens.css:32` | Hover de `.btn-add-primary` (`components/tables.css:28`).                                                                                                                                                                                      |
| `--color-exito-texto`      | `#1b4332` | `base/tokens.css:33` | Texto sobre menta (**7.51:1 AAA** sobre `--color-secundario`): `.alert-success`, `.btn-add-primary`, `.stat-card-dentists` (`views/dashboard.css:65`) y base de `--color-status-completed`.                                                    |
| `--color-acento-texto`     | `#2c5d8f` | `base/tokens.css:34` | Hover de botones primarios sólidos (`components/buttons.css:46,95,116,162`), texto de `.privacy-notice` (**4.74:1 AA** sobre `--color-acento`), `.stat-card-today` (`views/dashboard.css:73`) y gradiente `.landing-cta` / `.portfolio-badge`. |

### 2.3 Tokens de estado de turnos (5 tokens)

Definidos en `frontend/static/css/base/tokens.css:38-42` y aplicados con texto blanco `var(--color-blanco)` en `frontend/static/css/components/tables.css:129-152`:

| Token / Clase                                              | Mapeo                                    | Contraste con blanco |
| :--------------------------------------------------------- | :--------------------------------------- | :------------------- |
| `--color-status-scheduled` / `.badge.status-scheduled`     | `var(--color-primario-dark)` (`#2b6cb0`) | **5.42:1 (AA)**      |
| `--color-status-in-progress` / `.badge.status-in-progress` | `var(--color-info-dark)` (`#0e7490`)     | **5.36:1 (AA)**      |
| `--color-status-completed` / `.badge.status-completed`     | `var(--color-exito-texto)` (`#1b4332`)   | **11.08:1 (AAA)**    |
| `--color-status-cancelled` / `.badge.status-cancelled`     | `var(--color-peligro-hover)` (`#c82333`) | **5.61:1 (AA)**      |
| `--color-status-neutral` / `.badge.status-neutral`         | `var(--color-texto-muted)` (`#6c757d`)   | **4.69:1 (AA)**      |

### 2.4 Gradientes (2 tokens)

| Token CSS                  | Valor                                                                         | Fuente                  | Uso observado                                                                                                                                                                                   |
| :------------------------- | :---------------------------------------------------------------------------- | :---------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--gradient-primary`       | `linear-gradient(135deg, var(--color-primario) 0%, var(--color-acento) 100%)` | `base/tokens.css:45-49` | Consumido en `layout/header.css:73` (`.dropdown-item:hover`, con `color: white`, lo que falla AA en el tramo claro); también declarado de forma literal en `views/landing.css:209-213,493-497`. |
| `--gradient-primary-hover` | `linear-gradient(135deg, #3d7bc6 0%, #9bcde8 100%)`                           | `base/tokens.css:50`    | **0 consumidores** (los botones de acción usan fondo sólido `--color-primario-dark` y hover sólido `--color-acento-texto`).                                                                     |

### 2.5 Colores literales fuera de `tokens.css` (deuda detectada)

- **CSS propio:** 0 valores hexadecimales fuera de `tokens.css`, pero persiste el keyword `white` (`components/tables.css:99,105,112,118`, `layout/header.css:68,85`) y valores `rgba(...)` literales en sombras, tintes y fondos (`0.03`–`0.95` en negro, `#212529`, blanco, `#4a90e2`, `#a4e2c2`, `#b3ddf2`, `#dc3545`, `#6c757d`).
- **JavaScript de gráficos:** `frontend/src/lib/charts/dashboardCharts.js:126,128,170,183` usa colores literales de Bootstrap (`#0d6efd`, `rgba(13, 110, 253, 0.1)`, `#0dcaf0`, `#20c997`) en lugar de tokens de marca.
- **SVG inline:** `frontend/src/routes/+page.svelte:170-186` conserva hexes de la marca JWT en un ícono SVG.

---

## 3. Tipografía

### 3.1 Familias declaradas

- **Pila base:** `"Segoe UI", Tahoma, Geneva, Verdana, sans-serif` (`frontend/static/css/base/typography.css:18` sobre `body`, combinada con la pila `system-ui` de Bootstrap `5.3.3`).
- **Monoespaciada (reset):** `monospace, monospace` (`frontend/static/css/base/normalize.css:64,104`).
- **Artboards (`design/**/*.html`):** pila nativa del sistema `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`, sin fuentes externas.

### 3.2 Escala y pesos observados

| Tamaño     | Peso          | Uso y fuente                                                                                                                                                                                              |
| :--------- | :------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `3.5rem`   | `700`         | `.hero-title` (`views/landing.css:57-58`; baja a `2.5rem` en `<=768px` y `2rem` en `<=576px` en `utilities/responsive.css:29,79`).                                                                        |
| `3rem`     | —             | `.empty-state-icon` (`components/cards.css:23`).                                                                                                                                                          |
| `2.5rem`   | `700`         | `.features-title`, `.tech-title`, `.cta-title` (`views/landing.css:170,264,332`), `.error-title` (`views/error.css:92`).                                                                                  |
| `2rem`     | `700`         | `.auth-title` (`views/auth.css:51-52`), `.feature-icon` (`views/landing.css:220`).                                                                                                                        |
| `1.75rem`  | —             | `.auth-title` y `.error-title` en `<=576px` (`utilities/responsive.css:202,206`).                                                                                                                         |
| `1.5rem`   | `700`         | `.navbar-brand` (`layout/header.css:25-26`), `.hero-subtitle` (`views/landing.css:87`).                                                                                                                   |
| `1.4rem`   | `600`         | `.feature-title` (`views/landing.css:233`).                                                                                                                                                               |
| `1.2rem`   | `400` / `600` | Subtítulos de sección (`views/landing.css:95,177,338`), `.error-subtitle` (`views/error.css:101`).                                                                                                        |
| `1.1rem`   | `600`         | Botones hero/CTA (`views/landing.css:118,351`), botones de acción en tarjeta móvil (`components/tables.css:244`), `.auth-btn-secondary` (`views/auth.css:116`), `.error-message` (`views/error.css:108`). |
| `1rem`     | `400` / `600` | Botones primarios, `.auth-subtitle`, `.auth-input`, `.error-btn-*` (`components/buttons.css:90`, `views/auth.css:58,70`, `views/error.css:127,153`).                                                      |
| `0.9rem`   | `500`         | Botones del navbar (`components/buttons.css:29`), `.footer-text` (`layout/footer.css:39`), `.hero-badge` (`views/landing.css:144`), `.tech-category` (`views/landing.css:308`).                           |
| `0.875rem` | `600`         | `.form-field-errors` (`components/forms.css:26`), `.btn-action` (`components/tables.css:86`).                                                                                                             |
| `0.85rem`  | `600`         | `.field-error` (`views/auth.css:220`), `.filter-bar-field .form-label` (`views/dashboard.css:101`).                                                                                                       |

---

## 4. Espaciado, radios, sombras, movimiento y breakpoints

### 4.1 Espaciado y contenedores

- Paddings y gaps recurrentes en `rem`: `0.375rem` / `0.5rem` / `0.75rem` / `0.875rem` / `1rem` / `1.25rem` / `1.5rem` / `2rem` / `2.5rem` / `3rem` / `4rem` / `6rem` (ej. `.content-card` `2rem`, `.auth-card`/`.error-card` `3rem`, `.feature-card` `2.5rem`, `.filter-bar` `1rem 1.25rem`, secciones landing `5rem 0`–`6rem 0`).
- Tarjetas de flujo auth/form: `.auth-card` `max-width: 500px; min-width: 400px` (`views/auth.css:34-36`); variante ancha `.auth-card--wide` `max-width: 700px` (`views/auth.css:200-202`).

### 4.2 Radios de borde

| Radio          | Uso y fuente                                                                                                                                                                                                                                                                                                                                                                              |
| :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `4px`          | `.btn-eye-toggle` (`components/forms.css:67`).                                                                                                                                                                                                                                                                                                                                            |
| `5px`          | `.btn-action` (`components/tables.css:88`).                                                                                                                                                                                                                                                                                                                                               |
| `6px`          | `.skeleton-line` (`views/dashboard.css:197`).                                                                                                                                                                                                                                                                                                                                             |
| `8px`          | Botones primarios y outline (`components/buttons.css`), `.alert` (`components/alerts.css:12`), `.table-container` y tarjetas de fila móvil (`components/tables.css:36,186`), inputs de formulario de turnos (`views/auth.css:182`), campos de `.filter-bar` (`views/dashboard.css:106`), `.error-image img` (`views/error.css:73`).                                                       |
| `0.5rem`       | `.user-dropdown .dropdown-menu` (`layout/header.css:99`).                                                                                                                                                                                                                                                                                                                                 |
| `10px`         | `.content-card` (`components/cards.css:13`), `.dropdown-menu` (`layout/header.css:63`), `.auth-input` / `.auth-btn-secondary` / `.privacy-notice` (`views/auth.css:68,114,232`), `.filter-bar` / `.chart-empty` (`views/dashboard.css:88,178`), `.error-btn-*` (`views/error.css:125,151`), botones hero/CTA y `.demo-card` (`views/landing.css:120,353,529`), `ConfirmDialog.svelte:95`. |
| `12px`         | `.tech-item` y `.tech-icon` (`views/landing.css:280,459`).                                                                                                                                                                                                                                                                                                                                |
| `15px`         | `.feature-card` (`views/landing.css:187`).                                                                                                                                                                                                                                                                                                                                                |
| `20px`         | `.auth-card` (`views/auth.css:31`), `.error-card` (`views/error.css:36`).                                                                                                                                                                                                                                                                                                                 |
| `25px`         | `.user-dropdown .dropdown-toggle` (`layout/header.css:83`).                                                                                                                                                                                                                                                                                                                               |
| `50px` / `50%` | `.hero-badge` y `.portfolio-badge` (`views/landing.css:143,417`); `50%` en `.feature-icon` (`views/landing.css:214`).                                                                                                                                                                                                                                                                     |

### 4.3 Sombras y anillos de foco

- **Plana:** `0 2px 4px rgba(0, 0, 0, 0.1)` (`components/alerts.css:14`, `components/tables.css:40,188`).
- **Tarjeta sutil / estándar:** `0 4px 6px rgba(0, 0, 0, 0.05)` (`.demo-card` `views/landing.css:532`) y `0 4px 6px rgba(0, 0, 0, 0.1)` (`.content-card` `components/cards.css:14`).
- **Tarjetas landing:** `0 4px 15px rgba(0, 0, 0, 0.05)` (`.feature-card`), `0 2px 10px rgba(0, 0, 0, 0.05)` (`.tech-item`).
- **Menús / diálogo:** `0 10px 30px rgba(0, 0, 0, 0.1)` (`.dropdown-menu`), `0 0.5rem 1rem rgba(0, 0, 0, 0.15)` (`.user-dropdown .dropdown-menu`), `0 0.5rem 1rem rgba(33, 37, 41, 0.3)` (`ConfirmDialog.svelte:96`).
- **Auth / error:** `0 20px 40px rgba(0, 0, 0, 0.08)` (`views/auth.css:33`, `views/error.css:38`).
- **Resplandor interactivo (hover):** `0 5px 15px rgba(74, 144, 226, 0.3)` (botones en `components/buttons.css`), `0 10px 25px rgba(74, 144, 226, 0.3)` (`views/auth.css:131`, `views/error.css:143,171`), `0 15px 35px rgba(74, 144, 226, 0.2)` (`.feature-card:hover`), `0 8px 25px rgba(74, 144, 226, 0.3–0.4)` (íconos y badges).
- **Anillos de foco:** `0 0 0 0.2rem rgba(74, 144, 226, 0.25)` (`components/forms.css:14`, `views/auth.css:190`), `0 0 0 0.2rem rgba(74, 144, 226, 0.15)` (`views/auth.css:82`, `views/dashboard.css:113`), y error `0 0 0 0.2rem rgba(220, 53, 69, 0.15)` (`views/auth.css:100`).

### 4.4 Movimiento y `prefers-reduced-motion`

- `@keyframes slideUp` (`utilities/animations.css:18-27`, `0.6s ease-out` en `.auth-card` `views/auth.css:38`).
- Transiciones explícitas `0.3s ease` (sin `transition: all` en el CSS propio).
- `@media (prefers-reduced-motion: reduce)` (`utilities/animations.css:43-73`) desactiva animaciones, `scroll-behavior` y elevaciones `transform` en hover. _(Deuda: `animations.css:61-63` aún referencia `.btn-add-dentist`, `.btn-edit` y `.btn-delete` sin uso y omite `.btn-add-primary`; `routes/login/+page.svelte:8-21` ejecuta una animación JS en `onMount` al margen de esta media query.)_

### 4.5 Breakpoints observados

| Media query                    | Archivo fuente                        | Propósito / observación                                                                                             |
| :----------------------------- | :------------------------------------ | :------------------------------------------------------------------------------------------------------------------ |
| `@media (max-width: 767.98px)` | `components/tables.css:49,165`        | Header de listas apilado y conversión de tablas en tarjetas clave-valor.                                            |
| `@media (max-width: 767px)`    | `views/dashboard.css:14,125`          | Apilamiento de `.appointment-item` (con 5 `!important`) y `.filter-bar`. **Deriva de 0.98px respecto a Bootstrap.** |
| `@media (max-width: 768px)`    | `utilities/responsive.css:26,95,144`  | Tipografía de landing, padding de `.auth-card` y `.error-card`. **Colisiona en `768px` exacto con `md`.**           |
| `@media (max-width: 576px)`    | `utilities/responsive.css:62,113,189` | Escala móvil compacta y footer centrado. **Colisiona en `576px` exacto con `sm`.**                                  |
| `@media (max-width: 400px)`    | `utilities/responsive.css:230`        | `.auth-card` / `.error-card` en móviles estrechos (`min-width: 300px`).                                             |
| `@media (max-height: 700px)`   | `utilities/responsive.css:241`        | Desactiva centrado vertical en viewports bajos (`padding-top: 100px`).                                              |

---

## 5. Reglas de componentes observadas

### 5.1 Botones (`components/buttons.css`, `components/tables.css`, `views/*.css`)

- **Primario (`.btn-primary`, `.navbar .btn-primary`, `.auth-btn-primary`, `.error-btn-primary`):** fondo sólido `var(--color-primario-dark)` (`#2b6cb0`), texto `var(--color-blanco)`, peso `600`, radio `8px` (`10px` en `.error-btn-primary`). Hover sólido `var(--color-acento-texto)` (`#2c5d8f`), `translateY(-2px)` (`-3px` en error) y sombra azul.
- **Outline (`.btn-outline-primary`, `.navbar .btn-outline-primary`):** borde `var(--color-primario)`, texto `var(--color-primario-dark)`; hover sólido `var(--color-primario-dark)` con texto blanco.
- **Secundario de formulario/error (`.auth-btn-secondary`, `.error-btn-secondary`):** borde `2px solid var(--color-primario-dark)`, radio `10px`, relleno sólido `var(--color-primario-dark)` al hover.
- **Agregar en listados (`.btn-add-primary` en `components/tables.css:15-33`):** fondo `var(--color-secundario)`, texto `var(--color-exito-texto)` (`7.51:1`), peso `600`; hover `var(--color-secundario-hover)`.
- **Acciones en listados actuales:** las rutas `/patients`, `/dentists` y `/appointments` usan botones icono-only `.btn.btn-sm.btn-outline-primary` y `.btn-outline-danger` (`components/tables.css:247-265` les da fondo tenue `0.12` y target `44×44px` bajo `767.98px`). Las clases `.btn-action`, `.btn-edit` (`--color-info-dark`) y `.btn-delete` (`--color-peligro`) siguen definidas en `components/tables.css:84-121` pero tienen `0` consumidores en Svelte.
- **CTA de landing (`.btn-cta-primary`, `.btn-cta-secondary` en `views/landing.css:367-401`):** blanco con texto `--color-primario-dark` / transparente con borde blanco de `2px`.

### 5.2 Tarjetas y contenedores

- **`.content-card` (`components/cards.css:11-17`):** fondo `var(--color-blanco)`, radio `10px`, padding `2rem`, sombra `0 4px 6px rgba(0,0,0,0.1)`.
- **`.auth-card` / `.error-card` (`views/auth.css:25-39`, `views/error.css:30-49`):** `rgba(255,255,255,0.95)`, `backdrop-filter: blur(10px)`, borde `1px solid var(--color-borde-suave)`, radio `20px`, sin pseudo-elementos `::before` decorativos.
- **`.stat-card` (`views/dashboard.css:55-74`):** variantes `.stat-card-total` (`--color-primario-dark`), `.stat-card-dentists` (`--color-exito-texto`), `.stat-card-patients` (`--color-info-dark`), `.stat-card-today` (`--color-acento-texto`), todas con texto `var(--color-blanco)` (cumplen AA/AAA).
- **`.demo-card` (`views/landing.css:525-539`), `.feature-card` (`views/landing.css:183-204`), `.tech-item` (`views/landing.css:277-294`):** superficies blancas con radio `10px`/`15px`/`12px`.

### 5.3 Formularios y diálogo (`components/forms.css`, `views/auth.css`, `ConfirmDialog.svelte`)

- **`.auth-input` + `.form-label`:** borde `2px solid var(--color-borde-suave)`, fondo `var(--color-fondo-input)`, radio `10px`; `.is-invalid` usa borde `var(--color-peligro)` y fondo `var(--color-peligro-suave)`; errores debajo con `.field-error` o `.form-field-errors`.
- **`.btn-eye-toggle` (`components/forms.css:57-97`):** `position: absolute; top: 2px; right: 4px; min-width: 44px; min-height: 44px; color: var(--color-texto-muted)`, foco en `var(--color-primario)`.
- **`.privacy-notice` (`views/auth.css:225-245`):** fondo `var(--color-acento)`, texto `var(--color-acento-texto)`, radio `10px`.
- **`ConfirmDialog.svelte`:** reemplaza `confirm()`/`alert()` nativos con overlay oscuro (`rgba(33,37,41,0.5)`), tarjeta `var(--color-blanco)` de radio `10px`, texto `var(--color-texto)` / `var(--color-texto-muted)` y botones Bootstrap (`btn-outline-secondary` / `btn-danger`).

### 5.4 Alertas, tablas y dashboard

- **`.alert-success` / `.alert-danger` (`components/alerts.css:11-25`):** `--color-secundario` + `--color-exito-texto` (`7.51:1`) y `--color-peligro-fondo` + `--color-peligro-texto` (`8.25:1`).
- **Tablas (`components/tables.css`):** cabecera `thead th` con `var(--color-primario)` y texto blanco (**3.29:1, deuda AA pendiente**); en `<=767.98px` cada `tr` pasa a tarjeta con `td::before { content: attr(data-label); color: var(--color-primario-dark); }` y acciones de `44×44px`.
- **Dashboard (`views/dashboard.css`):** `.filter-bar` en `var(--color-fondo-claro)`, `.chart-container` (`height: 350px`), `.upcoming-list` (`max-height: 350px; overflow-y: auto`), `.chart-empty` (`height: 350px`, borde punteado) y `.skeleton-row` / `.skeleton-line`.

### 5.5 Navegación y pie (`layout/header.css`, `layout/footer.css`)

- **Navbar sticky:** `rgba(255,255,255,0.95)`, `backdrop-filter: blur(10px)`, links en `var(--color-primario-dark)` con subrayado al hover/foco (`text-underline-offset: 4px`). _(Deuda AA pendiente: `.dropdown-item:hover` usa `--gradient-primary` con texto blanco.)_
- **Footer:** fondo `var(--color-primario-dark)`, texto `var(--color-blanco)`, logo invertido (`brightness(0) invert(1)`).

---

## 6. Estado actual de contraste y deuda técnica pendiente

### Cumple WCAG AA actualmente

- Botones primarios (`--color-primario-dark` + blanco: **5.42:1**; hover `--color-acento-texto` + blanco: **6.84:1**).
- Botón agregar `.btn-add-primary` y `.alert-success` (`--color-exito-texto` sobre `--color-secundario`: **7.51:1**).
- `.alert-danger` (`--color-peligro-texto` sobre `--color-peligro-fondo`: **8.25:1**).
- `.privacy-notice` (`--color-acento-texto` sobre `--color-acento`: **4.74:1**).
- Chips `.badge.status-*` (`4.69:1` a `11.08:1`) y `.stat-card-*` (`5.36:1` a `11.08:1`).
- Navbar links, footer y etiquetas móviles `td::before` (`5.42:1`).

### Pendiente de remediar (ver plan por sectores)

1. **Contrastes pendientes:** `.dropdown-item:hover` (`layout/header.css:72-75`), `.table thead th` (`components/tables.css:71-73`), `.error-title` (`views/error.css:83-91`), `.hero-title`/`.features-title`/`.feature-title`/`.tech-title` (`views/landing.css:59,172,235,266`) y colores Bootstrap en `frontend/src/lib/charts/dashboardCharts.js`.
2. **Cascada y responsive:** reordenar `utilities/responsive.css` después de `views/*` en `frontend/src/app.css`, alinear `767px`/`767.98px`/`768px` y `576px`, eliminar los 5 `!important` de `views/dashboard.css`, limpiar selectores muertos y mover la animación `onMount` de `routes/login/+page.svelte` a CSS sujeto a `prefers-reduced-motion`.
3. **Consistencia de templates Svelte:** evitar `<main>` anidado (`+layout.svelte` vs páginas), unificar `<h1>` y `FormCard` en `dashboard`, `login` y `users/register`, reemplazar clases de color/botón Bootstrap sueltas por clases con tokens, completar `aria-current="page"` / toggler `44px` / labels de `ListPageHeader`, y respetar los campos bloqueados por rol y `.auth-input` en formularios de edición.
