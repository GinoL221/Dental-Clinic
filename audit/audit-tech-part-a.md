# Auditoría Técnica Impeccable — Parte A (frontend)

> Proyecto: Dental-Clinic · Rama `chore/impeccable-audit` (base `main@aab120d`)
> Alcance: auditoría técnica de solo lectura — 5 dimensiones (audit.md v4.8.2). Los ejes de identidad, propósito y concisión se cubren en la Parte B (worker hermano); este informe no los duplica.
> Método: detector determinístico (`impeccable detect`) + verificación manual de código (contrastes calculados, greps de ARIA/focus/animación/responsive). Sin navegador: ver "Lo que NO se verificó".

## Audit Health Score

| # | Dimensión | Puntaje | Hallazgo clave |
|---|-----------|---------|----------------|
| 1 | Accesibilidad | 2 | Texto blanco sobre gradiente que termina en `--color-acento` (#b3ddf2) → **1.44:1**; `prefers-reduced-motion` ausente en todo el CSS del proyecto |
| 2 | Rendimiento | 3 | Bootstrap JS (~80 KB) render-blocking en `<head>` sin `defer` desde CDN |
| 3 | Theming | 3 | Tokens impecables (0 hex fuera de tokens.css), pero chips de estado usan utilidades Bootstrap (`bg-info` + texto blanco → 1.96:1) fuera del sistema de tokens |
| 4 | Responsive | 3 | Bien cubierto y testeado; targets táctiles 44×44 verificados en tablas; breakpoints mezclados 767/767.98/768 |
| 5 | **Integridad de Implementación** | 4 | Detector limpio ×2 (exit 0); sistema coherente y específico del producto — **PASS** |
| **Total** | | **15/20** | **Good — atender dimensiones débiles (Accesibilidad)** |

Bandas: 18-20 Excellent · 14-17 Good · 10-13 Acceptable · 6-9 Poor · 0-5 Critical.

## Veredicto de Integridad de Implementación

**Empieza aquí. PASS — el frontend expresa un sistema coherente y específico del producto.**

Evidencia verificada:

- **Detector determinístico**: `npx --no-install impeccable detect ../frontend/static/css --json` → `[]` (exit 0, limpio). `npx --no-install impeccable detect src --json` → `[]` (exit 0, limpio). **Cero hallazgos, cero falsos positivos que invalidar.**
- **Tokens**: la paleta de marca dental (`--color-primario` #4a90e2, `--color-secundario` #a4e2c2, `--color-acento` #b3ddf2) está centralizada en `frontend/static/css/base/tokens.css` y consumida vía `var()` en todo el árbol. Grep de hex en `static/css/`: solo `tokens.css` (21) y el vendor `lib/uPlot.min.css` (2). **0 hex duros en CSS propio.**
- **Especificidad de producto**: contenido y flujos son de dominio dental (pacientes/DNI, odontólogos/matrícula, citas con estados SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED en `src/lib/utils/formatters.js:50-56`); nada es intercambiable con un producto genérico.
- **Disciplina de implementación**: cada CSS modular lleva encabezado de procedencia ("Extracted from: frontend/public/css/style.css, original lines N-M"), los literales rgba() sin token equivalente están documentados en línea ("no token equivalent; kept as literal (design/system.md allows alpha literals pending token addition)") — p. ej. `views/landing.css:279-280`, `layout/footer.css:33-34`. Este nivel de trazabilidad es inusual y positivo.
- **Evidencia correlacionada**: `frontend/tests/fullstack/responsive.spec.js` afirma con Playwright real (backend+frontend, dispositivo Pixel 5) las mismas propiedades verificadas aquí: sin overflow horizontal, roles ARIA de tabla, targets 44×44, paridad `data-label`↔`<th>`.

Atajos de implementación recurrentes: ninguno sistémico. Los dos patrones menores (ver Hallazgos P2/P3) son utilidades semánticas Bootstrap y literales alpha documentados, no deriva de diseño.

## Resumen Ejecutivo

- Audit Health Score: **15/20** (**Good**)
- Total de hallazgos: **16** (P0: **0** · P1: **6** · P2: **4** · P3: **6**)
- Top issues críticos:
  1. Contraste del texto blanco en el gradiente primario→acento de la landing (CTA y badge del portafolio): hasta **1.44:1** (WCAG AA 1.4.3 falla estrepitosamente).
  2. Chips de estado de citas `bg-info` + `text-white` (**1.96:1**) y botones de acción de tabla con tinte al 12% (**2.91:1**) — fallos AA verificados por cálculo.
  3. `prefers-reduced-motion` ausente en todo el CSS del proyecto pese a keyframes (`fadeIn`, `slideUp`, `spin`) y 37 reglas `transition: all`.
  4. Bootstrap JS (~80 KB) render-blocking en `<head>` sin `defer`, cargado desde CDN en todas las páginas.
- Próximos pasos recomendados: corregir los contrastes P1 con tokens existentes (`--color-primario-dark` 5.42:1 y `--color-acento-texto` 6.84:1 ya resuelven la mayoría), añadir `prefers-reduced-motion`, mover Bootstrap a bundle local con `defer`. Remediación detallada → T9 (este informe no aplica fixes).

## Hallazgos Detallados por Severidad

### P0 Bloqueante

Ninguno. Ningún hallazgo impide completar una tarea.

### P1 Mayores (violan WCAG AA; corregir antes de release)

**[P1] Texto blanco sobre gradiente que termina en `--color-acento` — 1.44:1**
- Ubicación: `frontend/static/css/views/landing.css:293-306` (`.landing-cta`), `:373-382` (`.portfolio-badge`); contenido en `src/routes/+page.svelte:285-286` (`.cta-title`, `.cta-subtitle`)
- Categoría: Accesibilidad
- Impacto: el título y subtítulo del CTA —la conversión principal de la landing (modo Persuade)— se leen sobre la zona clara del gradiente. Blanco (#ffffff) sobre #b3ddf2 = **1.44:1**; sobre #4a90e2 (inicio) = 3.29:1. Ambos por debajo de 4.5:1 (y el inicio también < 4.5 para el `cta-subtitle` de 1.2rem).
- WCAG/Estándar: SC 1.4.3 (AA)
- Recomendación: oscurecer el extremo del gradiente del CTA/badge (p. ej. `--color-primario-dark` #2b6cb0 → blanco = 5.42:1 en todo el rango) o cambiar el texto a un token oscuro (`--color-acento-texto` #2c5d8f = 6.84:1 sobre blanco) con fondo claro. El `.cta-buttons .btn` claro con `--color-primario-dark` ya cumple (5.42:1) — mantener.
- Comando sugerido: `/impeccable colorize`

**[P1] `.tech-name` en `--color-primario` sobre blanco — 3.29:1**
- Ubicación: `frontend/static/css/views/landing.css:281-284`; fondo `.tech-item` blanco en `:263`
- Categoría: Accesibilidad
- Impacto: nombre de cada tecnología del stack (peso 600, tamaño ~1rem → texto "normal" a efectos WCAG: no alcanza el umbral de large-text de 18.66px bold). Falla AA.
- WCAG/Estándar: SC 1.4.3 (AA)
- Recomendación: usar `var(--color-primario-dark)` (#2b6cb0 → 5.42:1) o `var(--color-acento-texto)` (6.84:1).
- Comando sugerido: `/impeccable colorize`

**[P1] Texto del footer blanco sobre `--color-primario` — 3.29:1**
- Ubicación: `frontend/static/css/layout/footer.css:16-19` (`footer`), `:35-44` (`.footer-text`, 0.9rem); `:22-24` (`.text-muted` forzado a blanco — correctamente anulado para evitar gris sobre azul, pero hereda el mismo contraste)
- Categoría: Accesibilidad
- Impacto: todo el texto legal/informativo del pie (0.9rem) en todas las páginas falla AA.
- WCAG/Estándar: SC 1.4.3 (AA)
- Recomendación: oscurecer el fondo del footer a `var(--color-primario-dark)` (blanco = 5.42:1) o aclarar el texto (p. ej. #eaf3fc sobre #4a90e2 ≥ 4.5:1 — verificar al implementar).
- Comando sugerido: `/impeccable colorize`

**[P1] Chips de estado de cita `bg-info` + `text-white` — 1.96:1**
- Ubicación: `src/routes/dashboard/+page.svelte:403-408` con `getStatusClass` de `src/lib/utils/formatters.js:48` (`IN_PROGRESS → bg-info`); mismo patrón en `src/routes/appointments/+page.svelte:108` (`.badge bg-success`)
- Categoría: Accesibilidad / Theming
- Impacto: el estado "En progreso" (texto blanco sobre #0d6efd... no: #0dcaf0 de Bootstrap) = **1.96:1** — ilegible para usuarios con baja visión. Los demás estados pasan por margen fino: bg-primary 4.50:1 (justo al límite), bg-success 4.53:1, bg-danger 4.53:1.
- WCAG/Estándar: SC 1.4.3 (AA)
- Recomendación: mapear los estados a tokens del proyecto con pares AA ya existentes (p. ej. `--color-info-dark` #0e7490 con blanco = 5.36:1; `--color-exito-texto` sobre `--color-secundario` = 7.51:1 como en `alerts.css`). De paso unifica la identidad visual (ver P2 de theming).
- Comando sugerido: `/impeccable colorize`

**[P1] Botones de acción de tabla (desktop): icono `--color-primario` sobre tinte al 12% — 2.91:1**
- Ubicación: `frontend/static/css/components/tables.css:197-208` (fondo `rgba(74, 144, 226, 0.12)` sobre blanco → efectivo ≈ #e9f2fc) con texto/icono `--color-primario`
- Categoría: Accesibilidad
- Impacto: acciones editar/eliminar de las tres listas (pacientes, odontólogos, citas) fallan AA en la variante de tinte. La variante outline pura sobre blanco también da 3.29:1.
- WCAG/Estándar: SC 1.4.3 (AA)
- Recomendación: usar `var(--color-primario-dark)` (5.42:1 sobre blanco; ~5.0 sobre el tinte) para el glifo.
- Comando sugerido: `/impeccable colorize`

**[P1] `prefers-reduced-motion` ausente en todo el proyecto**
- Ubicación: grep `prefers-reduced-motion` en `src/` + `static/css/` → **0 resultados**; keyframes en `frontend/static/css/utilities/animations.css:15-49` (`fadeIn`, `slideUp`: opacity+transform), `:60-70` (`spin` infinito) y 37 reglas `transition: all` (ver P2)
- Categoría: Accesibilidad
- Impacto: usuarios con trastorno vestibular no reciben alternativa; las animaciones actuales son leves (transform/opacity) y el `.spinning` es un spinner legítimo, pero no hay interruptor alguno. Nota audit.md: un kill-switch global de 0.01ms también sería incorrecto — lo que falta es la media query.
- WCAG/Estándar: SC 2.3.3 (AAA, pero expectativa estándar), SC 2.2.2
- Recomendación: añadir en `utilities/animations.css` una `@media (prefers-reduced-motion: reduce)` que deje las transiciones esenciales de feedback (color/outline) pero elimine translate/scale/spin decorativos.
- Comando sugerido: `/impeccable animate`

### P2 Menores (existe workaround; corregir en la próxima pasada)

**[P2] Bootstrap JS render-blocking en `<head>` sin `defer`, desde CDN**
- Ubicación: `frontend/src/app.html:16-24` (`bootstrap.bundle.min.js` vía jsDelivr, síncrono); CSS en `:7-15`
- Categoría: Rendimiento
- Impacto: ~80 KB de JS bloquean el primer render en todas las páginas (landing incluida); además el CDN es punto único de fallo y añade negociación TLS externa. El bundle solo se usa para collapse del navbar y 2 dropdowns.
- Recomendación: añadir `defer` (mínimo), valorar empaquetar Bootstrap JS por npm para integridad de supply-chain y permitir tree-shaking futuro.
- Comando sugerido: `/impeccable optimize`

**[P2] Texto `--color-texto-muted` sobre fondos con tinte — 4.23–4.30:1**
- Ubicación: `frontend/static/css/views/landing.css:96-101` (`.hero-description`, 1.2rem sobre hero con gradiente alpha 10% → efectivo ≈ #edf4fc → **4.23:1**); `landing.css:86,94` (hero-subtitle 1.5rem = large text, pasa 3:1); cálculo sobre `--color-fondo-claro` #f5f5f5 = **4.30:1** (aplica a futuros usos de muted sobre esa superficie, p. ej. `dashboard.css:59,138`)
- Categoría: Accesibilidad
- Impacto: descripción del hero falla AA por margen estrecho (4.23 < 4.5). El resto de textos muted de landing están sobre blanco (4.69:1, pasa).
- WCAG/Estándar: SC 1.4.3 (AA)
- Recomendación: aclarar `--color-texto-muted` un paso (#6b7280 sigue fallando; #5d6a75 ≈ 5.1:1 sobre #edf4fc — verificar al implementar) o definir un token `--color-texto-muted-sobre-tinte`.
- Comando sugerido: `/impeccable colorize`

**[P2] 37 reglas `transition: all 0.3s ease`**
- Ubicación: 37 apariciones en CSS propio (grep, sin contar vendor), p. ej. `components/buttons.css:38,52,75,91,111,130,146,164`, `layout/header.css:28-102`, `views/landing.css:75-493`, `layout/footer.css:25`
- Categoría: Rendimiento
- Impacto: `all` fuerza al navegador a interceptar cualquier propiedad animable (incluidas las de layout si algún día cambian) y encarece el style recalc. No hay thrashing ni animación de propiedades de layout hoy (positivo), pero es frágil.
- Recomendación: sustituir por listas explícitas (`transition: background-color .3s, color .3s, transform .3s, box-shadow .3s`).
- Comando sugerido: `/impeccable optimize`

**[P2] Utilidades semánticas Bootstrap (`bg-*`, `.badge`) fuera del sistema de tokens**
- Ubicación: `src/routes/dashboard/+page.svelte:308,315,397,400,405`, `src/routes/appointments/+page.svelte:108`; mapping en `src/lib/utils/formatters.js:50-56`
- Categoría: Theming / Integridad
- Impacto: los colores de estado (#0dcaf0, #198754, #0d6efd, #dc3545) no existen en `tokens.css` ni en `design/system.md`; dos de ellos están al borde o fuera del AA (ver P1). Rompe la coherencia del sistema de color propio en la superficie Operate más usada.
- Recomendación: definir tokens semánticos de estado en `tokens.css` (fondo+texto verificados AA) y mapear `getStatusClass` a clases propias.
- Comando sugerido: `/impeccable colorize`

### P3 Pulido (corregir si hay tiempo)

**[P3] `color: white` literal en `buttons.css`** — `frontend/static/css/components/buttons.css:59,100,112,121,131,138,153,165,175`. Único punto donde el CSS propio evade `var(--color-blanco)`. Cambiar por el token. `/impeccable colorize`.

**[P3] ~20 literales `rgba()` alpha sin token** — p. ej. `views/landing.css:280,399`, `layout/footer.css:34,48`, `views/dashboard.css:62,140`, `components/forms.css:84`. Están documentados como pendientes de token (política de design/system.md); crear `--color-primario-alpha-*` y sustituir. `/impeccable document`.

**[P3] Email de login sin `autocomplete="email"`** — `src/routes/login/+page.svelte:36-44`. El registro ya usa `autocomplete="new-password"` correctamente (`users/register/+page.svelte:412,450`). Añadir el atributo ayuda al autocompletado del navegador. `/impeccable onboard`.

**[P3] Triggers de dropdown como `<a href="#">`** — `src/routes/+layout.svelte:40-47,74-82,104-112,129-137` (con `svelte-ignore a11y-invalid-attribute` explícito y `role="button"`; Bootstrap gestiona teclado). Un `<button>` real eliminaría el atributo href placeholder. `/impeccable harden`.

**[P3] Breakpoints mezclados 767 / 767.98 / 768** — `components/tables.css:47,120` (767.98px), `views/dashboard.css:14,100` (767px), `utilities/responsive.css` (768px). Funcionalmente equivalentes hoy, pero tres convenciones conviven; unificar en una sola (Bootstrap usa 767.98px). `/impeccable layout`.

**[P3] `.btn-eye-toggle` 32×32px** — `components/forms.css:60-77`. Cumple WCAG AA 2.5.8 (≥24px) pero no el AAA 44×44 que el propio proyecto aplica a las acciones de tabla móvil (`tables.css:186-191`, testeado en `responsive.spec.js:141`). `/impeccable harden`.

## Patrones y Problemas Sistémicos

- **El sistema de color propio es AA-sólido, pero el azul claro de marca no alcanza AA como texto**: cada fallo de contraste verificado (tech-name, footer, botones outline, texto sobre gradiente) involucra `--color-primario` #4a90e2 (3.29:1 sobre blanco) o `--color-acento` #b3ddf2 (1.44:1 con blanco). Es un patrón sistémico, no errores aislados: la corrección es policy-level (reservar primario/acento para fondos y bordes, usar `--color-primario-dark`/`--color-acento-texto` para texto).
- **Los colores de estado viven en dos mundos**: tokens (`alerts.css`, `tables.css` — pares 7.51:1 y 8.25:1, excelentes) y utilidades Bootstrap (chips de citas — al borde o fuera de AA). Unificar bajo tokens resuelve P1+P2 a la vez.
- **Responsiveness madura y con red de tests**: breakpoints centralizados en `utilities/responsive.css` (declarado "centralized for audit/verification"), min-widths agresivos mitigados por breakpoints (auth/error card 400→350→320→300 en `responsive.css:175,223,261`), y `responsive.spec.js` (9 journeys × 3 rutas) afirmando overflow, targets 44×44, roles ARIA y paridad data-label↔th con Playwright real.

## Hallazgos Positivos

1. **Higiene de tokens ejemplar**: 0 hex fuera de `tokens.css` en CSS propio (solo el vendor uPlot.min.css), imports modulares con procedencia documentada, literales pendientes marcados en línea con justificación. Vite compila y minifica todo en un asset único (`src/app.css` → 66 KB fuente sin minificar).
2. **Accesibilidad estructural sólida pese al score 2**: 114 atributos `aria-` en rutas y componentes, `role="alert"` en errores, `aria-invalid` en filtros, roles ARIA completos de tabla (`role="table"/"rowgroup"/"row"/"cell"`), `aria-label` dinámico en el toggle de contraseña con `:focus` con outline explícito (`forms.css:85-88`), `aria-expanded`/`aria-controls` en el navbar-toggler, `lang="es"` en `app.html`, jerarquía h1→h2→h3 limpia en landing, `loading="lazy"` en imágenes del layout.
3. **Animaciones eficientes**: keyframes solo con `opacity`/`transform` (nada de layout props), cero `will-change` en CSS propio (solo 2 en vendor uPlot), sin blur/shadow animados sin límite.
4. **Targets táctiles verificados en producción**: 44×44 con icono centrado en acciones de tabla móvil (`tables.css:183-191`), respaldado por test e2e dedicado (`responsive.spec.js:141`).
5. **Arquitectura lib cohesionada**: `api.js` (63 líneas) centraliza fetch/errores, validación y formatters con tests unitarios Vitest (no hay patrones de re-render innecesario; componentes Svelte son presentacionales y las páginas orquestan).

## Superficies con Modos (crítica breve, heurísticas critique.md)

**Landing — modo Persuade**
- Comunicación: h1 con propuesta de valor + subtítulo/descripción en <5 s; jerarquía visual hero→features→tech→CTA clara (heurística 8 en general bien). Red flags: el CTA final —el momento peak-end— es la zona de peor contraste del sitio (1.44:1) y socava justo el objetivo Persuade; el `.portfolio-badge` fijo (bottom/right, z-index 1000) persiste durante todo el scroll y compite con el contenido sin función de navegación clara (Casey/móvil: tap accidental, tapa contenido en 576px, `responsive.css:68-74`).
- Lo que funciona: secciones con una decisión por pantalla, copy en español de dominio dental.

**Auth — modo Operate**
- Carga cognitiva baja: una tarjeta, un foco, campos con `label for` explícitos, errores con `role="alert"` y `fieldErrors` por campo (heurísticas 5 y 9 bien). El toggle de ojo tiene `aria-label` dinámico y outline de foco. Red flags menores: falta `autocomplete="email"` en login (P3); el `min-width: 400px` base de la tarjeta está correctamente mitigado por breakpoints (350/320/300), verificado en `responsive.css:175-265`.
- Lo que funciona: recuperación de errores sin borrar datos (`value={form?.oldData?.email}`).

**Dashboard — modo Operate**
- Barra de filtros con labels, `aria-invalid` y manejo de error con `role="alert"` (`dashboard/+page.svelte:223`); dropdown de estado con opciones como `<button>` reales (teclado OK vía Bootstrap); gráfico uPlot se redimensiona con el contenedor y se destruye en `onDestroy` (sin fugas). Red flags: los chips de estado (la información semántica central) fallan contraste en IN_PROGRESS (P1) y dependen de color + texto sin icono adicional — el texto salva la dependencia de color, pero a 1.96:1 el texto no se lee.
- Lo que funciona: filtros con ≤4 campos visibles (carga cognitiva baja, Working Memory Rule), empty state dedicado (`dashboard.css:130-145`).

## Acciones Recomendadas (orden de prioridad)

1. **[P1] `/impeccable colorize`**: corregir los 5 fallos AA de contraste con tokens existentes — gradiente CTA/badge, `.tech-name`, footer, chips de acción de tabla, chips de estado (`bg-info`→`--color-info-dark`), y revisar `--color-texto-muted` sobre tintes (P2). Es un solo cambio de política de color.
2. **[P1] `/impeccable animate`**: añadir `@media (prefers-reduced-motion: reduce)` preservando feedback esencial (color/foco) y eliminando translate/scale/spin decorativos.
3. **[P2] `/impeccable optimize`**: `defer` (o bundle local) para Bootstrap JS; sustituir las 37 `transition: all` por listas explícitas de propiedades.
4. **[P2] `/impeccable colorize`** (continuación): tokens semánticos de estado en `tokens.css` y mapeo de `getStatusClass` a clases propias, retirando `bg-*` de Bootstrap.
5. **[P3] `/impeccable harden`**: `<button>` en triggers de dropdown, `autocomplete="email"`, evaluar target 44px del eye-toggle.
6. **[P3] `/impeccable document`**: crear tokens alpha (`--color-primario-alpha-*`) y sustituir los ~20 literales rgba documentados; unificar breakpoints 767/767.98/768.
7. **`/impeccable polish`** como paso final de verificación tras los fixes.

> Puedes pedirme que ejecute estos comandos de uno en uno, todos a la vez, o en el orden que prefieras.
> Re-ejecuta `/impeccable audit` tras las correcciones para ver la puntuación mejorar.

## Lo que NO se verificó

- **Escaneo de URL / navegador (S5)**: no se ejecutó. Motivo: no hay binario de Chrome/Chromium instalable en PATH (`command -v` sin resultados; solo existen builds de Playwright en `~/.cache/ms-playwright`, no registrados como navegador de sistema). Conforme al mandato S5 se sustituyó por `npx --no-install impeccable detect` sobre `static/css` y `src` (ambos limpios). Consecuencia: **no hay lecturas de contraste en píxel renderizado, ni overlays visuales, ni capturas**; todos los contrastes son calculados desde los hex de `tokens.css` y el CSS (fiables salvo herencias no previstas).
- **Contrastes sobre puntos intermedios del gradiente**: se computaron los extremos (#4a90e2 y #b3ddf2); el valor real varía a lo largo del degradado (entre 1.44 y 3.29).
- **Gestos táctiles reales** (drag, sliders, scroll-swallows): sin navegador no se sintetizaron; solo hay revisión estática de handlers (no se detectaron superficies de drag propias).
- **Lectores de pantalla / navegación por teclado end-to-end**: verificación estática de ARIA/roles/labels únicamente.
- **Rendimiento medido** (Lighthouse, tamaños transferidos reales, métricas web): el peso de Bootstrap es estimación de tamaño de paquete conocido, no medición de red.
- **Suite Playwright `responsive.spec.js`**: NO se ejecutó (auditoría de solo lectura, sin levantar servers); se cita como evidencia existente y correlacionada, no como verificación propia.
- **Modo oscuro**: ausente por diseño (decisión de producto documentada); no se audita su funcionamiento.
- **`uPlot.min.css`**: vendor con 2 hex y 2 `will-change` propios; se excluye de la política de tokens por ser terceros, sin auditar su contenido interno.

---

*Auditoría de solo lectura — Parte A (técnica). Sin cambios en código fuente. Parte B (identidad / propósito / concisión) cubre los ejes restantes.*
