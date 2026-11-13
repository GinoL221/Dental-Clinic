<script>
  /** @type {string} */
  export let title = "No se encontraron resultados";
  /** @type {string} */
  export let message = "Modificá tu búsqueda o agregá un nuevo registro.";
  /** @type {string} */
  export let icon = "bi-inbox";
</script>

<div class="text-center py-5">
  <i class="bi {icon} text-muted" style="font-size: 3rem"></i>
  <h5 class="text-muted mt-3">{title}</h5>
  <p class="text-muted">{message}</p>
</div>
