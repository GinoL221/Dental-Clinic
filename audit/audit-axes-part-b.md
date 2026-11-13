# Auditoría Impeccable — Parte B (identidad, propósito y concisión)

> Proyecto: Dental-Clinic · Rama `chore/impeccable-audit` (base `main@aab120d`, tras `audit/audit-tech-part-a.md` @ 01ce2db)
> Alcance: los tres ejes de usuario (S2) — **Identidad** vs `design/system.md` + `docs/design.md`, **Propósito** vs `docs/product.md` (leído completo), **Concisión** (código muerto y duplicación). Solo lectura: este informe no modifica código fuente; la remediación es T9.
> Método: greps clase por clase de `static/css/**` contra `src/**/*.svelte`, `src/**/*.js` y `src/app.html` (incluyendo cadenas dinámicas: `getStatusClass`, interpolaciones de clase y directivas `class:`); lectura completa de `docs/product.md`, `docs/design.md`, `design/system.md`, `+layout.svelte` y la landing. Los 5 hallazgos técnicos de la Parte A **no se repiten**; se referencian como «A-…».

## Resumen

- Total de hallazgos: **19** (P0: **0** · P1: **2** · P2: **10** · P3: **7**)
- Identidad: 8 (P1: 1 · P2: 4 · P3: 2, más 1 verificación OK)
- Propósito: 8 (P1: 1 · P2: 5 · P3: 1, más 1 verificación OK)
- Concisión: 5 (P2: 1 · P3: 4)

---

## Eje 1 — Identidad (vs `design/system.md` y `docs/design.md`)

### I1 · [P2 · cosmetic] Estilos inline `style=` que burlan el sistema de tokens — 14 apariciones en 3 archivos

- Ubicación:
  - `frontend/src/routes/+page.svelte:218` — sección de credenciales demo: `style="padding: 4rem 0; background: rgba(74, 144, 226, 0.1);"` (literal alpha sin token; la misma tinta 0.10 está documentada como pendiente de token en `design/system.md` §3.6).
  - `frontend/src/routes/+page.svelte:230, 245, 262` — las tres `.demo-card`: `style="background: white; padding: 2rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"` — `white` en vez de `var(--color-blanco)`, radio/sombra duplicando los niveles documentados (`system.md` §3.9) y pegados tres veces idénticos.
  - `frontend/src/routes/+page.svelte:223, 232, 247, 264` — `color: var(--color-primario)` como **texto** de encabezados: `docs/design.md` §2 lo prohíbe explícitamente («**No** para texto normal», 3.29:1); corresponde `--color-primario-dark`.
  - `frontend/src/routes/+page.svelte:205` — `style="max-height: 100%; max-width: 100%;"` en el SVG de SvelteKit (menor, pero sin clase).
  - `frontend/src/routes/dashboard/+page.svelte:365, 383, 489, 516` — alturas de contenedores de gráficos (`height/max-height: 350px`) inline, cuando `.chart-container` y `.chart-empty` ya fijan 350px en `static/css/views/dashboard.css:128-146` — duplicación de fuente de verdad.
  - `frontend/src/lib/components/EmptyState.svelte:11` — `style="font-size: 3rem"` en el componente compartido (aparece en las 3 listas).
- Impacto: los dos únicos puntos donde el markup evade el sistema de tokens son exactamente la superficie Persuade (landing) y el dashboard. Contradice la higiene de tokens que la Parte A calificó de ejemplar en el CSS.
- Remediación: crear `.demo-credentials`/`.demo-card` en `views/landing.css` (ver I2), `.chart-container` ya existe para las alturas (usarla), clase `.empty-state-icon` para `EmptyState`; sustituir `white` por `var(--color-blanco)` y `color: var(--color-primario)` por `var(--color-primario-dark)`.

### I2 · [P2 · content] Clases `.demo-credentials` y `.demo-card` en el markup sin ningún CSS propio

- Ubicación: `frontend/src/routes/+page.svelte:217, 229, 244, 261` (grep en `static/css/**` → **0 reglas**).
- Impacto: es el problema inverso al selector muerto: clases que parecen del sistema pero cuyo estilo vive 100% inline (I1). Un lector del `system.md` no puede saber cómo se ve esa sección.
- Remediación: mover los estilos a `views/landing.css` con esas clases (y tokens), o eliminar las clases si se decide another approach.

### I3 · [P1 · functional] Vista de error 403/404 planificada pero no construida: `error.css` completo, ningún `+error.svelte`

- Ubicación:
  - CSS presente y cableado: `static/css/views/error.css` (≈190 líneas: `.error-container`, `.error-card`, `.error-title`, `.error-actions`, `.error-btn-primary/secondary`, `.error-help`, `.error-link`), reglas responsivas duplicadas en `static/css/utilities/responsive.css` (`.error-card`, `.error-img`, `.error-title`, `.error-actions`), `.error-btn-primary` también en `static/css/components/buttons.css`, `.error-page` en `static/css/base/layout.css`, e import activo en `frontend/src/app.css:34` (`@import "../static/css/views/error.css";`).
  - Markup ausente: `find src -name "+error*"` → **0 resultados**; ninguna clase `error-*` aparece en ningún `.svelte` (grep verificado).
- Verificación: SvelteKit renderiza su página de error por defecto. El camino es alcanzable en la demo: `/dashboard` para `DENTIST`/`PATIENT` lanza `error(403, …)` en `frontend/src/routes/dashboard/+page.server.js:37-38`, y el evaluador técnico llega ahí por el CTA «Demo Rápido» (ver P-1). `docs/design.md` §6.4 promete «tarjeta central con título, explicación y salida clara («Volver al inicio»)».
- Clasificación: **functional** (flujo prometido, no implementado).
- Recomendación: **construir, no borrar**. Existe `+error.svelte` por crear en `src/routes/` consumiendo el CSS ya importado (`status`/`message` de `page.error`, botón «Volver al inicio»). Borrar `error.css` sería perder trabajo ya hecho y contradecir `design.md` §6.4. Si se decidiera no construirlo, entonces sí procede borrar `error.css` + sus reglas en `responsive.css`/`buttons.css`/`layout.css` y el import — es una decisión binaria que no puede quedar a medias.

### I4 · [P3 · cosmetic] Prop `cardClass` de `FormCard` sin uso (verificado)

- Ubicación: definido en `frontend/src/lib/components/FormCard.svelte:15` (`export let cardClass = ""`) y consumido en `:21`; grep de `cardClass` en todo `src/` → **solo esas 2 líneas**. Las 8 vistas que usan `FormCard` (login, change-password, patients/add+edit, dentists/add+edit, appointments/add+edit) no lo pasan nunca.
- Remediación: eliminar el prop (solución de 2 líneas) o documentar su uso previsto. Cruza al eje 3 (C-2).

### I5 · ✅ Verificación OK — los cinco `!important` de `dashboard.css` siguen justificados

- Ubicación: `static/css/views/dashboard.css:20, 22, 30, 33, 34` (bloque `max-width: 767px`).
- Verificado contra el markup actual: `d-flex align-items-center p-3 … appointment-item` presente en `frontend/src/routes/dashboard/+page.svelte:388` y `ms-2 d-flex align-items-center gap-2 appointment-actions` en `:414`. El comentario justificativo (utilidades Bootstrap generadas con `!important`) sigue siendo correcto y las clases siguen existiendo. **Sin acción.** Además se verificó que no quedan otros `!important` en CSS propio (grep en `buttons.css`, `header.css`, `footer.css` → 0), coherente con `system.md` §3.1.7.

### I6 · [P2 · cosmetic] Adopción incompleta de componentes compartidos

- Lo que ya está bien adoptado (verificado): `ListPageHeader` en las 3 listas (`patients/+page.svelte:38`, `dentists/+page.svelte:38`, `appointments/+page.svelte:52`), `EmptyState` en las 3 (`patients:140`, `dentists:139`, `appointments:166`), `FormCard` en los 8 formularios, `.content-card` como contenedor de las 3 listas.
- Huecos:
  1. **Tarjetas de métricas del dashboard**: 4 tarjetas crudas de Bootstrap con `bg-primary/bg-success/bg-info/bg-warning` + `text-white` (`dashboard/+page.svelte:294, 308, 322, 336`) en lugar de un patrón propio. `bg-warning` + blanco = **1.63:1** (calculado) — instancia nueva no cubierta por la Parte A (que citó los chips de estado en `:403-408`; ver A-P1 y A-P2 de theming). `bg-info` (1.96:1) también aparece aquí en `:322`.
  2. **«No hay citas próximas»** (`dashboard/+page.svelte:465`) es un `<p>` crudo en vez del componente `EmptyState` que las tres listas ya usan.
  3. **Clase fantasma**: `ListPageHeader.svelte:33` emite `class="btn btn-add-patient"` pero `grep btn-add-patient static/css` → **0 reglas**; el botón depende solo del `btn` de Bootstrap. Nombra un estilo que no existe (espejo de `.btn-add-dentist`, que existe pero nadie usa — ver C-1).
- Remediación: extraer `MetricCard` a `src/lib/components/`, reutilizar `EmptyState` en el dashboard, crear (o eliminar) la clase `btn-add-patient` en `tables.css` usando el par AA ya definido (`--color-exito-texto` sobre `--color-secundario`, 7.51:1).

### I7 · [P3 · cosmetic] Anti-patrones vs principios de `docs/design.md`: sin side-tabs ✓, gradientes y animaciones fuera de especificación

- **Side-tabs: verificada su ausencia.** No hay ninguna franja decorativa `::before` en `auth.css`/`error.css`/`cards.css`; los únicos `td::before` son las etiquetas `data-label` de la tabla móvil (`tables.css:168, 186`) — legítimas. La remediación reclamada por `system.md` §3.1.6 se aplicó de verdad.
- **Gradientes**: `buttons.css` aplica `var(--gradient-primary)` a todos los botones de acción (`:34, 71, 107, 126, 160`). `docs/design.md` §2 establece como objetivo «el botón primario lleva texto blanco sobre el azul sólido `--color-primario-dark`; el gradiente queda para superficies decorativas (hero, CTA)». Es un objetivo documentado y no construido (misma categoría que I3); la consecuencia AA del gradiente ya está cuantificada en la Parte A (A-P1).
- **Animaciones**: elevaciones que exceden el sistema documentado (`design.md` §4: `-2px` y `0.2s`): `-3px` en `.auth-btn-secondary`/`.error-btn-*`, `-10px` en `.feature-card` (`landing.css`), transiciones `0.3s` en vez de `0.2s` en todo `buttons.css`. La ausencia de `prefers-reduced-motion` ya es A-P1 — aquí solo se registra la desviación de valores.
- Remediación: alinearse con §4 (un solo valor de elevación y duración) cuando se toque cada archivo; no es urgente.

### I8 · [P2 · content] `design/system.md` desincronizado del CSS real (afirma código que ya no existe)

- Ubicación y contradicciones verificadas:
  - `system.md` §3.7/§5.1/§5.7 afirman gradientes «generalmente forzados con `!important`» y `.nav-link` con `color: var(--color-primario) !important` y hover menta: **falso hoy** — grep de `!important` en `buttons.css`, `header.css`, `footer.css` → 0 resultados; `.nav-link` real usa `--color-primario-dark` con hover subrayado (`header.css:42-53`).
  - `system.md` §5.1 afirma `.btn-edit` con fondo `#17a2b8` (3.04:1): el CSS real usa `var(--color-info-dark)` (`tables.css:86-90`).
  - `system.md` §5.2 describe el `::before` de 5px en `.auth-card`/`.error-card` que ya no existe (ver I7).
- Impacto: para la audiencia evaluadora (que contrasta docs con código, per `product.md` §1), un documento de sistema que afirma `!important` inexistentes es una falla de credibilidad mayor que un hex suelto. La tabla de tokens (§2) sí está correcta.
- Clasificación: content (documentación, no CSS).
- Remediación: re-ejecutar el sync de sistema de diseño (`Design System Sync`) o corregir a mano §3.7, §5.1, §5.2 y §5.7.

---

## Eje 2 — Propósito (vs `docs/product.md`, leído completo)

### P-1 · [P1 · functional] El CTA principal de la landing («Demo Rápido» → `/dashboard`) termina en callejón sin salida

- Ubicación: `frontend/src/routes/+page.svelte:295-299` (`href="/dashboard"`), destino protegido: `frontend/src/routes/dashboard/+page.server.js:37-38` lanza `error(403, …)` si el rol no es `ADMIN`; `hooks.server.js` ya redirige a `/login` si no hay sesión.
- Impacto: para la audiencia primaria definida en `product.md` §1 (el evaluador técnico), el momento de mayor carga persuasiva (fin de la landing, modo Persuade) conduce a: visitante → redirect a `/login` (sin contexto de demo), `DENTIST`/`PATIENT` logueados → **página de error por defecto de SvelteKit 403** (porque I3 no está construida). La promesa «Demo Rápido» no cumple.
- Remediación (elegir una): apuntar el CTA a `/login` con la credenciales demo visibles en la misma pantalla; o etiquetarlo «Ver dashboard (ADMIN)»; o mostrarlo solo condicionado por rol. Combinar con I3 para el caso 403.

### P-2 · [P2 · functional] Navegación por rol: condicionales G3 correctos, pero las ramas no-ADMIN exponen enlaces muertos y ocultan un permiso real

- Verificado contra la matriz de `product.md` §3:
  - `ADMIN` ve Dashboard + los tres grupos con «Listar/Agregar» — ✓ correcto (`+layout.svelte:30-46, 55-76, 81-100`).
  - `DENTIST` ve «Listar pacientes/odontólogos/citas» + «Programar cita», sin Dashboard ni «Agregar» — ✓ correcto en lo esencial.
  - **Pero** las ramas `{#:else}` muestran `href="#pacientes"` (`+layout.svelte:64`) y `href="#odontologos"` (`:95`): **no existe ningún elemento con esos ids en todo `src/`** (grep verificado) — son enlaces muertos que no llevan a ninguna parte, en cualquier página.
  - Para `PATIENT`, el dropdown «Gestión Odontólogos» ofrece solo el ancla muerto «Nuestros Odontologos» (`:96`, además sin tilde) — pero la matriz le **concede** listar odontólogos (`product.md` §3, fila «Odontólogos: listar: Sí» para `PATIENT`): un permiso real sin ruta de navegación.
  - `PATIENT` también ve el ítem «Listar pacientes» (`+layout.svelte:58-60`, incondicional en el dropdown): al abrirlo, el guard de `hooks.server.js` solo exige sesión (no rol), el loader llama a `GET /api/patients` — reservado a `ADMIN` y `DENTIST` según la matriz — y el catch degrada a un genérico «Error al cargar pacientes» (`patients/+page.server.js:17-21`) mostrado como alerta: el rol ve una página rota en vez de no ver el enlace. Es exactamente el patrón del principio 2 de `docs/design.md` («un control que terminaría en 403 no se muestra») que G3 resolvió para los botones de acción pero no para este ítem de nav.
- `docs/design.md` §5.1 ya ordena: «Los enlaces ancla `#pacientes` y `#odontologos` que hoy ven los roles sin permiso de alta se eliminan».
- Remediación: eliminar las ramas else con anclas; dar a `PATIENT` el enlace directo a `/dentists`; ocultar el grupo «Gestión Pacientes» para `PATIENT`.

### P-3 · [P2 · content] Las feature cards de la landing prometen capacidades fuera de alcance (`product.md` §2)

- Ubicación (`frontend/src/routes/+page.svelte`):
  - `:74` «…estados dinámicos y **notificaciones**» — fuera de alcance («Notificaciones por email o SMS», §2).
  - `:87` «…especialidades, horarios y **asignación automática de citas**» — no existe: especialidades son solo API (brecha G5 abierta), la asignación es manual y no hay horarios configurables (§2, §5).
  - `:99` «…pacientes con **historiales médicos**» — fuera de alcance («Historia clínica…», §2).
  - `:112` «Análisis en **tiempo real**» — es un snapshot consultado por request; «tiempo real» es una promesa que el código no sostiene.
- Impacto: `product.md` §1 define su propia regla — «lo que todavía no existe… figura como límite explícito, nunca como funcionalidad terminada». El evaluador técnico que pruebe «notificaciones» o busque el historial clínico encontrará la contradicción en los primeros 2 minutos.
- Remediación: reescribir las 4 tarjetas con capacidades implementadas (máquina de estados, colisiones con restricción única, anti-IDOR, dashboard con filtros — que son los verdaderos diferenciales según §1).

### P-4 · [P3 · content] Voz narrativa mixta y vocabulario de dominio inconsistente

- Evidencia: la landing habla en primera persona de portfolio («proyecto de portfolio» `:288`, badge GitHub `:310`, título `Dental Clinic - Gino Lencina`), pero los formularios hablan voz de clínica real: «Crea tu cuenta para solicitar citas en **nuestra clínica**» (`users/register/+page.svelte:126`), y la nav muestra «Nuestros pacientes»/«Nuestros Odontologos» (`+layout.svelte:65, 96`).
- Terminología: la UI alterna «dentistas» (landing `:80-87`, títulos) con «odontólogos» (nav, formularios), y «citas» (nav «Gestión Citas», dashboard «Citas Hoy») con «turnos» (aria-labels, `product.md`). Ninguno de los dos pares está unificado.
- Clasificación: content, P3. Remediación: elegir un término por par (sugerencia: «odontólogo» y «turno», que es lo que usa `product.md`) y una sola voz (portfolio o clínica) en una pasada de copy.

### P-5 · [P2 · content] El tono viola el principio 6 de `docs/design.md` (voseo) en ~25 cadenas de usuario

- Principio: «Español claro y tuteo rioplatense neutro en mensajes («Ingresá», «Elegí»)» (`docs/design.md:16`).
- Evidencia (grep verificado, formas verbales no voseantes en strings de usuario):
  - `login/+page.svelte:30` «**Accede** a tu cuenta», `:65` «¿No **tienes** una cuenta?»
  - `users/register/+page.svelte:126` «**Crea** tu cuenta», `:168, 195` «**Ingresa** tu nombre/apellido», `:441` «**Repite** tu contraseña», `:466` «¿Ya **tienes** una cuenta?», `:309` «**Ingrese** solo números…»
  - `users/change-password/+page.svelte:19-20` «**debes** cambiar…» / «Establece…»
  - Placeholders «**Ingrese** el/la …»: `patients/add:31, 56, 79, 104`; `patients/edit:34, 59, 82, 107`; `dentists/add:31, 56, 79`; `dentists/edit:34, 59, 82`; `appointments/add:188`; `appointments/edit:176`
  - `appointments/edit/[id]/+page.svelte:49, 105` «**Seleccione** un paciente/odontólogo» (y el resto de selects «Seleccione…»)
  - `dashboard/+page.server.js:81` «No **tienes** permisos» (mensaje de error visible)
  - `+page.svelte:287` «**Descubre** todas las funcionalidades»
- Impacto: es el único principio de `design.md` que hoy se incumple de forma sistémica (no un caso aislado). Para el eje Propósito es señal de que nunca hubo una pasada de copy.
- Clasificación: content, P2. Remediación: una sola pasada de copy con tabla de conversión (Ingrese→Ingresá, Seleccione→Elegí, tienes→tenés, Repite→Repití, Accede→Ingresá/Entrá, Descubre→Descubrí, debes→tenés que).

### P-6 · [P2 · functional] La máquina de estados de turnos no tiene UI completa: sin selector en edición y dropdown del dashboard que ofrece transiciones inválidas

- Verificado: `/appointments/edit/[id]` **no tiene ningún campo de estado** (grep `name="` → solo `patientId, dentistId, appointmentDate, appointmentTime, description`). `docs/design.md` §7 promete para esa ruta «selector de estado con transiciones válidas».
- El único punto de cambio de estado es el dropdown de próximos turnos del dashboard, que ofrece **siempre** las 3 opciones sin mirar el estado actual (`dashboard/+page.svelte:437-453`): un turno `IN_PROGRESS` sigue mostrando «Marcar en progreso» (transición inválida → error del backend). `design.md` §6.3: «El cambio de estado ofrece solo las transiciones válidas; los estados terminales no muestran selector».
- Remediación: derivar las opciones del dropdown de `appointment.status` (máquina en `formatters.js`, testeable), y evaluar añadir el selector al formulario de edición.

### P-7 · [P2 · functional] Estados de carga ausentes en listados y dashboard (prometidos en `design.md` §6.1)

- Verificado: grep `loading|cargando|skeleton` en las 3 listas + dashboard → **0 resultados**. Los listados muestran tabla o `EmptyState` (✓ `patients:140`, `dentists:139`, `appointments:166`) y alertas de error (✓ `patients:48,53`, `dentists:48,53`, `appointments:62`), pero ningún estado de carga. `design.md` §6.1 exige «cargando (esqueleto de filas)».
- Matiz honesto: SvelteKit SSR mitiga la carga inicial; el gap aparece en navegaciones cliente y en la actualización de estado del dashboard (`alert()` en `dashboard/+page.svelte:60,63` como único feedback — además `confirm()`/`alert()` nativos contradicen `design.md` §6.1 «confirmación en un diálogo propio, no `confirm()` del navegador»).
- Remediación: estado `loading` en cada listado (esqueleto o spinner con `aria-busy`), feedback con alerta propia en cambio de estado del dashboard.

### P-8 · ✅ Verificaciones OK del eje Propósito

- **Credenciales demo coherentes** (G1 resuelta, confirmada contra el seed): la landing (`+page.svelte:229-266`) muestra exactamente los pares del `DataInitializer.java` — `admin@dentalclinic.com`/`admin123` (`:78,79`), `maria.gonzalez@dentalclinic.com`/`maria123` (`:88,89`), `juan.perez@email.com`/`juan123` (`:122,123`). La historia de demo es reproducible.
- **Doble audiencia atendida**: título «Dental Clinic - Gino Lencina», badge de GitHub, sección de stack (`+page.svelte:12, 30-33, 124-162`) hablan al evaluador; sin mock data: todos los datos llegan por `apiFetch` en `+page.server.js` (14 rutas, grep verificado) — no hay datos hardcodeados en componentes.
- **Accesos de visitante sin fricción**: nav de visitante «Ingresar» + «Registrarse» (`+layout.svelte:160-165`) coincide con la tabla de `product.md` §7.

---

## Eje 3 — Concisión

### C-1 · [P3 · cosmetic] Selectores CSS muertos verificados (clase por clase contra markup y cadenas dinámicas)

Cada entrada: grep del nombre (y subcadenas para clases compuestas dinámicamente) en `src/**/*.svelte`, `src/**/*.js`, `src/app.html` → **0 usos**.

| Selector | Ubicación | Nota |
| --- | --- | --- |
| `.fade-in` | `static/css/utilities/animations.css:27` | 0 usos en markup/JS |
| `.spinning` (+ keyframes `spin`) | `static/css/utilities/animations.css:56` | grep `spin` en `src/` → 0 resultados; ni un spinner se renderiza hoy |
| `.btn-add-dentist` y `:hover` | `static/css/components/tables.css:12, 20` | el botón real de las listas es `.btn-add-patient` vía `ListPageHeader` — que a su vez no tiene CSS (I6.3) |
| `.btn-action`, `.btn-edit`, `.btn-delete` | `static/css/components/tables.css:86-108` | las acciones reales usan `btn btn-sm btn-outline-primary/danger` (`patients/+page.svelte:94, 122`; mismo patrón en dentists/appointments/dashboard) |
| `.alert-success` | `static/css/components/alerts.css` | 0 usos; las alertas reales son `alert-danger`/`alert-warning` |
| Todos los `.error-*` | `views/error.css` completo + `responsive.css` + `.error-btn-primary` en `buttons.css` + `.error-page` en `layout.css` | sin markup; su destino depende de la decisión de I3 (build ⇒ vivos; delete ⇒ borrar junto) |
| `.tech-icon-img`, `.tech-logo` | `static/css/views/landing.css` + `responsive.css` | los `<img>` del stack van sin clase (`+page.svelte:133-206`) |
| `.btn-lg` (override propio) | `static/css/components/buttons.css` | `btn-lg` no aparece en ningún `.svelte` |
| `.password-strength-indicator` | `static/css/components/forms.css` | 0 usos |
| `.flex-fill`, `.gap-3`, `.text-end` (overrides propios) | `views/auth.css`, `layout/footer.css` | utilidades Bootstrap redefinidas por el proyecto sin uso en markup |

- **Candidatos del predecesor refutados (NO están muertos)**: todas las clases `.tech-*` núcleo (`.tech-grid`, `.tech-item`, `.tech-icon`, `.tech-name`, `.tech-category`, `.tech-header`, `.tech-title`) están en uso en `src/routes/+page.svelte:124-206`. El par `.demo-card`/`.demo-credentials` es el caso inverso (markup sin CSS — I2).
- Remediación: borrar los selectores muertos salvo los `error-*` y `.btn-add-dentist` ligados a decisiones de I3/I6; estimación ~150 líneas de CSS eliminadas.

### C-2 · [P3 · cosmetic] Props y exports muertos (inventario completo, verificado por grep de cada export)

- `FormCard.svelte:15` — prop `cardClass` sin consumidor (detalle en I4). Único prop muerto de los 3 componentes.
- `formatters.js:82` — `generateAppointmentsCsv` está `export` pero solo lo consume `exportAppointmentsCsv` (`:97`) dentro del mismo archivo: sobreexportación (quitar `export`).
- `dashboardCharts.js:28` — `createBarChart` `export` pero solo lo llaman `createStatusChart` (`:170`) y `createDentistChart` (`:183`) del mismo módulo: idem.
- El resto de exports de `src/lib` está vivo y consumido desde rutas (verificado uno por uno: `apiFetch`, `getAuthHeaders`, `formatLocalDate`, `getStatusLabel`, `getStatusClass`, `fieldErrorFor`, `usefulErrorMessage`, `exportAppointmentsCsv`, `parseDashboardFilters`, `validateRegisterField`, `validateRegisterForm`, `categoryXAxis`, `loadUPlot`, `createMonthlyLineChart`, `createStatusChart`, `createDentistChart`).

### C-3 · [P3 · cosmetic] Duplicación de markup entre formularios alta/edición

- `appointments/add` (206 líneas) vs `appointments/edit/[id]` (195): **mismos 5 campos** (`name="patientId|dentistId|appointmentDate|appointmentTime|description"`, diff verificado) — ~90% del formulario duplicado, incluida la vista previa de paciente.
- `patients/add` (248) vs `patients/edit/[id]` (247): mismos campos salvo `password` ↔ `admissionDate`.
- `dentists/add` (139) vs `dentists/edit/[id]` (126): mismos campos salvo `password`.
- La solución por componentes compartidos ya existe a nivel contenedor (`FormCard` en los 8) pero no a nivel de campo. Cada par duplica también sus handlers de validación (`fieldErrorFor` repetido campo a campo).
- Remediación: no bloquea; si se toca, extraer componentes de campo (o snippets Svelte) por par alta/edición. Prioridad baja: es deuda estructural, no defecto visible.

### C-4 · [P2 · cosmetic] Componentes sobredimensionados (>300 líneas): 3 archivos

| Archivo | Líneas | Contenido mezclado |
| --- | --- | --- |
| `src/routes/dashboard/+page.svelte` | **540** | 4 tarjetas métricas + barra de filtros + 3 gráficos uPlot + lista de próximos turnos + dropdown de cambio de estado + export CSV. Candidatos claros: `MetricCard`, `UpcomingAppointments` (que además resolvería I6.2 y P-6 con un componente testeable) |
| `src/routes/users/register/+page.svelte` | **480** | 3 secciones de formulario + validación campo a campo; candidata la extracción de secciones «Datos personales/Domicilio/Contraseña» que `design.md` §7 ya nombra |
| `src/routes/+page.svelte` (landing) | **316** | hero + features + tech + demo + CTA en un archivo; las secciones son candidatas a subcomponentes o al menos a mover los estilos inline (I1) a CSS |

Resto de rutas ≤ 248 líneas. Los módulos de `src/lib` están bien troceados (max 184 líneas, con tests).

### C-5 · [P3 · cosmetic] Enlaces y clases sin destino (resumen cruzado)

- `href="#pacientes"` y `href="#odontologos"` (`+layout.svelte:64, 95`): sin target en ninguna página (grep verificado) — hallazgo funcional ya cubierto en P-2; aquí se registra como superficie muerta que se elimina con la misma remediation.
- `class="btn-add-patient"` emitido por `ListPageHeader.svelte:33` sin CSS definido (I6.3).
- `class="demo-credentials"` / `class="demo-card"` sin CSS (I2).

---

## Conteo por severidad

| Eje | P0 | P1 | P2 | P3 |
| --- | -- | -- | -- | -- |
| Identidad | 0 | 1 (I3) | 4 (I1, I2, I6, I8) | 2 (I4, I7) |
| Propósito | 0 | 1 (P-1) | 5 (P-2, P-3, P-5, P-6, P-7) | 1 (P-4) |
| Concisión | 0 | 0 | 1 (C-4) | 4 (C-1, C-2, C-3, C-5) |
| **Total** | **0** | **2** | **10** | **7** |

## Top-3 (entre los tres ejes)

1. **I3 + P-1 (P1, functional)**: no existe `+error.svelte` y el CTA principal «Demo Rápido» lleva exactamente al `error(403)` de `dashboard/+page.server.js:37-38` → el evaluador ve la página de error por defecto de SvelteKit en el momento peak-end de la landing. Remediar juntos: construir `+error.svelte` con el `error.css` ya importado y re-anclar el CTA.
2. **P-2 (P2, functional)**: la nav de roles muestra enlaces muertos (`#pacientes`, `#odontologos` sin target), expone «Listar pacientes» a `PATIENT` (termina en 403 de API, contrario al principio 2 de `design.md`) y oculta a `PATIENT` el listado de odontólogos que la matriz sí le concede.
3. **P-5 (P2, content)**: ~25 cadenas de usuario en castellano estándar violan el principio 6 (voseo) — única pasada de copy con tabla de conversión.

Mención honorífica: **I8** (system.md desincronizado) — barato de arreglar y de alto valor para la audiencia evaluadora.

---

## Lo que NO se verificó

- **Render en navegador**: sin Chrome/Chromium disponible (misma limitación que la Parte A), no se verificó visualmente la página de error por defecto de SvelteKit que hoy se renderiza, ni el comportamiento real de los anchors muertos en la barra de navegación colapsada (el análisis es de código: `href="#pacientes"` sin `id` destino es muerto por construcción).
- **Ejecución de las rutas por rol end-to-end**: la matriz de lo que cada rol *ve* se derivó de `+layout.svelte` + guards de `hooks.server.js` + loaders; no se levantaron servers para recorrer los flujos como `ADMIN`/`DENTIST`/`PATIENT` (auditoría de solo lectura).
- **Cobertura total de strings de usuario**: el grep de voseo cubrió formas verbales conocidas (`Ingrese|Ingresa|Accede|Crea|Repite|tienes|debes|Descubre|Seleccione|Elija`); puede haber cadenas no voseantes con otros verbos que el patrón no capturó. No es un inventario exhaustivo garantizado, sino una evidencia muestral suficiente del patrón sistémico.
- **Clases generadas 100% dinámicamente**: las clases Bootstrap de `formatters.js` (`bg-*`) se cubrieron; no existe ningún otro generador de nombres de clase en runtime (verificado por grep de interpolaciones de `class=`), por lo que el inventario de C-1 es completo salvo error humano de transcripción.
- **Contraste calculado solo para los pares nuevos** de este informe (`bg-warning`+blanco = 1.63:1, `bg-light`+texto = 14.63:1); los demás contrastes remiten a los cálculos de la Parte A.
- **`uPlot.min.css`** (vendor) y el contenido del bundle de Bootstrap CDN: fuera de política, igual que en la Parte A.
- **Peso real de la página** tras eliminar el CSS muerto de C-1: estimado (~150 líneas de las 66 KB fuente de `app.css`), no medido.

---

*Auditoría de solo lectura — Parte B (identidad / propósito / concisión). Sin cambios en código fuente. Remediación → T9.*
