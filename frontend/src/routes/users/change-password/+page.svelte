<script>
  import { enhance } from "$app/forms";
  import FormCard from "$lib/components/FormCard.svelte";

  /** @type {import('./$types').PageData} */
  export let data;

  /** @type {import('./$types').ActionData} */
  export let form;
</script>

<svelte:head>
  <title>Cambiar Contraseña | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Actualizar Contraseña"
  subtitle={data.user?.mustChangePassword
    ? "Por seguridad, debes cambiar tu contraseña temporal antes de continuar."
    : "Establece una nueva contraseña para tu cuenta."}
  error={form?.error}
  backHref={data.user?.mustChangePassword ? undefined : "/"}
  backLabel={data.user?.mustChangePassword ? undefined : "Volver al inicio"}
>
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
</FormCard>
