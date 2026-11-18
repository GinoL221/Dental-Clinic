<script>
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import FormCard from "$lib/components/FormCard.svelte";

  export let form;

  let showPassword = false;
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

    <div class="mb-4">
      <label for="password" class="form-label">Contraseña</label>
      <div class="position-relative">
        <input
          type={showPassword ? "text" : "password"}
          class="form-control auth-input password-input"
          id="password"
          name="password"
          placeholder="********"
          autocomplete="current-password"
          enterkeyhint="done"
          required
        />
        <button
          type="button"
          class="btn-eye-toggle"
          on:click={() => (showPassword = !showPassword)}
          aria-label="Mostrar contraseña"
          aria-pressed={showPassword}
        >
          <i
            class={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}
            aria-hidden="true"
          ></i>
        </button>
      </div>
    </div>

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
