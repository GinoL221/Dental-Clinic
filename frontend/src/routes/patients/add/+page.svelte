<script>
  import { enhance } from "$app/forms";
  import FormCard from "$lib/components/FormCard.svelte";
  import PasswordField from "$lib/components/PasswordField.svelte";
  import { createSubmitEnhance } from "$lib/utils/formEnhance.js";
  import { fieldErrorFor } from "$lib/utils/formatters.js";

  /** @type {import('./$types').ActionData} */
  export let form;

  let isSubmitting = false;
  const handleEnhance = createSubmitEnhance((v) => (isSubmitting = v));

  $: fieldErrors = form?.fieldErrors;
</script>

<svelte:head>
  <title>Agregar Paciente | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Agregar Paciente"
  subtitle="Registrá un nuevo paciente en la clínica"
  error={form?.error}
  fieldErrors={form?.fieldErrors}
  backHref="/patients"
  backLabel="Volver a la lista de pacientes"
>
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
        value={form && form.oldData ? form.oldData.cardIdentity : ""}
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
          value={form && form.oldData ? form.oldData.firstName : ""}
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
          value={form && form.oldData ? form.oldData.lastName : ""}
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
        value={form && form.oldData ? form.oldData.email : ""}
        aria-invalid={fieldErrorFor(fieldErrors, "email") ? "true" : undefined}
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
            value={form && form.oldData ? form.oldData.street : ""}
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
            value={form && form.oldData ? form.oldData.number : ""}
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
            value={form && form.oldData ? form.oldData.location : ""}
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
            value={form && form.oldData ? form.oldData.province : ""}
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
</FormCard>
