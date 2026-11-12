<script>
  import FormCard from "$lib/components/FormCard.svelte";
  import { fieldErrorFor } from "$lib/utils/formatters.js";

  /** @type {import('./$types').PageData} */
  export let data;
  /** @type {import('./$types').ActionData} */
  export let form;

  $: patient = (form && form.oldData) || data.patient;
  $: fieldErrors = form?.fieldErrors;
</script>

<svelte:head>
  <title>Editar Paciente | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Editar Paciente"
  subtitle="Modifica los datos del paciente"
  error={form?.error}
  fieldErrors={form?.fieldErrors}
  backHref="/patients"
  backLabel="Volver a la lista de pacientes"
>
  <form method="POST" class="auth-form">
    <div class="mb-3">
      <label for="cardIdentity" class="form-label">DNI</label>
      <input
        type="number"
        class="form-control auth-input"
        id="cardIdentity"
        name="cardIdentity"
        placeholder="Ingrese el DNI"
        value={patient.cardIdentity || ""}
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
        <label for="firstName" class="form-label">Nombre</label>
        <input
          type="text"
          class="form-control auth-input"
          id="firstName"
          name="firstName"
          placeholder="Ingrese el nombre"
          value={patient.firstName || ""}
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
          value={patient.lastName || ""}
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
        placeholder="Ingrese el email"
        value={patient.email || ""}
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
      <label for="admissionDate" class="form-label">Fecha de Admisión</label>
      <input
        type="date"
        class="form-control auth-input"
        id="admissionDate"
        name="admissionDate"
        value={patient.admissionDate || ""}
        aria-invalid={fieldErrorFor(fieldErrors, "admissionDate")
          ? "true"
          : undefined}
        aria-describedby={fieldErrorFor(fieldErrors, "admissionDate")
          ? "admissionDate-error"
          : undefined}
        required
      />
      {#if fieldErrorFor(fieldErrors, "admissionDate")}
        <p id="admissionDate-error" class="field-error">
          {fieldErrorFor(fieldErrors, "admissionDate")}
        </p>
      {/if}
    </div>

    <div class="form-group mb-3">
      <h6>Dirección:</h6>

      <div class="row">
        <div class="col-md-8 mb-2">
          <label for="street_edit" class="form-label">Calle:</label>
          <input
            type="text"
            class="form-control"
            id="street_edit"
            name="street"
            placeholder="Nombre de la calle"
            value={(patient.address && patient.address.street) || ""}
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
          <label for="number_edit" class="form-label">Número:</label>
          <input
            type="number"
            class="form-control"
            id="number_edit"
            name="number"
            placeholder="Nº"
            value={(patient.address && patient.address.number) || ""}
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
          <label for="location_edit" class="form-label">Localidad:</label>
          <input
            type="text"
            class="form-control"
            id="location_edit"
            name="location"
            placeholder="Ciudad/Localidad"
            value={(patient.address && patient.address.location) || ""}
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
          <label for="province_edit" class="form-label">Provincia:</label>
          <input
            type="text"
            class="form-control"
            id="province_edit"
            name="province"
            placeholder="Provincia"
            value={(patient.address && patient.address.province) || ""}
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

    <button type="submit" class="btn auth-btn-primary w-100 mb-3">
      Actualizar Paciente
    </button>
  </form>
</FormCard>
