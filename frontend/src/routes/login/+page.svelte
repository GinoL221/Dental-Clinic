<script>
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import FormCard from "$lib/components/FormCard.svelte";
  import PasswordField from "$lib/components/PasswordField.svelte";
  import { createSubmitEnhance } from "$lib/utils/formEnhance.js";

  export let form;

  let submitting = false;
  const handleEnhance = createSubmitEnhance((v) => (submitting = v));
</script>

<svelte:head>
  <title>Iniciar Sesión | Clínica Odontológica</title>
</svelte:head>

<FormCard
  title="Iniciar Sesión"
  subtitle="Ingresá a tu cuenta de la clínica"
  error={form?.errors?.general?.msg}
>
  {#if $page.url.searchParams.get("registered") === "true" && !form?.errors?.general?.msg}
    <div class="alert alert-success mb-3" role="status">
      <i class="bi bi-check-circle me-2" aria-hidden="true"></i>
      Cuenta creada correctamente. Ya podés iniciar sesión.
    </div>
  {/if}

  <form
    id="loginForm"
    class="auth-form"
    method="POST"
    use:enhance={handleEnhance}
  >
    <div class="mb-3">
      <label for="email" class="form-label">Correo electrónico</label>
      <input
        type="email"
        class="form-control auth-input"
        id="email"
        name="email"
        placeholder="ejemplo@correo.com"
        autocomplete="username"
        spellcheck="false"
        enterkeyhint="next"
        value={form?.oldData?.email || ""}
        required
      />
    </div>

    <PasswordField
      id="password"
      name="password"
      label="Contraseña"
      placeholder="********"
      autocomplete="current-password"
      enterkeyhint="done"
      required
      wrapperClass="mb-4"
    />

    <button
      type="submit"
      class="btn auth-btn-primary w-100 mb-3"
      disabled={submitting}
    >
      {submitting ? "Ingresando..." : "Ingresar"}
    </button>

    <div class="auth-footer">
      <p>
        ¿No tenés una cuenta?
        <a href="/users/register" class="auth-link">Registrate aquí</a>
      </p>
    </div>
  </form>
</FormCard>
