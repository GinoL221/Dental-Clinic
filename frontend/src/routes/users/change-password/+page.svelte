<script>
  import { enhance } from "$app/forms";
  import FormCard from "$lib/components/FormCard.svelte";

  /** @type {import('./$types').PageData} */
  export let data;

  /** @type {import('./$types').ActionData} */
  export let form;

  let showCurrentPassword = false;
  let showNewPassword = false;
  let showConfirmPassword = false;
  let submitting = false;

  /** @type {import('@sveltejs/kit').SubmitFunction} */
  function handleEnhance() {
    submitting = true;
    return async ({ update }) => {
      try {
        await update();
      } finally {
        submitting = false;
      }
    };
  }
</script>

<svelte:head>
  <title>Cambiar Contraseña | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Actualizar Contraseña"
  subtitle={data.user?.mustChangePassword
    ? "Por seguridad, tenés que cambiar tu contraseña temporal antes de continuar."
    : "Establecé una nueva contraseña para tu cuenta."}
  error={form?.error}
  backHref={data.user?.mustChangePassword ? undefined : "/"}
  backLabel={data.user?.mustChangePassword ? undefined : "Volver al inicio"}
>
  {#if data.user?.mustChangePassword}
    <div class="privacy-notice auth-notice mb-3" role="status">
      <i class="bi bi-shield-exclamation" aria-hidden="true"></i>
      <div>
        <strong>Cambio obligatorio:</strong> por seguridad debés actualizar tu contraseña
        temporal antes de navegar por el sistema.
      </div>
    </div>
  {/if}

  <form method="POST" class="auth-form" use:enhance={handleEnhance}>
    <div class="mb-3">
      <label for="currentPassword" class="form-label"
        >Contraseña actual o temporal</label
      >
      <div class="position-relative">
        <input
          type={showCurrentPassword ? "text" : "password"}
          class="form-control auth-input password-input"
          id="currentPassword"
          name="currentPassword"
          required
          autocomplete="current-password"
        />
        <button
          type="button"
          class="btn-eye-toggle"
          on:click={() => (showCurrentPassword = !showCurrentPassword)}
          aria-label="Mostrar contraseña actual"
          aria-pressed={showCurrentPassword}
        >
          <i
            class={showCurrentPassword ? "bi bi-eye-slash" : "bi bi-eye"}
            aria-hidden="true"
          ></i>
        </button>
      </div>
    </div>

    <div class="mb-3">
      <label for="newPassword" class="form-label">Nueva contraseña</label>
      <div class="position-relative">
        <input
          type={showNewPassword ? "text" : "password"}
          class="form-control auth-input password-input"
          id="newPassword"
          name="newPassword"
          minlength="6"
          aria-describedby="newPassword-help"
          required
          autocomplete="new-password"
        />
        <button
          type="button"
          class="btn-eye-toggle"
          on:click={() => (showNewPassword = !showNewPassword)}
          aria-label="Mostrar nueva contraseña"
          aria-pressed={showNewPassword}
        >
          <i
            class={showNewPassword ? "bi bi-eye-slash" : "bi bi-eye"}
            aria-hidden="true"
          ></i>
        </button>
      </div>
      <div class="auth-help-text" id="newPassword-help">
        Mínimo 6 caracteres.
      </div>
    </div>

    <div class="mb-4">
      <label for="confirmPassword" class="form-label"
        >Confirmar nueva contraseña</label
      >
      <div class="position-relative">
        <input
          type={showConfirmPassword ? "text" : "password"}
          class="form-control auth-input password-input"
          id="confirmPassword"
          name="confirmPassword"
          minlength="6"
          required
          autocomplete="new-password"
        />
        <button
          type="button"
          class="btn-eye-toggle"
          on:click={() => (showConfirmPassword = !showConfirmPassword)}
          aria-label="Mostrar confirmación de contraseña"
          aria-pressed={showConfirmPassword}
        >
          <i
            class={showConfirmPassword ? "bi bi-eye-slash" : "bi bi-eye"}
            aria-hidden="true"
          ></i>
        </button>
      </div>
    </div>

    <button
      type="submit"
      class="btn auth-btn-primary w-100"
      disabled={submitting}
    >
      {submitting ? "Guardando..." : "Guardar nueva contraseña"}
    </button>
  </form>
</FormCard>
