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
  /** @type {boolean} */
  export let wide = false;
  /** @type {string} */
  export let titleIcon = "";
  /** @type {HTMLElement | null} */
  export let errorBannerEl = null;
</script>

<div class="main-content auth-page">
  <div class="container-fluid">
    <div class="auth-container">
      <div class="auth-card" class:auth-card--wide={wide}>
        <div class="auth-header">
          <h1 class="auth-title">
            {#if titleIcon}
              <i class="{titleIcon} me-2" aria-hidden="true"></i>
            {/if}{title}
          </h1>
          <div class="auth-title-rule" aria-hidden="true"></div>
          {#if subtitle}
            <p class="auth-subtitle">{subtitle}</p>
          {/if}
        </div>

        {#if error || fieldErrors}
          <div
            class="alert alert-danger mb-3"
            role="alert"
            tabindex="-1"
            bind:this={errorBannerEl}
          >
            {#if error}
              <i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
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

        {#if $$slots.footer || (backHref && backLabel)}
          <div class="auth-footer">
            <slot name="footer">
              {#if backHref && backLabel}
                <p>
                  <a href={backHref} class="auth-link">← {backLabel}</a>
                </p>
              {/if}
            </slot>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
