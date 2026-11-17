<script>
  import FormCard from "$lib/components/FormCard.svelte";
  import { fieldErrorFor } from "$lib/utils/formatters.js";

  /** @type {import('./$types').PageData} */
  export let data;
  /** @type {import('./$types').ActionData} */
  export let form;

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
  <form method="POST" action="?/update" class="auth-form">
    <div class="mb-3">
      <label for="registrationNumber" class="form-label">Matrícula</label>
      <input
        type="text"
        class="form-control auth-input"
        id="registrationNumber"
        name="registrationNumber"
        placeholder="Ingresá la matrícula"
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
        <label for="lastName" class="form-label">Apellido</label>
        <input
          type="text"
          class="form-control auth-input"
          id="lastName"
          name="lastName"
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

  <section class="mt-4 pt-4 border-top" aria-labelledby="specialties-heading">
    <h2 id="specialties-heading" class="h5 mb-3">Especialidades</h2>

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
      <ul class="list-unstyled d-flex flex-wrap gap-2 mb-3">
        {#each assignedSpecialties as specialty}
          <li class="d-inline-flex align-items-center gap-1">
            <span class="badge status-scheduled py-2 px-3">
              {specialty.name}
            </span>
            {#if isAdmin}
              <form method="POST" action="?/removeSpecialty" class="d-inline">
                <input type="hidden" name="specialtyId" value={specialty.id} />
                <button
                  type="submit"
                  class="btn btn-sm btn-outline-danger"
                  aria-label="Quitar especialidad {specialty.name}"
                >
                  <i class="bi bi-x-lg" aria-hidden="true"></i>
                </button>
              </form>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-muted small mb-3">Sin especialidades asignadas</p>
    {/if}

    {#if isAdmin}
      {#if availableSpecialties.length > 0}
        <form
          method="POST"
          action="?/assignSpecialty"
          class="d-flex flex-wrap align-items-end gap-2 mb-3"
        >
          <div class="flex-grow-1">
            <label for="specialtyId" class="form-label">
              Asignar especialidad existente
            </label>
            <select
              id="specialtyId"
              name="specialtyId"
              class="form-select auth-input"
              required
            >
              <option value="">Seleccioná una especialidad...</option>
              {#each availableSpecialties as specialty}
                <option value={specialty.id}>{specialty.name}</option>
              {/each}
            </select>
          </div>
          <button type="submit" class="btn btn-outline-primary">Asignar</button>
        </form>
      {/if}

      <details class="mt-2">
        <summary class="btn btn-sm btn-outline-secondary">
          Crear nueva especialidad
        </summary>
        <form method="POST" action="?/createSpecialty" class="mt-3 auth-form">
          <div class="mb-2">
            <label for="newSpecialtyName" class="form-label">Nombre</label>
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
          <button type="submit" class="btn btn-outline-primary">
            Crear y asignar
          </button>
        </form>
      </details>
    {/if}
  </section>
</FormCard>
