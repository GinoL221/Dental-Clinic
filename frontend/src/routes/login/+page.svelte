<script>
  import { enhance } from "$app/forms";
  import { onMount } from "svelte";
  import FormCard from "$lib/components/FormCard.svelte";

  export let form;

  onMount(() => {
    const authCard = /** @type {HTMLElement | null} */ (
      document.querySelector(".auth-card")
    );
    if (authCard) {
      authCard.style.opacity = "0";
      authCard.style.transform = "translateY(50px)";
      setTimeout(() => {
        authCard.style.transition = "all 0.6s ease-out";
        authCard.style.opacity = "1";
        authCard.style.transform = "translateY(0)";
      }, 100);
    }
  });
</script>

<svelte:head>
  <title>Iniciar Sesión | Clínica Odontológica</title>
</svelte:head>

<FormCard
  title="Iniciar Sesión"
  subtitle="Accede a tu cuenta de la clínica"
  error={form?.errors?.general?.msg}
>
  <form id="loginForm" class="auth-form" method="POST" use:enhance>
    <div class="mb-3">
      <label for="email" class="form-label">Correo electrónico</label>
      <input
        type="email"
        class="form-control auth-input"
        id="email"
        name="email"
        placeholder="ejemplo@correo.com"
        value={form?.oldData?.email || ""}
        required
      />
    </div>

    <div class="mb-4">
      <label for="password" class="form-label">Contraseña</label>
      <input
        type="password"
        class="form-control auth-input"
        id="password"
        name="password"
        placeholder="********"
        required
      />
    </div>

    <button type="submit" class="btn auth-btn-primary w-100 mb-3">
      Ingresar
    </button>

    <div class="auth-footer">
      <p>
        ¿No tienes una cuenta?
        <a href="/users/register" class="auth-link">Regístrate aquí</a>
      </p>
    </div>
  </form>
</FormCard>
