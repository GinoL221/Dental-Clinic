<script>
  import { onDestroy } from "svelte";
  import { enhance } from "$app/forms";
  import FormCard from "$lib/components/FormCard.svelte";
  import PasswordField from "$lib/components/PasswordField.svelte";
  import { createSubmitEnhance } from "$lib/utils/formEnhance.js";
  import { fieldErrorFor } from "$lib/utils/formatters.js";

  /** @type {import('./$types').ActionData} */
  export let form;

  let isSubmitting = false;
  const handleEnhance = createSubmitEnhance((v) => (isSubmitting = v));

  /** @type {"copied" | "failed" | null} */
  let copyState = null;
  let copyMessage = "";
  let lastCopyMessage = "";
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let copyTimer;
  /** @type {HTMLElement | null} */
  let passwordCodeEl = null;

  $: createdForm = form && "created" in form && form.created ? form : null;
  $: errorForm = form && "success" in form && !form.success ? form : null;
  $: fieldErrors = errorForm?.fieldErrors;

  /** @param {boolean} ok */
  function reportCopy(ok) {
    clearTimeout(copyTimer);
    copyState = null;
    copyMessage = "";

    let message = ok ? "Copiada" : "No se pudo copiar";
    if (message === lastCopyMessage) {
      message += "\u00A0";
    }
    lastCopyMessage = message;

    requestAnimationFrame(() => {
      copyState = ok ? "copied" : "failed";
      copyMessage = message;
    });

    copyTimer = setTimeout(() => {
      copyState = null;
      copyMessage = "";
    }, 2000);
  }

  async function handleCopyPassword() {
    const text =
      passwordCodeEl?.innerText.trim() || createdForm?.temporaryPassword || "";
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      reportCopy(true);
    } catch {
      reportCopy(false);
    }
  }

  onDestroy(() => {
    clearTimeout(copyTimer);
  });
</script>

<svelte:head>
  <title>Agregar Odontólogo | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Agregar Odontólogo"
  subtitle="Registrá un nuevo profesional en la clínica"
  error={errorForm?.error}
  fieldErrors={errorForm?.fieldErrors}
  backHref="/dentists"
  backLabel="Volver a la lista de odontólogos"
>
  {#if createdForm}
    <div class="temp-password-panel" role="status">
      <div class="alert alert-success mb-3">
        <i class="bi bi-check-circle me-2" aria-hidden="true"></i>
        Odontólogo <strong>{createdForm.createdName}</strong>
        ({createdForm.createdEmail}) registrado correctamente.
      </div>

      <p class="temp-password-notice">
        Esta contraseña temporal se muestra una sola vez. El profesional deberá
        cambiarla al iniciar sesión por primera vez.
      </p>

      <div class="temp-password-row">
        <code id="temporary-password-value" bind:this={passwordCodeEl}
          >{createdForm.temporaryPassword}</code
        >
        <span class="copy-control">
          <button
            type="button"
            class="btn btn-outline-primary copy-button"
            data-copied={copyState === "copied" ? "" : undefined}
            data-failed={copyState === "failed" ? "" : undefined}
            on:click={handleCopyPassword}
          >
            <i
              class="bi {copyState === 'copied' ? 'bi-check2' : 'bi-clipboard'}"
              aria-hidden="true"
            ></i>
            <span>Copiar clave</span>
          </button>
          <span
            class="copy-feedback"
            class:is-visible={Boolean(copyMessage)}
            class:is-failed={copyState === "failed"}
            role="status"
          >
            {copyMessage}
          </span>
        </span>
      </div>

      <div class="auth-actions">
        <a
          href="/dentists/add"
          class="btn btn-outline-primary"
          on:click|preventDefault={() => {
            form = null;
          }}
        >
          Registrar otro
        </a>
        <a href="/dentists" class="btn auth-btn-primary">
          Ir al listado de odontólogos
        </a>
      </div>
    </div>
  {:else}
    <form method="POST" class="auth-form" use:enhance={handleEnhance}>
      <p class="auth-required-legend">
        Los campos marcados con <span aria-hidden="true">*</span> son obligatorios.
      </p>

      <div class="mb-3">
        <label for="registrationNumber" class="form-label"
          >Matrícula <span aria-hidden="true">*</span></label
        >
        <input
          type="text"
          inputmode="numeric"
          class="form-control auth-input"
          class:is-invalid={Boolean(
            fieldErrorFor(fieldErrors, "registrationNumber"),
          )}
          id="registrationNumber"
          name="registrationNumber"
          placeholder="Ingresá la matrícula"
          value={errorForm?.oldData ? errorForm.oldData.registrationNumber : ""}
          aria-invalid={fieldErrorFor(fieldErrors, "registrationNumber")
            ? "true"
            : undefined}
          aria-describedby={fieldErrorFor(fieldErrors, "registrationNumber")
            ? "registrationNumber-error"
            : undefined}
          required
        />
        {#if fieldErrorFor(fieldErrors, "registrationNumber")}
          <p id="registrationNumber-error" class="field-error">
            {fieldErrorFor(fieldErrors, "registrationNumber")}
          </p>
        {/if}
      </div>

      <div class="row">
        <div class="col-md-6 mb-3">
          <label for="firstName" class="form-label"
            >Nombre <span aria-hidden="true">*</span></label
          >
          <input
            type="text"
            class="form-control auth-input"
            class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "firstName"))}
            id="firstName"
            name="firstName"
            autocomplete="given-name"
            placeholder="Ingresá el nombre"
            value={errorForm?.oldData ? errorForm.oldData.firstName : ""}
            aria-invalid={fieldErrorFor(fieldErrors, "firstName")
              ? "true"
              : undefined}
            aria-describedby={fieldErrorFor(fieldErrors, "firstName")
              ? "firstName-error"
              : undefined}
            required
          />
          {#if fieldErrorFor(fieldErrors, "firstName")}
            <p id="firstName-error" class="field-error">
              {fieldErrorFor(fieldErrors, "firstName")}
            </p>
          {/if}
        </div>
        <div class="col-md-6 mb-3">
          <label for="lastName" class="form-label"
            >Apellido <span aria-hidden="true">*</span></label
          >
          <input
            type="text"
            class="form-control auth-input"
            class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "lastName"))}
            id="lastName"
            name="lastName"
            autocomplete="family-name"
            placeholder="Ingresá el apellido"
            value={errorForm?.oldData ? errorForm.oldData.lastName : ""}
            aria-invalid={fieldErrorFor(fieldErrors, "lastName")
              ? "true"
              : undefined}
            aria-describedby={fieldErrorFor(fieldErrors, "lastName")
              ? "lastName-error"
              : undefined}
            required
          />
          {#if fieldErrorFor(fieldErrors, "lastName")}
            <p id="lastName-error" class="field-error">
              {fieldErrorFor(fieldErrors, "lastName")}
            </p>
          {/if}
        </div>
      </div>

      <div class="mb-3">
        <label for="email" class="form-label"
          >Email <span aria-hidden="true">*</span></label
        >
        <input
          type="email"
          class="form-control auth-input"
          class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "email"))}
          id="email"
          name="email"
          autocomplete="email"
          autocapitalize="none"
          spellcheck="false"
          placeholder="ejemplo@email.com"
          value={errorForm?.oldData ? errorForm.oldData.email : ""}
          aria-invalid={fieldErrorFor(fieldErrors, "email")
            ? "true"
            : undefined}
          aria-describedby={fieldErrorFor(fieldErrors, "email")
            ? "email-error"
            : undefined}
          required
        />
        {#if fieldErrorFor(fieldErrors, "email")}
          <p id="email-error" class="field-error">
            {fieldErrorFor(fieldErrors, "email")}
          </p>
        {/if}
      </div>

      <PasswordField
        id="password"
        name="password"
        label="Contraseña (opcional)"
        placeholder="Dejar en blanco para generar clave temporal segura"
        autocomplete="new-password"
        required={false}
        invalid={Boolean(fieldErrorFor(fieldErrors, "password"))}
        errorText={fieldErrorFor(fieldErrors, "password")}
        errorId="password-error"
        helpId="password-help"
        helpText="Si se deja en blanco, el sistema genera una clave temporal aleatoria que el profesional deberá cambiar al ingresar."
      />

      <div class="auth-actions">
        <a href="/dentists" class="btn btn-outline-primary">Cancelar</a>
        <button
          type="submit"
          class="btn auth-btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : "Guardar Odontólogo"}
        </button>
      </div>
    </form>
  {/if}
</FormCard>

<style>
  .temp-password-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .temp-password-notice {
    margin: 0;
    color: var(--color-texto-muted);
    font-size: 0.95rem;
  }

  .temp-password-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background-color: var(--color-fondo-input);
    border: 1px solid var(--color-borde-suave);
    border-radius: 10px;
  }

  .temp-password-row code {
    flex: 1 1 auto;
    min-width: 0;
    padding: 0.5rem 0.75rem;
    background-color: var(--color-blanco);
    border: 1px solid var(--color-borde-suave);
    border-radius: 6px;
    color: var(--color-texto);
    font-size: 1rem;
    font-weight: 600;
    word-break: break-all;
  }

  .copy-control {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .copy-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-inline-size: 44px;
    min-block-size: 44px;
    padding: 0.5rem 0.875rem;
  }

  .copy-feedback {
    position: absolute;
    inset-block-end: calc(100% + 0.4rem);
    inset-inline-end: 0;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    background-color: var(--color-exito-texto);
    color: var(--color-blanco);
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .copy-feedback.is-visible {
    opacity: 1;
  }

  .copy-feedback.is-failed {
    background-color: var(--color-peligro-texto);
  }

  @media (prefers-reduced-motion: reduce) {
    .copy-feedback {
      transition: opacity 0.05s linear;
    }
  }
</style>
