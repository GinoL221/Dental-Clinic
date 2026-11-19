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
  let isSpecialtySubmitting = false;
  let showNewSpecialty = false;

  const handleEnhance = createSubmitEnhance((v) => (isSubmitting = v));
  const handleSpecialtyEnhance = createSubmitEnhance(
    (v) => (isSpecialtySubmitting = v),
  );

  $: dentist = (form && form.oldData) || data.dentist;
  $: fieldErrors = form?.fieldErrors;
  $: assignedSpecialties = Array.isArray(data.dentist?.specialties)
    ? data.dentist.specialties
    : [];
  $: assignedIds = new Set(
    assignedSpecialties.map((/** @type {any} */ s) => s.id),
  );
  $: availableSpecialties = (data.specialties || []).filter(
    (/** @type {any} */ s) => !assignedIds.has(s.id),
  );
  $: isAdmin = data.user?.role === "ADMIN";
  $: isDentistRole = data.user?.role === "DENTIST";
</script>

<svelte:head>
  <title>Editar Odontólogo | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Editar Odontólogo"
  subtitle="Modificá los datos del odontólogo"
  error={form?.error}
  fieldErrors={form?.fieldErrors}
  backHref="/dentists"
  backLabel="Volver a la lista de odontólogos"
>
  <form
    method="POST"
    action="?/update"
    class="auth-form"
    use:enhance={handleEnhance}
  >
    <p class="auth-required-legend">
      Los campos marcados con <span aria-hidden="true">*</span> son obligatorios.
    </p>

    <div class="mb-3">
      <label for="registrationNumber" class="form-label"
        >Matrícula <span aria-hidden="true">*</span></label
      >
      {#if isDentistRole}
        <input
          type="hidden"
          name="registrationNumber"
          value={dentist.registrationNumber || ""}
        />
      {/if}
      <input
        type="text"
        inputmode="numeric"
        class="form-control auth-input"
        class:is-invalid={Boolean(
          fieldErrorFor(fieldErrors, "registrationNumber"),
        )}
        id="registrationNumber"
        name={isDentistRole ? undefined : "registrationNumber"}
        placeholder="Ingresá la matrícula"
        value={dentist.registrationNumber || ""}
        disabled={isDentistRole}
        aria-invalid={fieldErrorFor(fieldErrors, "registrationNumber")
          ? "true"
          : undefined}
        aria-describedby={[
          fieldErrorFor(fieldErrors, "registrationNumber")
            ? "registrationNumber-error"
            : null,
          isDentistRole ? "registrationNumber-role-note" : null,
        ]
          .filter(Boolean)
          .join(" ") || undefined}
        required
      />
      {#if isDentistRole}
        <div id="registrationNumber-role-note" class="auth-help-text">
          Solo lectura para el odontólogo; lo gestiona administración.
        </div>
      {/if}
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
      <label for="email" class="form-label"
        >Email <span aria-hidden="true">*</span></label
      >
      {#if isDentistRole}
        <input type="hidden" name="email" value={dentist.email || ""} />
      {/if}
      <input
        type="email"
        class="form-control auth-input"
        class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "email"))}
        id="email"
        name={isDentistRole ? undefined : "email"}
        autocomplete="email"
        autocapitalize="none"
        spellcheck="false"
        placeholder="ejemplo@email.com"
        value={dentist.email || ""}
        disabled={isDentistRole}
        aria-invalid={fieldErrorFor(fieldErrors, "email") ? "true" : undefined}
        aria-describedby={[
          fieldErrorFor(fieldErrors, "email") ? "email-error" : null,
          isDentistRole ? "email-role-note" : null,
        ]
          .filter(Boolean)
          .join(" ") || undefined}
        required
      />
      {#if isDentistRole}
        <div id="email-role-note" class="auth-help-text">
          Solo lectura para el odontólogo; lo gestiona administración.
        </div>
      {/if}
      {#if fieldErrorFor(fieldErrors, "email")}
        <p id="email-error" class="field-error">
          {fieldErrorFor(fieldErrors, "email")}
        </p>
      {/if}
    </div>

    <div class="auth-actions">
      <a href="/dentists" class="btn btn-outline-primary">Cancelar</a>
      <button
        type="submit"
        class="btn auth-btn-primary"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Guardando..." : "Actualizar Odontólogo"}
      </button>
    </div>
  </form>

  <section class="auth-section-divider" aria-labelledby="specialties-heading">
    <h2 id="specialties-heading" class="auth-section-heading mb-3">
      Especialidades
    </h2>

    {#if form?.specialtySuccess}
      <div class="alert alert-success" role="status">
        {form.specialtySuccess}
      </div>
    {/if}
    {#if form?.specialtyError}
      <div class="alert alert-danger" role="alert">
        {form.specialtyError}
      </div>
    {/if}

    {#if assignedSpecialties.length > 0}
      <ul class="auth-specialty-list">
        {#each assignedSpecialties as specialty}
          <li
            class="auth-specialty-chip"
            class:auth-specialty-chip--removable={isAdmin}
          >
            <span>{specialty.name}</span>
            {#if isAdmin}
              <form
                method="POST"
                action="?/removeSpecialty"
                class="d-inline-flex"
                use:enhance={handleSpecialtyEnhance}
              >
                <input type="hidden" name="specialtyId" value={specialty.id} />
                <button
                  type="submit"
                  class="auth-specialty-remove"
                  aria-label="Quitar especialidad {specialty.name}"
                  disabled={isSpecialtySubmitting}
                >
                  <i class="bi bi-x-lg" aria-hidden="true"></i>
                </button>
              </form>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="auth-help-text mb-3">Sin especialidades asignadas</p>
    {/if}

    {#if isAdmin}
      {#if availableSpecialties.length > 0}
        <form
          method="POST"
          action="?/assignSpecialty"
          class="auth-specialty-assign"
          use:enhance={handleSpecialtyEnhance}
        >
          <div class="auth-specialty-assign-field">
            <label for="specialtyId" class="form-label">
              Asignar especialidad existente
            </label>
            <select
              id="specialtyId"
              name="specialtyId"
              class="form-select auth-input"
              required
            >
              <option value="" disabled selected
                >Seleccioná una especialidad...</option
              >
              {#each availableSpecialties as specialty}
                <option value={specialty.id}>{specialty.name}</option>
              {/each}
            </select>
          </div>
          <button
            type="submit"
            class="btn btn-outline-primary"
            disabled={isSpecialtySubmitting}
          >
            Asignar
          </button>
        </form>
      {/if}

      <div class="mt-2">
        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          aria-expanded={showNewSpecialty}
          aria-controls="new-specialty-panel"
          on:click={() => (showNewSpecialty = !showNewSpecialty)}
        >
          {showNewSpecialty
            ? "Ocultar nueva especialidad"
            : "+ Nueva especialidad"}
        </button>

        <div
          id="new-specialty-panel"
          class="auth-disclosure-panel"
          hidden={!showNewSpecialty}
        >
          <form
            method="POST"
            action="?/createSpecialty"
            class="auth-form mt-0"
            use:enhance={handleSpecialtyEnhance}
          >
            <div class="mb-2">
              <label for="newSpecialtyName" class="form-label"
                >Nombre <span aria-hidden="true">*</span></label
              >
              <input
                type="text"
                id="newSpecialtyName"
                name="name"
                class="form-control auth-input"
                placeholder="Ej. Implantología"
                required
              />
            </div>
            <div class="mb-3">
              <label for="newSpecialtyDescription" class="form-label">
                Descripción
              </label>
              <input
                type="text"
                id="newSpecialtyDescription"
                name="description"
                class="form-control auth-input"
                placeholder="Descripción breve (opcional)"
              />
            </div>
            <button
              type="submit"
              class="btn btn-outline-primary"
              disabled={isSpecialtySubmitting}
            >
              Crear y asignar
            </button>
          </form>
        </div>
      </div>
    {/if}
  </section>
</FormCard>
