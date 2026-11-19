<script>
  import { enhance } from "$app/forms";
  import FormCard from "$lib/components/FormCard.svelte";
  import { createSubmitEnhance } from "$lib/utils/formEnhance.js";
  import { fieldErrorFor } from "$lib/utils/formatters.js";

  /** @type {import('./$types').PageData} */
  export let data;
  /** @type {import('./$types').ActionData} */
  export let form;

  let isSubmitting = false;
  const handleEnhance = createSubmitEnhance((v) => (isSubmitting = v));

  $: patient = (form && form.oldData) || data.patient;
  $: fieldErrors = form?.fieldErrors;
  $: isPatientRole = data.user?.role === "PATIENT";
  $: cancelHref = isPatientRole ? "/" : "/patients";
</script>

<svelte:head>
  <title>Editar Paciente | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Editar Paciente"
  subtitle="Modificá los datos del paciente"
  error={form?.error}
  fieldErrors={form?.fieldErrors}
  backHref={cancelHref}
  backLabel={isPatientRole
    ? "Volver al inicio"
    : "Volver a la lista de pacientes"}
>
  <form method="POST" class="auth-form" use:enhance={handleEnhance}>
    <p class="auth-required-legend">
      Los campos marcados con <span aria-hidden="true">*</span> son obligatorios.
    </p>

    <div class="mb-3">
      <label for="cardIdentity" class="form-label"
        >DNI <span aria-hidden="true">*</span></label
      >
      {#if isPatientRole}
        <input
          type="hidden"
          name="cardIdentity"
          value={patient.cardIdentity || ""}
        />
      {/if}
      <input
        type="text"
        inputmode="numeric"
        class="form-control auth-input"
        class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "cardIdentity"))}
        id="cardIdentity"
        name={isPatientRole ? undefined : "cardIdentity"}
        placeholder="Ingresá el DNI"
        value={patient.cardIdentity || ""}
        disabled={isPatientRole}
        aria-invalid={fieldErrorFor(fieldErrors, "cardIdentity")
          ? "true"
          : undefined}
        aria-describedby={[
          fieldErrorFor(fieldErrors, "cardIdentity")
            ? "cardIdentity-error"
            : null,
          isPatientRole ? "cardIdentity-role-note" : null,
        ]
          .filter(Boolean)
          .join(" ") || undefined}
        required
      />
      {#if isPatientRole}
        <div id="cardIdentity-role-note" class="auth-help-text">
          Solo lectura para el paciente; lo gestiona administración.
        </div>
      {/if}
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
      <label for="email" class="form-label"
        >Email <span aria-hidden="true">*</span></label
      >
      {#if isPatientRole}
        <input type="hidden" name="email" value={patient.email || ""} />
      {/if}
      <input
        type="email"
        class="form-control auth-input"
        class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "email"))}
        id="email"
        name={isPatientRole ? undefined : "email"}
        autocomplete="email"
        autocapitalize="none"
        spellcheck="false"
        placeholder="Ingresá el email"
        value={patient.email || ""}
        disabled={isPatientRole}
        aria-invalid={fieldErrorFor(fieldErrors, "email") ? "true" : undefined}
        aria-describedby={[
          fieldErrorFor(fieldErrors, "email") ? "email-error" : null,
          isPatientRole ? "email-role-note" : null,
        ]
          .filter(Boolean)
          .join(" ") || undefined}
        required
      />
      {#if isPatientRole}
        <div id="email-role-note" class="auth-help-text">
          Solo lectura para el paciente; lo gestiona administración.
        </div>
      {/if}
      {#if fieldErrorFor(fieldErrors, "email")}
        <p id="email-error" class="field-error">
          {fieldErrorFor(fieldErrors, "email")}
        </p>
      {/if}
    </div>

    <div class="mb-3">
      <label for="admissionDate" class="form-label"
        >Fecha de Admisión <span aria-hidden="true">*</span></label
      >
      <input
        type="date"
        class="form-control auth-input"
        class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "admissionDate"))}
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

    <div class="mb-3">
      <h2 class="auth-section-heading mt-2 mb-3">Dirección</h2>
      <!-- Dual shape: data.patient nests fields under `address` (API DTO),
           while form?.oldData flattens them at top level after a failed submit. -->

      <div class="row">
        <div class="col-md-8 mb-2">
          <label for="street_edit" class="form-label">Calle</label>
          <input
            type="text"
            class="form-control auth-input"
            class:is-invalid={Boolean(
              fieldErrorFor(fieldErrors, "address.street"),
            )}
            id="street_edit"
            name="street"
            autocomplete="street-address"
            placeholder="Nombre de la calle"
            value={patient.address?.street ?? patient.street ?? ""}
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
          <label for="number_edit" class="form-label">Número</label>
          <input
            type="text"
            inputmode="numeric"
            class="form-control auth-input"
            class:is-invalid={Boolean(
              fieldErrorFor(fieldErrors, "address.number"),
            )}
            id="number_edit"
            name="number"
            placeholder="Nº"
            value={patient.address?.number ?? patient.number ?? ""}
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
          <label for="location_edit" class="form-label">Localidad</label>
          <input
            type="text"
            class="form-control auth-input"
            class:is-invalid={Boolean(
              fieldErrorFor(fieldErrors, "address.location"),
            )}
            id="location_edit"
            name="location"
            autocomplete="address-level2"
            placeholder="Ciudad/Localidad"
            value={patient.address?.location ?? patient.location ?? ""}
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
          <label for="province_edit" class="form-label">Provincia</label>
          <input
            type="text"
            class="form-control auth-input"
            class:is-invalid={Boolean(
              fieldErrorFor(fieldErrors, "address.province"),
            )}
            id="province_edit"
            name="province"
            autocomplete="address-level1"
            placeholder="Provincia"
            value={patient.address?.province ?? patient.province ?? ""}
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

    <div class="auth-actions">
      <a href={cancelHref} class="btn btn-outline-primary">Cancelar</a>
      <button
        type="submit"
        class="btn auth-btn-primary"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Guardando..." : "Actualizar Paciente"}
      </button>
    </div>
  </form>
</FormCard>
