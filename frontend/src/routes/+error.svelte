<script>
  import { page } from "$app/stores";

  // design.md §6.4: tarjeta central con título, explicación y salida clara
  /** @type {Record<number, string>} */
  const STATUS_TITLES = {
    403: "Acceso denegado",
    404: "Página no encontrada",
    500: "Error interno del servidor",
  };

  // Mensajes por defecto de SvelteKit en inglés: se sustituyen por texto propio
  // para que la vista nunca filtre texto interno o sin traducir (design.md §6.4).
  const KIT_DEFAULT_MESSAGES = new Set([
    "Not Found",
    "Forbidden",
    "Internal Server Error",
  ]);

  /** @type {Record<number, string>} */
  const FALLBACK_MESSAGES = {
    403: "No tenés permisos para acceder a este contenido.",
    404: "La página que buscás no existe o fue movida.",
  };

  const GENERIC_500_MESSAGE =
    "Ha ocurrido un error inesperado. Intentá nuevamente más tarde.";

  $: status = $page.status;
  $: title = STATUS_TITLES[status] || "Ha ocurrido un error";

  // Regla anti-fuga: la familia 500 muestra solo el texto genérico del handler;
  // los 4xx pueden mostrar el mensaje del error si no es el default de SvelteKit.
  $: message =
    status >= 500
      ? GENERIC_500_MESSAGE
      : $page.error?.message && !KIT_DEFAULT_MESSAGES.has($page.error.message)
        ? $page.error.message
        : (FALLBACK_MESSAGES[status] ?? GENERIC_500_MESSAGE);

  /** Vuelve atrás con historial; sin historial (o sin JS, vía href) cae al inicio. */
  function goBack(/** @type {MouseEvent} */ event) {
    event.preventDefault();
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.assign("/");
    }
  }
</script>

<svelte:head>
  <title>{title} | Dental Clinic</title>
</svelte:head>

<main class="main-content error-page">
  <div class="error-container">
    <div class="error-card">
      <div class="error-image">
        <img
          src="/assets/404Error.webp"
          alt=""
          class="error-img"
          loading="lazy"
        />
      </div>
      <h1 class="error-title">{title}</h1>
      <p class="error-message">{message}</p>
      <div class="error-actions">
        <a href="/" class="error-btn-primary">Volver al inicio</a>
        <a href="/" class="error-btn-secondary" on:click={goBack}>
          Volver atrás
        </a>
      </div>
      <div class="error-help">
        <p>
          Si el problema persiste, verificá tu sesión o volvé a intentarlo más
          tarde.
        </p>
      </div>
    </div>
  </div>
</main>
