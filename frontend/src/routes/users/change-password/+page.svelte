<script>
  import { enhance } from "$app/forms";

  /** @type {import('./$types').PageData} */
  export let data;

  /** @type {import('./$types').ActionData} */
  export let form;
</script>

<svelte:head>
  <title>Cambiar Contraseña | Dental Clinic</title>
</svelte:head>

<main class="main-content auth-page">
  <div class="container-fluid">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2 class="auth-title">Actualizar Contraseña</h2>
          <p class="auth-subtitle">
            {#if data.user?.mustChangePassword}
              Por seguridad, debes cambiar tu contraseña temporal antes de
              continuar.
            {:else}
              Establece una nueva contraseña para tu cuenta.
            {/if}
          </p>
        </div>

        {#if form?.error}
          <div class="alert alert-danger mb-3" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            {form.error}
          </div>
        {/if}

        <form method="POST" class="auth-form" use:enhance>
          <div class="mb-3">
            <label for="currentPassword" class="form-label"
              >Contraseña actual o temporal</label
            >
            <input
              type="password"
              class="form-control auth-input"
              id="currentPassword"
              name="currentPassword"
              required
              autocomplete="current-password"
            />
          </div>

          <div class="mb-3">
            <label for="newPassword" class="form-label">Nueva contraseña</label>
            <input
              type="password"
              class="form-control auth-input"
              id="newPassword"
              name="newPassword"
              minlength="6"
              required
              autocomplete="new-password"
            />
            <div class="form-text text-muted">Mínimo 6 caracteres.</div>
          </div>

          <div class="mb-4">
            <label for="confirmPassword" class="form-label"
              >Confirmar nueva contraseña</label
            >
            <input
              type="password"
              class="form-control auth-input"
              id="confirmPassword"
              name="confirmPassword"
              minlength="6"
              required
              autocomplete="new-password"
            />
          </div>

          <button type="submit" class="btn btn-primary w-100 py-2">
            Guardar nueva contraseña
          </button>
        </form>
      </div>
    </div>
  </div>
</main>
