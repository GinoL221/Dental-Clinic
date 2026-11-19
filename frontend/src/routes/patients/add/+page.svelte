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
  <title>Agregar Paciente | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Agregar Paciente"
  subtitle="Registrá un nuevo paciente en la clínica"
  error={errorForm?.error}
  fieldErrors={errorForm?.fieldErrors}
  backHref="/patients"
  backLabel="Volver a la lista de pacientes"
>
  {#if createdForm}
    <div class="temp-password-panel" role="status">
      <div class="alert alert-success mb-3">
        <i class="bi bi-check-circle me-2" aria-hidden="true"></i>
        Paciente <strong>{createdForm.createdName}</strong>
        ({createdForm.createdEmail}) registrado correctamente.
      </div>

      <p class="temp-password-notice">
        Esta contraseña temporal se muestra una sola vez. El paciente deberá
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
          href="/patients/add"
          class="btn btn-outline-primary"
          on:click|preventDefault={() => {
            form = null;
          }}
        >
          Registrar otro
        </a>
        <a href="/patients" class="btn auth-btn-primary">
          Ir al listado de pacientes
        </a>
      </div>
    </div>
  {:else}
    <form method="POST" class="auth-form" use:enhance={handleEnhance}>
      <p class="auth-required-legend">
        Los campos marcados con <span aria-hidden="true">*</span> son obligatorios.
      </p>

      <div class="mb-3">
        <label for="cardIdentity" class="form-label"
          >DNI <span aria-hidden="true">*</span></label
        >
        <input
          type="text"
          inputmode="numeric"
          class="form-control auth-input"
          class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "cardIdentity"))}
          id="cardIdentity"
          name="cardIdentity"
          placeholder="Ingresá el DNI"
          value={errorForm?.oldData ? errorForm.oldData.cardIdentity : ""}
          aria-invalid={fieldErrorFor(fieldErrors, "cardIdentity")
            ? "true"
            : undefined}
          aria-describedby={fieldErrorFor(fieldErrors, "cardIdentity")
            ? "cardIdentity-error"
            : undefined}
          required
        />
        {#if fieldErrorFor(fieldErrors, "cardIdentity")}
          <p id="cardIdentity-error" class="field-error">
            {fieldErrorFor(fieldErrors, "cardIdentity")}
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
          placeholder="Ingresá el email"
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

      <div class="mb-3">
        <h2 class="auth-section-heading mt-2 mb-3">Dirección</h2>

        <div class="row">
          <div class="col-md-8 mb-2">
            <label for="street" class="form-label">Calle</label>
            <input
              type="text"
              class="form-control auth-input"
              class:is-invalid={Boolean(
                fieldErrorFor(fieldErrors, "address.street"),
              )}
              id="street"
              name="street"
              autocomplete="street-address"
              placeholder="Nombre de la calle"
              value={errorForm?.oldData ? errorForm.oldData.street : ""}
              aria-invalid={fieldErrorFor(fieldErrors, "address.street")
                ? "true"
                : undefined}
              aria-describedby={fieldErrorFor(fieldErrors, "address.street")
                ? "street-error"
                : undefined}
            />
            {#if fieldErrorFor(fieldErrors, "address.street")}
              <p id="street-error" class="field-error">
                {fieldErrorFor(fieldErrors, "address.street")}
              </p>
            {/if}
          </div>
          <div class="col-md-4 mb-2">
            <label for="number" class="form-label">Número</label>
            <input
              type="text"
              inputmode="numeric"
              class="form-control auth-input"
              class:is-invalid={Boolean(
                fieldErrorFor(fieldErrors, "address.number"),
              )}
              id="number"
              name="number"
              placeholder="Nº"
              value={errorForm?.oldData ? errorForm.oldData.number : ""}
              aria-invalid={fieldErrorFor(fieldErrors, "address.number")
                ? "true"
                : undefined}
              aria-describedby={fieldErrorFor(fieldErrors, "address.number")
                ? "number-error"
                : undefined}
            />
            {#if fieldErrorFor(fieldErrors, "address.number")}
              <p id="number-error" class="field-error">
                {fieldErrorFor(fieldErrors, "address.number")}
              </p>
            {/if}
          </div>
        </div>

        <div class="row">
          <div class="col-md-6 mb-2">
            <label for="location" class="form-label">Localidad</label>
            <input
              type="text"
              class="form-control auth-input"
              class:is-invalid={Boolean(
                fieldErrorFor(fieldErrors, "address.location"),
              )}
              id="location"
              name="location"
              autocomplete="address-level2"
              placeholder="Ciudad/Localidad"
              value={errorForm?.oldData ? errorForm.oldData.location : ""}
              aria-invalid={fieldErrorFor(fieldErrors, "address.location")
                ? "true"
                : undefined}
              aria-describedby={fieldErrorFor(fieldErrors, "address.location")
                ? "location-error"
                : undefined}
            />
            {#if fieldErrorFor(fieldErrors, "address.location")}
              <p id="location-error" class="field-error">
                {fieldErrorFor(fieldErrors, "address.location")}
              </p>
            {/if}
          </div>
          <div class="col-md-6 mb-2">
            <label for="province" class="form-label">Provincia</label>
            <input
              type="text"
              class="form-control auth-input"
              class:is-invalid={Boolean(
                fieldErrorFor(fieldErrors, "address.province"),
              )}
              id="province"
              name="province"
              autocomplete="address-level1"
              placeholder="Provincia"
              value={errorForm?.oldData ? errorForm.oldData.province : ""}
              aria-invalid={fieldErrorFor(fieldErrors, "address.province")
                ? "true"
                : undefined}
              aria-describedby={fieldErrorFor(fieldErrors, "address.province")
                ? "province-error"
                : undefined}
            />
            {#if fieldErrorFor(fieldErrors, "address.province")}
              <p id="province-error" class="field-error">
                {fieldErrorFor(fieldErrors, "address.province")}
              </p>
            {/if}
          </div>
        </div>
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
        helpText="Si se deja en blanco, el sistema genera una clave temporal aleatoria que el paciente deberá cambiar al ingresar."
      />

      <div class="auth-actions">
        <a href="/patients" class="btn btn-outline-primary">Cancelar</a>
        <button
          type="submit"
          class="btn auth-btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : "Guardar Paciente"}
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
