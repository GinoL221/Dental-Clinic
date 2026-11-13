<script>
  import FormCard from "$lib/components/FormCard.svelte";
  import { fieldErrorFor } from "$lib/utils/formatters.js";

  /** @type {import('./$types').PageData} */
  export let data;
  /** @type {import('./$types').ActionData} */
  export let form;

  $: dentist = (form && form.oldData) || data.dentist;
  $: fieldErrors = form?.fieldErrors;
</script>

<svelte:head>
  <title>Editar Odontólogo | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Editar Odontólogo"
  subtitle="Modifica los datos del odontólogo"
  error={form?.error}
  fieldErrors={form?.fieldErrors}
  backHref="/dentists"
  backLabel="Volver a la lista de odontólogos"
>
  <form method="POST" class="auth-form">
    <div class="mb-3">
      <label for="registrationNumber" class="form-label">Matrícula</label>
      <input
        type="text"
        class="form-control auth-input"
        id="registrationNumber"
        name="registrationNumber"
        placeholder="Ingrese la matrícula"
        value={dentist.registrationNumber || ""}
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
        <label for="firstName" class="form-label">Nombre</label>
        <input
          type="text"
          class="form-control auth-input"
          id="firstName"
          name="firstName"
          placeholder="Ingrese el nombre"
          value={dentist.firstName || ""}
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
        <label for="lastName" class="form-label">Apellido</label>
        <input
          type="text"
          class="form-control auth-input"
          id="lastName"
          name="lastName"
          placeholder="Ingrese el apellido"
          value={dentist.lastName || ""}
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
      <label for="email" class="form-label">Email</label>
      <input
        type="email"
        class="form-control auth-input"
        id="email"
        name="email"
        placeholder="ejemplo@email.com"
        value={dentist.email || ""}
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

    <button type="submit" class="btn auth-btn-primary w-100 mb-3">
      Actualizar Odontólogo
    </button>
  </form>
</FormCard>
