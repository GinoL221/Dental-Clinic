<script>
  /** @type {string} */
  export let title;
  /** @type {string} */
  export let subtitle = "";
  /** @type {string | undefined} */
  export let error = undefined;
  /** @type {Record<string, string> | undefined} */
  export let fieldErrors = undefined;
  /** @type {string | undefined} */
  export let backHref = undefined;
  /** @type {string | undefined} */
  export let backLabel = undefined;
</script>

<main class="main-content auth-page">
  <div class="container-fluid">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2 class="auth-title">{title}</h2>
          {#if subtitle}
            <p class="auth-subtitle">{subtitle}</p>
          {/if}
        </div>

        {#if error || fieldErrors}
          <div class="alert alert-danger mb-3" role="alert">
            {#if error}
              <i class="bi bi-exclamation-triangle me-2"></i>
              {error}
            {/if}
            {#if fieldErrors}
              <ul class="form-field-errors">
                {#each Object.entries(fieldErrors) as [field, message] (field)}
                  <li>{message}</li>
                {/each}
              </ul>
            {/if}
          </div>
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
