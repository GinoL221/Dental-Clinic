<script>
  /** @type {string} */
  export let title;
  /** @type {string} */
  export let subtitle = "";
  /** @type {string | undefined} */
  export let error = undefined;
  /** @type {string | undefined} */
  export let backHref = undefined;
  /** @type {string | undefined} */
  export let backLabel = undefined;
  /** @type {string} */
  export let cardClass = "";
</script>

<main class="main-content auth-page">
  <div class="container-fluid">
    <div class="auth-container">
      <div class="auth-card {cardClass}">
        <div class="auth-header">
          <h2 class="auth-title">{title}</h2>
          {#if subtitle}
            <p class="auth-subtitle">{subtitle}</p>
          {/if}
        </div>

        {#if error}
          <div class="alert alert-danger mb-3">{error}</div>
        {/if}

        <slot />

        {#if backHref && backLabel}
          <div class="auth-footer">
            <p>
              <a href={backHref} class="auth-link">← {backLabel}</a>
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</main>
