<script>
  import { enhance } from "$app/forms";
  import FormCard from "$lib/components/FormCard.svelte";
  import { fieldErrorFor } from "$lib/utils/formatters.js";

  /** @type {import('./$types').ActionData} */
  export let form;

  let isSubmitting = false;

  $: fieldErrors = form?.fieldErrors;
</script>

<svelte:head>
  <title>Agregar Odontólogo | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Agregar Odontólogo"
  subtitle="Registrá un nuevo profesional en la clínica"
  error={form?.error}
  fieldErrors={form?.fieldErrors}
  backHref="/dentists"
  backLabel="Volver a la lista de odontólogos"
>
  <form
    method="POST"
    class="auth-form"
    use:enhance={() => {
      isSubmitting = true;
      return async ({ update }) => {
        try {
          await update();
        } finally {
          isSubmitting = false;
        }
      };
    }}
  >
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
        value={form && form.oldData ? form.oldData.registrationNumber : ""}
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
        placeholder="ejemplo@email.com"
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
      <label for="password" class="form-label">Contraseña (opcional)</label>
      <input
        type="password"
        class="form-control auth-input"
        class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "password"))}
        id="password"
        name="password"
        placeholder="Dejar en blanco para generar clave temporal segura"
        autocomplete="new-password"
        aria-invalid={fieldErrorFor(fieldErrors, "password")
          ? "true"
          : undefined}
        aria-describedby={fieldErrorFor(fieldErrors, "password")
          ? "password-error password-help"
          : "password-help"}
      />
      {#if fieldErrorFor(fieldErrors, "password")}
        <p id="password-error" class="field-error">
          {fieldErrorFor(fieldErrors, "password")}
        </p>
      {/if}
      <div id="password-help" class="auth-help-text">
        Si se deja en blanco, el sistema genera una clave temporal aleatoria que
        el profesional deberá cambiar al ingresar.
      </div>
    </div>

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
</FormCard>
