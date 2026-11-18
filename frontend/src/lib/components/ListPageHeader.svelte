<script>
  /** @type {string} */
  export let title;
  /** @type {string} */
  export let searchQuery = "";
  /** @type {string} */
  export let searchLabel = "Buscar";
  /** @type {string} */
  export let searchPlaceholder = "Buscar...";
  /** @type {string} */
  export let searchId = "list-search-input";
  /** @type {number | undefined} */
  export let resultCount = undefined;
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

<div class="patient-list-header">
  <h1>{title}</h1>
  {#if canAdd && addHref && addLabel}
    <a href={addHref} class="btn btn-add-primary">
      <i class="bi bi-plus-circle me-2" aria-hidden="true"></i>{addLabel}
    </a>
  {/if}
</div>
<div class="list-title-rule" aria-hidden="true"></div>

<search class="list-search-bar">
  <div class="list-search-field">
    <label for={searchId} class="list-search-label">{searchLabel}</label>
    <input
      id={searchId}
      type="search"
      bind:value={searchQuery}
      class="form-control list-search-input"
      placeholder={searchPlaceholder}
      autocorrect="off"
      autocapitalize="none"
      spellcheck="false"
    />
  </div>
  <button
    type="button"
    on:click={clearSearch}
    class="btn btn-outline-primary list-clear-btn"
    title="Limpiar búsqueda"
    aria-label="Limpiar búsqueda"
  >
    <i class="bi bi-x-circle" aria-hidden="true"></i>
  </button>
  {#if resultCount !== undefined}
    <p class="result-count" role="status">
      {resultCount}
      {resultCount === 1 ? "resultado" : "resultados"}
    </p>
  {/if}
</search>
