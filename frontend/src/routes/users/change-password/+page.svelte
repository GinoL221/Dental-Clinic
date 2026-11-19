<script>
  import { enhance } from "$app/forms";
  import FormCard from "$lib/components/FormCard.svelte";
  import PasswordField from "$lib/components/PasswordField.svelte";
  import { createSubmitEnhance } from "$lib/utils/formEnhance.js";

  /** @type {import('./$types').PageData} */
  export let data;

  /** @type {import('./$types').ActionData} */
  export let form;

  let submitting = false;
  const handleEnhance = createSubmitEnhance((v) => (submitting = v));
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
    <PasswordField
      id="currentPassword"
      name="currentPassword"
      label="Contraseña actual o temporal"
      autocomplete="current-password"
      toggleLabel="Mostrar contraseña actual"
      required
    />

    <PasswordField
      id="newPassword"
      name="newPassword"
      label="Nueva contraseña"
      minlength={6}
      autocomplete="new-password"
      toggleLabel="Mostrar nueva contraseña"
      helpId="newPassword-help"
      helpText="Mínimo 6 caracteres."
      required
    />

    <PasswordField
      id="confirmPassword"
      name="confirmPassword"
      label="Confirmar nueva contraseña"
      minlength={6}
      autocomplete="new-password"
      toggleLabel="Mostrar confirmación de contraseña"
      wrapperClass="mb-4"
      required
    />

    <button
      type="submit"
      class="btn auth-btn-primary w-100"
      disabled={submitting}
    >
      {submitting ? "Guardando..." : "Guardar nueva contraseña"}
    </button>
  </form>
</FormCard>
