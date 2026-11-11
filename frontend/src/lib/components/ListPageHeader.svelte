<script>
  /** @type {string} */
  export let title;
  /** @type {string} */
  export let searchQuery = "";
  /** @type {string} */
  export let searchPlaceholder = "Buscar...";
  /** @type {string | undefined} */
  export let addHref = undefined;
  /** @type {string | undefined} */
  export let addLabel = undefined;
  /** @type {boolean} */
  export let canAdd = false;

  function clearSearch() {
    searchQuery = "";
  }
</script>

<div
  class="patient-list-header d-flex justify-content-between align-items-center mb-4"
>
  <h1 class="patient-list-title">{title}</h1>
  <div class="d-flex gap-2">
    <input
      type="text"
      bind:value={searchQuery}
      class="form-control list-search-input"
      placeholder={searchPlaceholder}
    />
    <button
      on:click={clearSearch}
      class="btn btn-outline-secondary"
      title="Limpiar búsqueda"
    >
      <i class="bi bi-x-circle"></i>
    </button>
    {#if canAdd && addHref && addLabel}
      <a href={addHref} class="btn btn-add-patient">
        <i class="bi bi-plus-circle me-2"></i>{addLabel}
      </a>
    {/if}
  </div>
</div>
