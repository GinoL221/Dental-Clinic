# Sistema de Diseño — Dental Clinic (`design/system.md`)

Documento generado por **Design System Sync** a partir de las fuentes CSS del proyecto en `frontend/static/css/**` y la plantilla base en `frontend/src/routes/+layout.svelte`.
Cubre las especificaciones **S2** ("Specs + sistema + artboards clave") y **S4** ("Evolucionar la marca actual: conservar azul #4a90e2 + menta #a4e2c2, ordenar tokens, eliminar valores hex hardcodeados y gradientes con `!important`").

---

## 1. Fuentes auditadas y dependencias

### 1.1 Dependencias upstream (externas)

- **Bootstrap 5.3.3**: Cargado vía CDN (`https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css`) en `frontend/src/routes/+layout.svelte`.
- **Bootstrap Icons 1.10.5**: Cargado vía CDN (`https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css`) en `frontend/src/routes/+layout.svelte`.
- **Regla de artboards**: Las pantallas de diseño y artboards (`design/**/*.html`) **NO deben utilizar URLs externas**, enlaces CDN ni fuentes remotas; todo icono o componente debe renderizarse mediante CSS inline, fuentes del sistema y SVGs vectoriales embebidos.

### 1.2 Archivos CSS auditados (16 archivos)

Todas las reglas y valores documentados en este sistema fueron extraídos exclusivamente de las siguientes rutas de código:

1. `frontend/static/css/base/tokens.css` (único archivo con propiedades personalizadas `:root`)
2. `frontend/static/css/base/typography.css` (pila tipográfica base)
3. `frontend/static/css/base/layout.css` (estructura, gradiente global del body y alturas)
4. `frontend/static/css/components/buttons.css` (variantes de botones, gradientes y estados hover)
5. `frontend/static/css/components/cards.css` (estilos base de contenedor de tarjetas)
6. `frontend/static/css/components/forms.css` (focus de inputs, botón toggle de contraseña)
7. `frontend/static/css/components/alerts.css` (mensajes flash y alertas de éxito/error)
8. `frontend/static/css/components/tables.css` (tablas, encabezados, botones de acción y transformación a card móvil)
9. `frontend/static/css/layout/header.css` (navbar sticky, desenfoque de fondo, links y dropdowns)
10. `frontend/static/css/layout/footer.css` (pie de página, tipografía y logo invertido)
11. `frontend/static/css/utilities/animations.css` (animaciones fadeIn, slideUp, spin)
12. `frontend/static/css/utilities/responsive.css` (media queries centralizadas para landing, auth, error y cards)
13. `frontend/static/css/views/auth.css` (formulario login/registro, inputs, validación, feedback de privacidad)
14. `frontend/static/css/views/dashboard.css` (barra de filtros, lista responsiva de turnos y contenedores de gráficos)
15. `frontend/static/css/views/error.css` (páginas de error 403/404, títulos con gradiente de texto)
16. `frontend/static/css/views/landing.css` (secciones hero, características, stack tecnológico, CTA y badges)

---

## 2. Tokens oficiales (Custom Properties en `:root`)

Ubicación: `frontend/static/css/base/tokens.css` (únicas custom properties declaradas en `:root`).

| Token CSS             | Valor Hex | Uso semántico en el proyecto                                                                                                           | Origen / Archivo fuente               |
| :-------------------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------ |
| `--color-primario`    | `#4a90e2` | Azul institucional primario: encabezados, bordes principales, botones principales, enlaces, thead de tablas, navbar brand y footer bg. | `frontend/static/css/base/tokens.css` |
| `--color-secundario`  | `#a4e2c2` | Verde menta secundario: fondo de `.alert-success`, botón `.btn-add-dentist`, acento en gradientes lineales.                            | `frontend/static/css/base/tokens.css` |
| `--color-acento`      | `#b3ddf2` | Celeste suave / pastel: segundo color en gradientes de botones principales, hover en filas de tablas, fondo de aviso de privacidad.    | `frontend/static/css/base/tokens.css` |
| `--color-fondo-claro` | `#f5f5f5` | Gris claro neutro: fondo de `.filter-bar` y estado vacío de gráficos `.chart-empty` en el dashboard.                                   | `frontend/static/css/base/tokens.css` |
| `--color-blanco`      | `#ffffff` | Blanco puro: fondos de tarjetas (`.content-card`, `.feature-card`), texto de botones, color de iconos en thead y footer.               | `frontend/static/css/base/tokens.css` |

---

## 3. Valores hardcodeados encontrados en CSS ("Hardcoded, not yet a token")

Los siguientes valores se encuentran directamente codificados en hojas de estilo sin contar con una variable CSS en `:root`. Deben normalizarse en tokens durante la evolución del sistema (S4).

### 3.1 Familia Peligro / Error (Danger)

| Valor                     | Aplicación / Rol                                                                                                            | Archivo fuente                                                   | Estado de contraste WCAG AA                                         |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------------------ |
| `#dc3545`                 | Botón eliminar (`.btn-delete`), borde error (`.auth-input.is-invalid`), mensaje `.field-error`, select inválido en filtros. | `components/tables.css`, `views/auth.css`, `views/dashboard.css` | **4.53:1** sobre blanco (**PASA** texto normal)                     |
| `#c82333`                 | Hover de botón eliminar (`.btn-delete:hover`).                                                                              | `components/tables.css`                                          | **5.61:1** sobre blanco (**PASA**)                                  |
| `#f8d7da`                 | Fondo de alerta de error (`.alert-danger`).                                                                                 | `components/alerts.css`                                          | 1.34:1 sobre blanco (es fondo contenedor)                           |
| `#721c24`                 | Texto de alerta de error (`.alert-danger`).                                                                                 | `components/alerts.css`                                          | **8.25:1** sobre `#f8d7da` (**PASA AAA**), **11.01:1** sobre blanco |
| `#fff5f5`                 | Fondo de campo inválido (`.auth-input.is-invalid`).                                                                         | `views/auth.css`                                                 | 1.07:1 (tinte de fondo)                                             |
| `rgba(220, 53, 69, 0.12)` | Fondo de botón outline de peligro en tabla móvil.                                                                           | `components/tables.css`                                          | Tinte visual para target táctil                                     |
| `rgba(220, 53, 69, 0.15)` | Sombra de foco en campo inválido.                                                                                           | `views/auth.css`                                                 | Anillo de foco                                                      |

### 3.2 Familia Información / Edición (Info)

| Valor     | Aplicación / Rol                                | Archivo fuente          | Estado de contraste WCAG AA                                                                                                                        |
| :-------- | :---------------------------------------------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#17a2b8` | Botón editar (`.btn-edit` background y border). | `components/tables.css` | **3.04:1** sobre blanco (**FALLA** texto normal < 4.5:1; pasa texto grande > 3:1). Texto blanco sobre `#17a2b8`: **3.04:1** (**FALLA** AA normal). |
| `#138496` | Hover de botón editar (`.btn-edit:hover`).      | `components/tables.css` | **4.40:1** sobre blanco (límite borderline < 4.5:1).                                                                                               |

### 3.3 Familia Éxito / Verde oscuro (Success complements)

| Valor     | Aplicación / Rol                                                                | Archivo fuente                                   | Estado de contraste WCAG AA                                                                                                                                            |
| :-------- | :------------------------------------------------------------------------------ | :----------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#2d6a4f` | Texto de alerta de éxito (`.alert-success`), texto de botón `.btn-add-dentist`. | `components/alerts.css`, `components/tables.css` | Sobre blanco: **6.39:1** (**PASA**). Sobre `--color-secundario` (`#a4e2c2`): **4.33:1** (**FALLA** levemente el umbral de 4.5:1 para texto normal; pasa grande 3.0:1). |
| `#7dd3a0` | Hover de botón agregar odontólogo (`.btn-add-dentist:hover`).                   | `components/tables.css`                          | Texto `#2d6a4f` sobre `#7dd3a0`: **3.56:1** (**FALLA** texto normal).                                                                                                  |

### 3.4 Familia Azul oscuro / Hover de botón / Marca

| Valor     | Aplicación / Rol                                             | Archivo fuente           | Estado de contraste WCAG AA                                                                               |
| :-------- | :----------------------------------------------------------- | :----------------------- | :-------------------------------------------------------------------------------------------------------- |
| `#3d7bc6` | Parada inicial en gradiente de hover para botones primarios. | `components/buttons.css` | **4.33:1** sobre blanco (**FALLA** normal 4.5:1; pasa grande). Texto blanco sobre `#3d7bc6`: **4.33:1**.  |
| `#9bcde8` | Parada final en gradiente de hover para botones primarios.   | `components/buttons.css` | **1.71:1** sobre blanco (**FALLA**).                                                                      |
| `#2c5d8f` | Texto en aviso de privacidad (`.privacy-notice`).            | `views/auth.css`         | Sobre `--color-acento` (`#b3ddf2`): **4.74:1** (**PASA** AA normal). Sobre blanco: **6.84:1** (**PASA**). |

### 3.5 Escala de Grises y Neutros

| Valor               | Aplicación / Rol                                                                                    | Archivo fuente                                                                              | Estado de contraste WCAG AA                            |
| :------------------ | :-------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------ | :----------------------------------------------------- |
| `#6c757d`           | Texto secundario y muted (`.auth-subtitle`, `.error-message`, `.tech-category`, `.btn-eye-toggle`). | `components/forms.css`, `views/auth.css`, `views/error.css`, `views/landing.css`            | **4.69:1** sobre blanco (**PASA** AA normal >= 4.5:1). |
| `#e9ecef`           | Borde de inputs (`.auth-input`) y separadores (`.auth-footer`, `.error-help`).                      | `views/auth.css`, `views/error.css`                                                         | Borde decorativo / estructural (1.19:1).               |
| `#f8f9fa`           | Fondo por defecto de inputs (`.auth-input`).                                                        | `views/auth.css`                                                                            | Superficie de entrada (1.05:1).                        |
| `white` / `#ffffff` | Color de texto en botones, badges, thead y navbar dropdowns.                                        | `components/buttons.css`, `components/tables.css`, `layout/header.css`, `views/landing.css` | —                                                      |

### 3.6 Transparencias Alpha observadas

- **Alphas de Azul Primario (`rgba(74, 144, 226, x)`):**
  - `0.05`: Fondo de `.landing-tech` (`views/landing.css`).
  - `0.10`: Fondos suaves en `body` (`base/layout.css`), `.error-container` (`views/error.css`), `.hero-badge` y contenedores de iconos de tecnología (`views/landing.css`).
  - `0.12`: Fondo para botón outline en tabla móvil (`components/tables.css`).
  - `0.15`: Anillos de foco en inputs de auth y dashboard (`views/auth.css`, `views/dashboard.css`).
  - `0.20`: Bordes de navbar (`layout/header.css`), `.hero-badge` (`views/landing.css`) y `.filter-bar` (`views/dashboard.css`).
  - `0.25`: Anillos de foco estándar en `.form-control:focus` (`components/forms.css`) y borde de `.privacy-notice` (`views/auth.css`).
  - `0.30`: Sombras de elevación en hover de botones (`components/buttons.css`, `views/auth.css`, `views/error.css`), badges flotantes y borde de `.chart-empty`.
  - `0.35` / `0.40`: Sombras de elevación en botón de registro y hover de badge (`views/auth.css`, `views/landing.css`).
- **Alphas de Menta Secundario (`rgba(164, 226, 194, x)`):**
  - `0.05` y `0.10`: Paradas en gradientes de fondo en `base/layout.css`, `views/landing.css` y `views/error.css`.
- **Alphas de Neutros y Sombras Negras (`rgba(0, 0, 0, x)`):**
  - `0.03`: Fondo para celda de acciones en tabla móvil (`components/tables.css`).
  - `0.05`: Sombra suave en `.feature-card` y `.tech-item` (`views/landing.css`).
  - `0.06`: Borde divisorio entre celdas en tabla móvil (`components/tables.css`).
  - `0.10`: Sombras estándar en tarjetas (`.content-card`, `.auth-card`, `.error-card`), tablas (`.table-container`), alertas y menú desplegable.
  - `0.15`: Sombra de dropdown de usuario (`layout/header.css`) y hover de imágenes.
  - `0.20`: Sombra en hover de botón `.btn-add-dentist` y botones CTA.

### 3.7 Gradientes observados

| Gradiente                                                                                                          | Uso principal                                                                                                                                    | Archivos fuente                                                                       |
| :----------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| `linear-gradient(135deg, var(--color-primario) 0%, var(--color-acento) 100%)`                                      | Botones primarios (navbar, auth, landing, error), iconos de features, fondo sección CTA y badge flotante. Generalmente forzado con `!important`. | `components/buttons.css`, `layout/header.css`, `views/error.css`, `views/landing.css` |
| `linear-gradient(135deg, #3d7bc6 0%, #9bcde8 100%)`                                                                | Estado hover de botones primarios.                                                                                                               | `components/buttons.css`                                                              |
| `linear-gradient(90deg, var(--color-primario) 0%, var(--color-secundario) 100%)`                                   | Barra decorativa superior de 5px en `.auth-card::before` y `.error-card::before`.                                                                | `views/auth.css`, `views/error.css`                                                   |
| `linear-gradient(135deg, var(--color-primario) 0%, var(--color-secundario) 100%)`                                  | Título de página de error (`.error-title`) con `background-clip: text`.                                                                          | `views/error.css`                                                                     |
| `linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(164, 226, 194, 0.1) 100%)`                               | Fondo suave global para `body` y contenedor de error.                                                                                            | `base/layout.css`, `views/error.css`                                                  |
| `linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(164, 226, 194, 0.1) 50%, rgba(179, 221, 242, 0.1) 100%)` | Fondo del hero en la página de inicio.                                                                                                           | `views/landing.css`                                                                   |
| `linear-gradient(135deg, rgba(74, 144, 226, 0.05) 0%, rgba(164, 226, 194, 0.05) 100%)`                             | Fondo de la sección de tecnologías en la landing page.                                                                                           | `views/landing.css`                                                                   |

### 3.8 Radios de borde (Border-Radius)

- `4px`: Botón toggle de visibilidad de contraseña (`components/forms.css`).
- `5px`: Botones de acción en tabla (`.btn-action`, `.btn-edit`, `.btn-delete` en `components/tables.css`).
- `8px`: Botones principales y outline (`components/buttons.css`), alertas (`components/alerts.css`), contenedor de tablas y cards móviles (`components/tables.css`), inputs en formularios de turnos (`views/auth.css`), campos de filtros (`views/dashboard.css`), imagen de error (`views/error.css`).
- `0.5rem` (~8px): Menú desplegable de usuario (`layout/header.css`).
- `10px`: Tarjetas de contenido estándar (`components/cards.css`), dropdowns generales (`layout/header.css`), inputs de autenticación (`views/auth.css`), barra de filtros (`views/dashboard.css`), botones hero y botones CTA (`views/landing.css`), botones de error (`views/error.css`), aviso de privacidad (`views/auth.css`).
- `12px`: Tarjetas de items tecnológicos y cajas de iconos en landing (`views/landing.css`).
- `15px`: Tarjetas de características (`.feature-card` en `views/landing.css`).
- `20px`: Tarjetas de autenticación (`.auth-card`) y tarjetas de error (`.error-card`).
- `25px`: Botón selector de usuario en la barra de navegación (`layout/header.css`).
- `50px` / `50%` (Píldora / Circular): Badge de hero (`views/landing.css`), badge flotante de portafolio (`views/landing.css`), icono circular de feature (`views/landing.css`).

### 3.9 Sombras y Elevaciones (Box-Shadows)

- **Superficie plana / sutil:** `0 2px 4px rgba(0, 0, 0, 0.1)` (Alertas en `components/alerts.css`, contenedor de tabla y tarjetas de fila móvil en `components/tables.css`).
- **Tarjeta estándar:** `0 4px 6px rgba(0, 0, 0, 0.1)` (`.content-card` en `components/cards.css`).
- **Elevación media:** `0 4px 15px rgba(0, 0, 0, 0.05)` (`.feature-card` en `views/landing.css`), `0 2px 10px rgba(0, 0, 0, 0.05)` (`.tech-item`).
- **Flotante / Menú:** `0 10px 30px rgba(0, 0, 0, 0.1)` (Menú desplegable en `layout/header.css`), `0 0.5rem 1rem rgba(0, 0, 0, 0.15)` (Dropdown de usuario).
- **Tarjeta modal / Autenticación:** `0 20px 40px rgba(0, 0, 0, 0.1)` (`.auth-card` en `views/auth.css`, `.error-card` en `views/error.css`).
- **Resplandor de acción primaria (Blue Glow):**
  - Botones hover: `0 5px 15px rgba(74, 144, 226, 0.3)`.
  - Botón secundario hover y error: `0 10px 25px rgba(74, 144, 226, 0.3)`.
  - Botón registrarse: `0 8px 20px rgba(74, 144, 226, 0.35)` (hover: `0 10px 25px rgba(74, 144, 226, 0.4)`).
  - Hover de tarjeta de feature: `0 15px 35px rgba(74, 144, 226, 0.2)`.
  - Iconos en hover: `0 8px 25px rgba(74, 144, 226, 0.3)`.

### 3.10 Puntos de ruptura responsivos (Breakpoints)

- `@media (max-width: 767.98px)`: Límite móvil para tablas en `components/tables.css`. Oculta encabezados tradicionales y transforma las filas en tarjetas móviles con etiquetas generadas mediante `td::before { content: attr(data-label); }`.
- `@media (max-width: 767px)`: Límite de dashboard móvil en `views/dashboard.css` para el apilamiento de `.appointment-item` y la barra de filtros `.filter-bar`.
- `@media (max-width: 768px)`: Adaptación de landing page, reducción de fuentes en hero/features y redimensionado de `.auth-card` y `.error-card` (`utilities/responsive.css`).
- `@media (max-width: 576px)`: Dispositivos móviles estándar: padding de secciones a `3rem 0`, tarjetas con margen dinámico `max-width: calc(100vw - 2rem)`.
- `@media (max-width: 400px)`: Teléfonos compactos: min-width de tarjeta a 300px, padding comprimido (`utilities/responsive.css`).
- `@media (max-height: 700px)`: Pantallas horizontales o reducidas: eliminación de centrado vertical forzado y ajuste de padding superior a 100px.

---

## 4. Tipografía

### 4.1 Pila tipográfica (Font Stack)

- **Pila declarada en el proyecto:**
  `"Segoe UI", Tahoma, Geneva, Verdana, sans-serif`
  _Fuente:_ `frontend/static/css/base/typography.css` (línea 20 original).
- **Pila heredada de Bootstrap 5 (CDN upstream):**
  `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif`
  _Fuente:_ `frontend/src/routes/+layout.svelte` vía Bootstrap 5.3.3.
- **Pila recomendada para artboards:** Pila del sistema nativo sin dependencias de fuentes externas ni Google Fonts:
  `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.

### 4.2 Escala tipográfica observada en CSS

| Tamaño CSS | Equivalente aprox. | Elementos / Clases donde se detectó                                                                                                      | Archivo fuente                                                                        |
| :--------- | :----------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| `0.85rem`  | ~13.6px            | Labels en barra de filtros (`.filter-bar-field .form-label`), mensajes de error de campo (`.field-error`).                               | `views/dashboard.css`, `views/auth.css`                                               |
| `0.875rem` | 14px               | Botones de acción en tabla (`.btn-action`).                                                                                              | `components/tables.css`                                                               |
| `0.9rem`   | ~14.4px            | Botones en navbar (`.navbar .btn-*`), texto de footer (`.footer-text`), badge de hero, categoría de tecnología, texto de ayuda en error. | `components/buttons.css`, `layout/footer.css`, `views/landing.css`, `views/error.css` |
| `1rem`     | 16px (Base)        | Botones principales estándar (`.btn-primary`, `.auth-btn-primary`), subtítulo de auth, inputs de auth, texto de error, descripciones.    | `components/buttons.css`, `views/auth.css`, `views/error.css`, `views/landing.css`    |
| `1.1rem`   | ~17.6px            | Botón secundario de auth (`.auth-btn-secondary`), botones hero/CTA, iconos de formulario, botones en tabla móvil, mensaje de error.      | `views/auth.css`, `views/landing.css`, `components/tables.css`, `views/error.css`     |
| `1.2rem`   | ~19.2px            | Subtítulo de hero (`.hero-subtitle`), subtítulo de características, subtítulo de CTA, mensaje de error en 404.                           | `views/landing.css`, `views/error.css`                                                |
| `1.4rem`   | ~22.4px            | Título de característica (`.feature-title`).                                                                                             | `views/landing.css`                                                                   |
| `1.5rem`   | 24px               | Marca en navbar (`.navbar-brand`), subtítulo de hero en tablet, título de auth responsivo en móvil.                                      | `layout/header.css`, `views/landing.css`, `utilities/responsive.css`                  |
| `1.75rem`  | 28px               | Título de auth y error en pantallas `<= 576px`.                                                                                          | `utilities/responsive.css`                                                            |
| `2rem`     | 32px               | Título de autenticación (`.auth-title`), títulos de sección en tablet (`.features-title`), título de error en tablet.                    | `views/auth.css`, `utilities/responsive.css`                                          |
| `2.5rem`   | 40px               | Título de error (`.error-title`), títulos de sección (`.features-title`, `.tech-title`, `.cta-title`), título de hero en tablet.         | `views/error.css`, `views/landing.css`, `utilities/responsive.css`                    |
| `3.5rem`   | 56px               | Título principal de hero (`.hero-title`).                                                                                                | `views/landing.css`                                                                   |
| `16px`     | 16px               | Icono de ojo en toggle de contraseña (`.btn-eye-toggle i`).                                                                              | `components/forms.css`                                                                |

### 4.3 Pesos tipográficos observados

- `400` (Regular): Subtítulos descriptivos (`.hero-subtitle` en `views/landing.css`).
- `500` (Medium): Enlaces de navegación (`.nav-link` en `layout/header.css`).
- `600` (Semi-bold): Botones (`.btn-primary`, `.auth-btn-primary`, `.btn-add-dentist`), encabezados de tabla (`.table thead th`, `td::before`), labels de formularios (`.form-label`), títulos de items y badges.
- `700` / `bold`: Marca de navbar (`.navbar-brand`), títulos de páginas (`.auth-title`, `.dentist-list-title`, `.hero-title`, `.error-title`, `.cta-title`).

---

## 5. Reglas de componentes observadas

### 5.1 Botones

- **Botón Primario (`.btn-primary`, `.auth-btn-primary`, `.main-content .btn-primary.btn-lg`):** Fondo con gradiente `linear-gradient(135deg, var(--color-primario) 0%, var(--color-acento) 100%) !important`, sin borde, `border-radius: 8px !important`, peso 600, color blanco. Al hover: gradiente `#3d7bc6` a `#9bcde8`, elevación `translateY(-2px)` y sombra `0 5px 15px rgba(74, 144, 226, 0.3)`.
- **Botón Outline Primario (`.btn-outline-primary`, `.navbar .btn-outline-primary`):** Borde y color de texto `var(--color-primario)`, fondo transparente, radio 8px, peso 600. Al hover: fondo `var(--color-primario)`, color blanco, sombra azul y `translateY(-2px)`.
- **Botón Secundario de Autenticación (`.auth-btn-secondary`, `.error-btn-secondary`):** Borde de 2px `var(--color-primario)`, radio 10px, padding `0.875rem 2rem`, peso 600. Hover con relleno sólido azul y `translateY(-3px)`.
- **Botones de Acción en Tablas (`.btn-action`):** Tamaño compacto (padding `0.375rem 0.75rem`, font-size `0.875rem`, radio 5px).
  - Editar (`.btn-edit`): fondo `#17a2b8`, hover `#138496`.
  - Eliminar (`.btn-delete`): fondo `#dc3545`, hover `#c82333`.
- **Botón Agregar Odontólogo (`.btn-add-dentist`):** Fondo `var(--color-secundario)` (#a4e2c2), texto `#2d6a4f`, peso 600. Hover con `#7dd3a0` y sombra `0 4px 8px rgba(0,0,0,0.2)`.
- **Botones CTA de Landing:** `.btn-cta-primary` blanco con texto azul; `.btn-cta-secondary` transparente con borde blanco de 2px.
- **Botón Deshabilitado (`.btn:disabled`):** `opacity: 0.6`, `cursor: not-allowed`.

### 5.2 Tarjetas y Contenedores

- **Tarjeta de Contenido (`.content-card`):** Superficie `var(--color-blanco)`, radio 10px, padding `2rem`, sombra `0 4px 6px rgba(0, 0, 0, 0.1)`.
- **Tarjeta de Autenticación y Error (`.auth-card`, `.error-card`):** Fondo translúcido `rgba(255, 255, 255, 0.85)` con `backdrop-filter: blur(10px)`, borde `1px solid rgba(255, 255, 255, 0.2)`, radio 20px, sombra pronunciada `0 20px 40px rgba(0, 0, 0, 0.1)`, y un pseudo-elemento `::before` superior de 5px con gradiente horizontal de primario a secundario.
- **Tarjeta de Características (`.feature-card`):** Fondo blanco, borde `1px solid rgba(74, 144, 226, 0.1)`, radio 15px, padding `2.5rem`, hover interactivo con `translateY(-10px)` y sombra `0 15px 35px rgba(74, 144, 226, 0.2)`.

### 5.3 Formularios

- **Campo estándar en foco (`.form-control:focus`):** Borde `var(--color-primario)`, anillo de sombra `0 0 0 0.2rem rgba(74, 144, 226, 0.25)`.
- **Campo de autenticación (`.auth-input`):** Borde de 2px `#e9ecef`, radio 10px, padding `0.875rem 1rem`, fondo `#f8f9fa`. Hover cambia borde a `var(--color-acento)` y fondo blanco. Foco añade sombra de 0.2rem con tinte 0.15 y levanta -2px.
- **Campo inválido (`.auth-input.is-invalid`):** Borde `#dc3545`, fondo `#fff5f5`. Sombra de foco en rojo `rgba(220, 53, 69, 0.15)`.
- **Toggle de Contraseña (`.btn-eye-toggle`):** Botón absoluto fijo (`top: 12px; right: 8px; width: 32px; height: 32px;`), color `#6c757d`, sin borde ni fondo nativo. Al foco muestra contorno de 2px en `var(--color-primario)`.
- **Barra de filtros (`.filter-bar`):** Contenedor flex con fondo `var(--color-fondo-claro)`, borde `1px solid rgba(74, 144, 226, 0.2)`, radio 10px, padding `1rem 1.25rem`.

### 5.4 Alertas y Mensajes Flash

- **Base (`.alert`):** Borde nulo, radio 8px, sombra suave `0 2px 4px rgba(0, 0, 0, 0.1)`.
- **Alerta Éxito (`.alert-success`):** Fondo `var(--color-secundario)` (`#a4e2c2`), texto `#2d6a4f`.
- **Alerta Peligro (`.alert-danger`):** Fondo `#f8d7da`, texto `#721c24`.

### 5.5 Tablas de datos y transformación Card-Table Móvil

- **Encabezado (`.dentist-list-header`):** Borde inferior de 3px en `var(--color-primario)`.
- **Cabecera de Tabla (`.table thead th`):** Fondo sólido `var(--color-primario)`, texto blanco, peso 600, mayúsculas con espaciado de 0.5px.
- **Fila en hover (`.table tbody tr:hover`):** Fondo `var(--color-acento)` con transición suave de 0.3s.
- **Transformación Responsiva Móvil (`@media (max-width: 767.98px)`):**
  - Contenedor sin sombra ni fondo. `thead` se oculta completamente (`display: none`).
  - Las filas `tr` se transforman en tarjetas independientes (`display: block; margin-bottom: 1rem; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); background: #ffffff;`).
  - Cada celda `td` se convierte en un par clave-valor (`display: flex; justify-content: space-between; align-items: baseline;`).
  - Etiqueta automática generada: `td::before { content: attr(data-label); font-weight: 600; color: var(--color-primario); }`.
  - Columna de índice `td[data-label="#"]` se oculta (`display: none`).
  - Fila de acciones `td[data-label="Acciones"]`: Bloque completo con fondo tenue `rgba(0,0,0,0.03)` y botones ampliados a un target táctil mínimo accesible de **44x44 px** (`min-height: 44px; min-width: 44px;`).

### 5.6 Badges y Estados de Turno (Appointments)

- **Estados de turnos observados en código (`routes/dashboard/+page.svelte` y `routes/appointments/+page.svelte`):**
  - `SCHEDULED` ("Programada"): `bg-secondary` (gris neutro) + texto blanco.
  - `IN_PROGRESS` ("En Curso"): `bg-info` (cyan institucional `#17a2b8`) + texto blanco.
  - `COMPLETED` ("Completada"): `bg-success` (verde `#28a745` / `#2d6a4f`) + texto blanco.
  - `CANCELLED` / `CANCELED` ("Cancelada"): `bg-danger` (rojo `#dc3545`) + texto blanco.
- **Badges de Interfaz:**
  - Hero Badge (`.hero-badge`): Fondo `rgba(74, 144, 226, 0.1)`, texto `var(--color-primario)`, borde `1px solid rgba(74, 144, 226, 0.2)`, radio 50px.
  - Floating Portfolio Badge (`.portfolio-badge`): Fijo en esquina inferior derecha, fondo con gradiente de primario a acento, texto blanco, radio 50px, sombra azul.

### 5.7 Navegación y Encabezado (Header & Navbar)

- **Barra sticky (`.navbar.sticky-top`):** Fondo `rgba(255, 255, 255, 0.95)`, efecto de desenfoque `backdrop-filter: blur(10px)`, borde inferior `1px solid rgba(74, 144, 226, 0.2)`, z-index 1030.
- **Enlaces de navegación (`.nav-link`):** Peso 500, color `var(--color-primario) !important`. Al hover: color `var(--color-secundario) !important` y elevación de 1px.
- **Dropdown de usuario (`.user-dropdown`):** Botón selector tipo píldora con borde de 1px en `var(--color-primario)`, radio 25px, padding `0.5rem 1rem`. Menú con sombra de 1rem y radio 0.5rem.

### 5.8 Pie de Página (Footer)

- Fondo sólido `var(--color-primario) !important`, color de texto blanco, padding `0.5rem 0`, margen superior automático para fijarse al final del viewport.
- Imagen del logo con filtro `brightness(0) invert(1)` para renderizar en blanco puro.

---

## 6. Auditoría de contraste WCAG AA y Fallas identificadas

Cálculo de luminancia relativa y ratio de contraste según la fórmula WCAG 2.1:
$$L = 0.2126 \cdot R + 0.7152 \cdot G + 0.0722 \cdot B$$
$$CR = \frac{L_1 + 0.05}{L_2 + 0.05}$$

Requisitos WCAG 2.1 Nivel AA:

- **Texto normal** (< 18pt o < 14pt bold / < 24px normal o < 18.66px negrita): **mínimo 4.5:1**.
- **Texto grande / negrita** ($\ge$ 18pt / 24px normal o $\ge$ 14pt / 18.66px negrita): **mínimo 3.0:1**.
- **Componentes de interfaz y gráficos interactivos**: **mínimo 3.0:1**.

### 6.1 Matriz de contraste sobre fondo blanco (`#ffffff`)

| Color / Token         | Valor Hex | Ratio vs Blanco | WCAG AA Normal (<18pt) | WCAG AA Grande ($\ge$18pt/negrita) | Diagnóstico & Comportamiento observado                                                                                                                                                                                                         |
| :-------------------- | :-------- | :-------------- | :--------------------- | :--------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--color-primario`    | `#4a90e2` | **3.29:1**      | **FALLA**              | **PASA**                           | **ALERTA CRÍTICA:** Usado como texto de links (`.nav-link`, `.auth-link`, `td::before`) y botones outline. En texto de tamaño regular (16px / 1rem) no alcanza 4.5:1. Pasa únicamente en títulos $\ge$ 24px o textos en negrita $\ge$ 18.66px. |
| `--color-secundario`  | `#a4e2c2` | **1.48:1**      | **FALLA**              | **FALLA**                          | **FALLA SEVERA:** Inutilizable como color de texto sobre blanco. En `layout/header.css`, `.nav-link:hover` cambia a este color sobre el navbar blanco, volviéndose ilegible.                                                                   |
| `--color-acento`      | `#b3ddf2` | **1.44:1**      | **FALLA**              | **FALLA**                          | Inutilizable como texto sobre blanco. Solo apto para fondos y superficies suaves.                                                                                                                                                              |
| `--color-fondo-claro` | `#f5f5f5` | **1.09:1**      | Fondo                  | Fondo                              | Fondo neutro de interfaz.                                                                                                                                                                                                                      |
| Primary Hover Blue    | `#3d7bc6` | **4.33:1**      | **FALLA**              | **PASA**                           | Muy cercano a 4.5:1 pero técnicamente por debajo en texto normal.                                                                                                                                                                              |
| Primary Hover Accent  | `#9bcde8` | **1.71:1**      | **FALLA**              | **FALLA**                          | Solo apto para gradientes de fondo decorativos.                                                                                                                                                                                                |
| Info / Cyan           | `#17a2b8` | **3.04:1**      | **FALLA**              | **PASA**                           | Botón `.btn-edit` con texto blanco sobre `#17a2b8` tiene un ratio de **3.04:1** (**FALLA** AA en texto de 14px).                                                                                                                               |
| Info Hover Cyan       | `#138496` | **4.40:1**      | **FALLA**              | **PASA**                           | Ligeramente inferior a 4.5:1.                                                                                                                                                                                                                  |
| Danger Red            | `#dc3545` | **4.53:1**      | **PASA**               | **PASA**                           | Cumple con el estándar de accesibilidad.                                                                                                                                                                                                       |
| Danger Hover Red      | `#c82333` | **5.61:1**      | **PASA**               | **PASA**                           | Cumple con el estándar de accesibilidad.                                                                                                                                                                                                       |
| Text Muted Grey       | `#6c757d` | **4.69:1**      | **PASA**               | **PASA**                           | Cumple con el estándar de accesibilidad para subtítulos sobre blanco.                                                                                                                                                                          |
| Alert Danger Text     | `#721c24` | **11.01:1**     | **PASA AAA**           | **PASA AAA**                       | Excelente contraste sobre blanco y sobre `#f8d7da` (8.25:1).                                                                                                                                                                                   |
| Alert Success Text    | `#2d6a4f` | **6.39:1**      | **PASA**               | **PASA**                           | Excelente contraste sobre blanco.                                                                                                                                                                                                              |
| Privacy Notice Text   | `#2c5d8f` | **6.84:1**      | **PASA**               | **PASA**                           | Excelente contraste sobre blanco.                                                                                                                                                                                                              |
| Add Dentist Hover     | `#7dd3a0` | **1.80:1**      | **FALLA**              | **FALLA**                          | Inutilizable como texto; como fondo con texto `#2d6a4f` da **3.56:1** (**FALLA** normal).                                                                                                                                                      |

### 6.2 Matriz de pares contextuales (Fondo + Texto en componentes)

| Componente            | Par de colores evaluado                                          | Ratio medido | Estado WCAG AA                                    | Recomendación evolutiva (S4)                                                                                                                      |
| :-------------------- | :--------------------------------------------------------------- | :----------- | :------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Botón Primario**    | Blanco (`#ffffff`) sobre `--color-primario` (`#4a90e2`)          | **3.29:1**   | **FALLA** en texto normal < 18.66px negrita       | Aumentar el peso tipográfico a negrita $\ge 18.66px$, o adoptar un azul de marca accesible como `#2b6cb0` / `#1e5ba3` (ratio > 4.5:1) para texto. |
| **Navbar link hover** | `--color-secundario` (`#a4e2c2`) sobre Navbar blanco (`#ffffff`) | **1.48:1**   | **FALLA SEVERA**                                  | Reemplazar el hover por un azul más oscuro `#2b6cb0` con subrayado o fondo activo en lugar de menta claro.                                        |
| **Alerta Éxito**      | Texto `#2d6a4f` sobre fondo `--color-secundario` (`#a4e2c2`)     | **4.33:1**   | **FALLA** por 0.17 puntos para texto normal 4.5:1 | Oscurecer ligeramente el texto a `#1b4332` (ratio **7.51:1**, PASA AA pleno) o aclarar el fondo a `#d8f3e5`.                                      |
| **Botón Editar**      | Blanco (`#ffffff`) sobre `#17a2b8`                               | **3.04:1**   | **FALLA** en texto regular de 14px                | Usar un tono cyan más profundo `#0e7490` o `#138496` con texto en negrita.                                                                        |
| **Aviso Privacidad**  | Texto `#2c5d8f` sobre fondo `--color-acento` (`#b3ddf2`)         | **4.74:1**   | **PASA AA**                                       | Excelente combinación, mantener como patrón.                                                                                                      |
| **Alerta Peligro**    | Texto `#721c24` sobre fondo `#f8d7da`                            | **8.25:1**   | **PASA AAA**                                      | Excelente contraste, plenamente accesible.                                                                                                        |

---

## 7. Plan de evolución de marca y tokens (S4)

Para cumplir con la dirección visual acordada en **S4** ("Evolucionar la marca actual conservando el azul `#4a90e2` y menta `#a4e2c2`, ordenar tokens y eliminar valores hex sueltos y gradientes con `!important`"):

1. **Tokens de texto accesibles:**
   - `--color-primario-dark`: `#2b6cb0` (para textos de enlaces y elementos interactivos sobre blanco).
   - `--color-texto-exito`: `#1b4332` (para asegurar 7.51:1 sobre el verde menta).
2. **Tokens semánticos para estados de turnos y acciones:**
   - `--color-peligro`: `#dc3545`, `--color-peligro-hover`: `#c82333`.
   - `--color-info`: `#17a2b8`, `--color-info-dark`: `#0e7490` (5.36:1 con texto blanco; `#138496` mide 4.40:1 y no cumple).
   - `--color-texto-muted`: `#6c757d`, `--color-borde-suave`: `#e9ecef`.
3. **Erradicación de `!important` en gradientes:**
   - Reemplazar las declaraciones forzadas en `components/buttons.css` por clases utilitarias bien estructuradas (`.btn-brand-gradient`) y definir el gradiente mediante tokens (`--gradient-primary: linear-gradient(135deg, var(--color-primario) 0%, var(--color-acento) 100%)`).
