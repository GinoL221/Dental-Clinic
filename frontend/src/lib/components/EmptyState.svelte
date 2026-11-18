<script>
  /** @type {string} */
  export let title = "No se encontraron resultados";
  /** @type {string} */
  export let message = "Modificá tu búsqueda o agregá un nuevo registro.";
  /** @type {string} */
  export let icon = "bi-inbox";
  /** @type {2 | 3 | 4 | 5 | 6} */
  export let level = 2;
</script>

<div class="text-center py-5">
  <i class="bi {icon} empty-state-icon" aria-hidden="true"></i>
  <svelte:element this={`h${level}`} class="empty-state-title mt-3"
    >{title}</svelte:element
  >
  <p class="empty-state-message">{message}</p>
</div>

<style>
  .empty-state-icon {
    color: var(--color-texto-muted);
  }

  .empty-state-title {
    color: var(--color-texto);
    font-size: 1.25rem;
    font-weight: 600;
  }

  .empty-state-message {
    color: var(--color-texto-muted);
    margin-bottom: 0;
  }
</style>
