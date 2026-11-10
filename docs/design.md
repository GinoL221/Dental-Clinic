# Diseño frontend — Dental Clinic

Documento vivo de diseño. Define **cómo debe verse y comportarse la interfaz** y es la guía para las pantallas de [`docs/product.md`](product.md). Los valores concretos de color, tipografía y componentes viven en [`design/system.md`](../design/system.md) (sincronizado desde `frontend/static/css/**`); este documento decide **qué se conserva, qué se corrige y cómo se usa**.

Dirección acordada: **evolucionar la marca actual**. Se conservan el azul `#4a90e2` y la menta `#a4e2c2`; se ordenan los tokens, se eliminan los hex sueltos y los gradientes con `!important`, y se corrigen los contrastes que hoy fallan.

Artboards de referencia: `design/frontend-key-screens/` (landing, acceso, dashboard, lista de turnos, formulario de turno).

## 1. Principios

1. **El trabajo primero.** La clínica usa el sistema para resolver tareas (agendar, cambiar un estado, buscar un paciente). Cada pantalla tiene una acción principal visible y una sola.
2. **La interfaz refleja lo que el rol puede hacer.** Un control que terminaría en `403` no se muestra (brecha G3 de `product.md`). El backend sigue siendo la autoridad.
3. **El color nunca es el único mensaje.** Estados y errores llevan texto o ícono con nombre accesible además del color.
4. **Accesible por defecto.** Contraste AA, foco visible, objetivos táctiles de 44 px, `prefers-reduced-motion` respetado.
5. **Mobile cuenta.** Toda tabla tiene una versión de tarjetas; todo formulario se completa con una mano.
6. **Español claro y tuteo rioplatense neutro en mensajes** («Ingresá», «Elegí»), sin jerga técnica en la interfaz.

## 2. Tokens objetivo

Se mantienen los cinco tokens existentes y se agregan los siguientes. Los valores marcados «hoy» ya existen en el CSS sin token; los marcados «nuevo» son propuestas con su contraste medido.

| Token                   | Valor                       | Origen | Uso                                                               |
| ----------------------- | --------------------------- | ------ | ----------------------------------------------------------------- |
| `--color-primario`      | `#4a90e2`                   | hoy    | Fondos, bordes, thead, íconos. **No** para texto normal (3,29:1). |
| `--color-primario-dark` | `#2b6cb0`                   | nuevo  | Texto, enlaces y marca sobre blanco (5,42:1).                     |
| `--color-secundario`    | `#a4e2c2`                   | hoy    | Fondos de éxito y acentos. Nunca texto (1,48:1).                  |
| `--color-acento`        | `#b3ddf2`                   | hoy    | Hover de filas, aviso de privacidad, fondos suaves.               |
| `--color-fondo-claro`   | `#f5f5f5`                   | hoy    | Fondo de filtros y estados vacíos.                                |
| `--color-blanco`        | `#ffffff`                   | hoy    | Superficies.                                                      |
| `--color-texto`         | `#212529`                   | nuevo  | Texto de cuerpo (color de cuerpo de Bootstrap, ya heredado).      |
| `--color-texto-muted`   | `#6c757d`                   | hoy    | Texto secundario (4,69:1).                                        |
| `--color-borde-suave`   | `#e9ecef`                   | hoy    | Bordes de inputs y separadores.                                   |
| `--color-peligro`       | `#dc3545`                   | hoy    | Eliminar, errores de campo (4,53:1).                              |
| `--color-peligro-hover` | `#c82333`                   | hoy    | Hover de peligro y estado «Cancelada» (5,61:1).                   |
| `--color-info-dark`     | `#0e7490`                   | nuevo  | Editar y estado «En curso» con texto blanco (5,36:1).             |
| `--color-exito-texto`   | `#1b4332`                   | nuevo  | Texto sobre menta (7,51:1); `#2d6a4f` mide 4,33:1 y no alcanza.   |
| `--gradient-primary`    | `135deg, primario → acento` | hoy    | Botón primario, definido una vez como token, sin `!important`.    |

**Reglas de uso del color**

- Texto y enlaces sobre blanco: `--color-primario-dark`, no `--color-primario`.
- Hover de enlaces de navegación: subrayado y `--color-primario-dark`; el hover actual en menta (1,48:1) se retira.
- El botón primario lleva texto blanco sobre el azul sólido `--color-primario-dark`; el gradiente queda para superficies decorativas (hero, CTA), donde no hay texto pequeño encima.
- Cada estado de turno combina color y etiqueta de texto.

## 3. Tipografía

- Pila: `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` (sin fuentes remotas).
- Escala (rem): `0.85` etiquetas y errores · `0.9` navegación y pie · `1` cuerpo · `1.2` subtítulos · `1.5` marca y títulos de tarjeta · `2` títulos de página y autenticación · `2.5` títulos de sección · `3.5` título del hero.
- Pesos: 400 cuerpo, 500 navegación, 600 botones, etiquetas y encabezados de tabla, 700 títulos.
- Texto de cuerpo nunca por debajo de `0.875rem` (14 px); interlineado base `1.5`.

## 4. Forma y elevación

- Radios: `5px` botones de acción en tabla · `8px` botones, alertas, tablas · `10px` tarjetas e inputs · `20px` tarjetas de acceso y error · `50px` insignias.
- Sombras en cuatro niveles: plana `0 2px 4px`, tarjeta `0 4px 6px`, menú `0 10px 30px`, acceso `0 20px 40px` (todas con negro al 10 %).
- Movimiento: elevación de `-2px` en hover de botones y transición de `0.2s`; todo se desactiva con `prefers-reduced-motion`.

## 5. Estructura y navegación

### 5.1 Barra superior

Sticky, fondo blanco al 95 % con desenfoque, borde inferior azul al 20 %. Marca a la izquierda, navegación al centro, usuario a la derecha.

| Estado    | Contenido                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------- |
| Visitante | «Ingresar» (outline) y «Registrarse» (primario).                                                  |
| `ADMIN`   | Dashboard · Pacientes · Odontólogos · Turnos, cada grupo con «Listar» y «Agregar».                |
| `DENTIST` | Pacientes (listar) · Odontólogos (listar) · Turnos (listar y programar).                          |
| `PATIENT` | Turnos (listar y programar) · «Mi perfil» (propuesto, ver decisiones pendientes de `product.md`). |

Reglas: un solo enlace por destino; el ítem activo lleva `aria-current="page"` y subrayado; en móvil la navegación colapsa en un menú con botón de 44 px. Los enlaces ancla `#pacientes` y `#odontologos` que hoy ven los roles sin permiso de alta se eliminan.

### 5.2 Pie

Fondo `--color-primario`, texto blanco, logotipo en blanco. Altura mínima, siempre al fondo del viewport.

### 5.3 Contenedor de página

Ancho máximo de contenido `1140px`, título de página (`h1`) con borde inferior de 3 px en `--color-primario`, acción principal alineada a la derecha del título.

## 6. Patrones de componentes

### 6.1 Listados (pacientes, odontólogos, turnos)

- Encabezado: título, contador de resultados y acción principal («Agregar …») **solo** si el rol puede crear.
- Búsqueda: campo único arriba a la izquierda, filtra en vivo, con `label` visible o `aria-label`, botón de limpiar.
- Tabla en escritorio con `thead` azul y filas con hover `--color-acento`. En menos de `768px` cada fila es una tarjeta clave-valor con `data-label` y una fila de acciones de 44 px.
- Acciones por fila: «Editar» y «Eliminar» con **texto o `aria-label` que nombra el registro** («Editar turno de Juan Pérez»). «Eliminar» exige confirmación en un diálogo propio, no `confirm()` del navegador.
- Estados: cargando (esqueleto de filas), vacío (mensaje y acción para crear, o «Sin resultados para …» si hay búsqueda) y error (alerta con reintento).

### 6.2 Formularios (alta y edición)

- Una columna en móvil, dos en escritorio para pares naturales (nombre/apellido, calle/número).
- `label` siempre visible sobre el campo; ayuda breve debajo cuando haga falta; no se usa el placeholder como etiqueta.
- Validación al salir del campo y al enviar. Error: borde `--color-peligro`, fondo `#fff5f5`, mensaje debajo enlazado con `aria-describedby`, `aria-invalid="true"`, y foco al primer error.
- Botón primario a la derecha («Guardar»), secundario «Cancelar» a su izquierda; el primario muestra estado de envío y se deshabilita para evitar doble envío.
- Los campos que el rol no puede cambiar (email y DNI del paciente, email y matrícula del odontólogo) se muestran deshabilitados con una nota, no se ocultan.

### 6.3 Estados de turno

| Estado        | Etiqueta   | Fondo                   | Texto  | Contraste |
| ------------- | ---------- | ----------------------- | ------ | --------- |
| `SCHEDULED`   | Programada | `#6c757d`               | blanco | 4,69:1    |
| `IN_PROGRESS` | En curso   | `--color-info-dark`     | blanco | 5,36:1    |
| `COMPLETED`   | Completada | `#2d6a4f`               | blanco | 6,39:1    |
| `CANCELLED`   | Cancelada  | `--color-peligro-hover` | blanco | 5,61:1    |

El cambio de estado ofrece solo las transiciones válidas (`SCHEDULED → IN_PROGRESS | COMPLETED | CANCELLED`, `IN_PROGRESS → COMPLETED | CANCELLED`); los estados terminales no muestran selector.

### 6.4 Feedback

- Éxito y error de acciones: alerta `role="status"` o `role="alert"` bajo el título de página, que se descarta sola a los 6 s solo si es de éxito.
- Errores del backend se muestran con su mensaje en español (por ejemplo «El odontólogo ya tiene un turno en esa fecha y hora»), nunca con un 500 genérico.
- Páginas 403 y 404: tarjeta central con título, explicación y salida clara («Volver al inicio»).

### 6.5 Gráficos del dashboard

uPlot con las series en `--color-primario`, `--color-secundario` y `--color-acento` más un neutro; cada gráfico tiene título, resumen textual equivalente y estado vacío (`--color-fondo-claro`). Las etiquetas de eje de categoría no se duplican.

## 7. Pantallas

Cada pantalla indica su acción principal, su contenido y sus estados. Los permisos están en `product.md` §3.

| Ruta                      | Acción principal                 | Contenido y decisiones de diseño                                                                                                                                             |
| ------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                       | Ingresar o registrarse           | Hero con mensaje claro y dos CTA; tres características; sección de tecnología secundaria. Las credenciales de demo se muestran solo si coinciden con el seed (brecha G1).    |
| `/login`                  | Ingresar                         | Tarjeta central de acceso, email y contraseña con botón mostrar/ocultar, error de credenciales en alerta, enlace a registro.                                                 |
| `/users/register`         | Crear cuenta de paciente         | Secciones «Datos personales», «Domicilio» y «Contraseña»; verificación de email disponible; confirmación de contraseña; aviso de privacidad.                                 |
| `/dashboard`              | Revisar y actuar sobre la agenda | Barra de filtros (fechas y odontólogo) → cuatro tarjetas de métricas → tres gráficos → próximos turnos con cambio rápido de estado y «Editar» con nombre accesible.          |
| `/patients`               | Buscar un paciente               | Listado según §6.1; DNI, nombre, email y fecha de admisión. «Agregar» y «Eliminar» solo para `ADMIN`.                                                                        |
| `/patients/add`           | Guardar paciente                 | Formulario según §6.2 con domicilio; contraseña opcional con aviso de la regla por defecto.                                                                                  |
| `/patients/edit/[id]`     | Guardar cambios                  | Datos precargados; email y DNI deshabilitados para `PATIENT`.                                                                                                                |
| `/dentists`               | Buscar un odontólogo             | Listado según §6.1; matrícula, nombre y email. Especialidades como columna cuando exista la gestión (decisión pendiente).                                                    |
| `/dentists/add`           | Guardar odontólogo               | Formulario con matrícula, nombre, apellido y email.                                                                                                                          |
| `/dentists/edit/[id]`     | Guardar cambios                  | Datos precargados; email y matrícula deshabilitados para `DENTIST`.                                                                                                          |
| `/appointments`           | Encontrar o programar un turno   | Listado según §6.1 con insignia de estado, fecha y hora; el rol `PATIENT` ve solo «Programar turno» y sus turnos, sin «Editar».                                              |
| `/appointments/add`       | Programar turno                  | Odontólogo, fecha, hora (franja 08:00–18:00, lunes a viernes) y descripción; `ADMIN` y `DENTIST` eligen paciente con vista previa; `PATIENT` no ve ese selector (brecha G2). |
| `/appointments/edit/[id]` | Guardar cambios                  | Mismos campos precargados; `DENTIST` no puede reasignar odontólogo; selector de estado con transiciones válidas.                                                             |
| `/users/logout`           | —                                | Acción POST sin pantalla; confirma con mensaje en la landing.                                                                                                                |

## 8. Accesibilidad

Lista de verificación mínima para cada pantalla antes de darla por terminada:

- [ ] Un solo `h1`; jerarquía de encabezados sin saltos; landmarks `header`, `nav`, `main`, `footer`.
- [ ] Todo texto cumple AA (4,5:1 normal, 3:1 grande); ningún texto sobre `--color-secundario` ni `--color-acento` salvo `--color-exito-texto` y `#2c5d8f`.
- [ ] Todo control tiene nombre accesible; los íconos solos llevan `aria-label` y `aria-hidden` en el ícono.
- [ ] Foco visible de 3 px en todo elemento interactivo; orden de tabulación lógico.
- [ ] Objetivos táctiles de al menos 44×44 px.
- [ ] Errores asociados a su campo; el estado no depende solo del color.
- [ ] Tablas con `scope` en encabezados y, en móvil, etiquetas visibles por celda.
- [ ] Movimiento reducido respetado.

## 9. Responsive

| Ancho       | Comportamiento                                                                               |
| ----------- | -------------------------------------------------------------------------------------------- |
| `≥ 992px`   | Navegación completa, tablas, dashboard en cuadrícula de tarjetas y gráficos en dos columnas. |
| `768–991px` | Tablas con scroll horizontal contenido; gráficos en una columna.                             |
| `< 768px`   | Navegación colapsada, tablas como tarjetas, filtros apilados, acciones a ancho completo.     |
| `< 576px`   | Tarjetas de acceso con `max-width: calc(100vw - 2rem)`; paddings reducidos.                  |

## 10. Migración sugerida (fuera de este cambio)

Este documento no modifica el código. Cuando se encare la implementación, un orden razonable en cambios chicos y revisables:

1. Tokens nuevos en `tokens.css`, sustitución de hex sueltos y retiro de `!important` en gradientes.
2. Contraste: primario de texto, hover de navegación, botones de edición, insignias.
3. Navegación y listados por rol (G3, G4) y corrección del flujo de turno para `PATIENT` (G2).
4. Nombres accesibles en acciones (G7) y diálogo de confirmación propio.
5. Estados de carga, vacío y error en listados y dashboard.

## 11. Pendiente de decidir

- ¿Se conserva Bootstrap por CDN o se vendorea y se reduce a lo usado?
- ¿Modo oscuro? Hoy no existe y no se diseña aquí.
- ¿Logotipo y paleta definitivos? El logotipo actual es `/assets/Logotipo.webp`.
