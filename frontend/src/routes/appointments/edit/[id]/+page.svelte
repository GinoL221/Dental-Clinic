<script>
  import { enhance } from "$app/forms";
  import FormCard from "$lib/components/FormCard.svelte";
  import {
    fieldErrorFor,
    getStatusClass,
    getStatusLabel,
  } from "$lib/utils/formatters.js";
  import { validTransitions } from "$lib/utils/statusMachine.js";

  /** @type {import('./$types').PageData} */
  export let data;
  /** @type {import('./$types').ActionData} */
  export let form;

  let isSubmitting = false;

  $: appointment = (form && form.oldData) || data.appointment;
  $: fieldErrors = form?.fieldErrors;
  $: isDentistRole = data.user?.role === "DENTIST";

  const initialPatientId = data.appointment?.patientId;
  let selectedPatientId = initialPatientId ? String(initialPatientId) : "";
  const initialDentistId = data.appointment?.dentistId;
  let selectedDentistId = initialDentistId ? String(initialDentistId) : "";

  $: selectedPatient = data.patients.find(function (/** @type {any} */ p) {
    return p.id === parseInt(selectedPatientId);
  });

  // P-6c (design.md §7): «selector de estado con transiciones válidas».
  // The current status is always offered (backend no-op, see statusMachine);
  // terminal states show read-only text and no selector.
  $: currentStatus = data.appointment?.status || "";
  $: statusOptions = validTransitions(currentStatus);
  /** @type {string} */
  let selectedStatus = data.appointment?.status || "";
</script>

<svelte:head>
  <title>Editar Turno | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Editar Turno"
  subtitle="Modificá los detalles del turno"
  error={form?.error}
  fieldErrors={form?.fieldErrors}
  backHref="/appointments"
  backLabel="Volver a la lista de turnos"
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

    <!-- Seleccionar Paciente -->
    <div class="mb-3">
      <label for="patientSelect" class="form-label"
        >Seleccionar Paciente <span aria-hidden="true">*</span></label
      >
      <select
        class="form-select auth-input"
        class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "patientId"))}
        id="patientSelect"
        name="patientId"
        bind:value={selectedPatientId}
        aria-invalid={fieldErrorFor(fieldErrors, "patientId")
          ? "true"
          : undefined}
        aria-describedby={fieldErrorFor(fieldErrors, "patientId")
          ? "patientId-error"
          : undefined}
        required
      >
        <option value="" disabled>Elegí un paciente</option>
        {#each data.patients as patient}
          <option value={String(patient.id)}>
            {patient.firstName}
            {patient.lastName} - {patient.email}
          </option>
        {/each}
      </select>
      {#if fieldErrorFor(fieldErrors, "patientId")}
        <p id="patientId-error" class="field-error">
          {fieldErrorFor(fieldErrors, "patientId")}
        </p>
      {/if}
    </div>

    <!-- Información del paciente seleccionado -->
    {#if selectedPatient}
      <div id="patientInfoFields" class="auth-info-summary">
        <div class="row">
          <div class="col-md-4">
            <span class="auth-info-label">Nombre</span>
            <div>{selectedPatient.firstName}</div>
          </div>
          <div class="col-md-4">
            <span class="auth-info-label">Apellido</span>
            <div>{selectedPatient.lastName}</div>
          </div>
          <div class="col-md-4">
            <span class="auth-info-label">Email</span>
            <div>{selectedPatient.email}</div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Seleccionar Odontólogo -->
    <div class="row">
      <div class="col-md-12 mb-3">
        <label for="dentistId" class="form-label"
          >Odontólogo <span aria-hidden="true">*</span></label
        >
        {#if isDentistRole}
          <input type="hidden" name="dentistId" value={selectedDentistId} />
        {/if}
        <select
          class="form-select auth-input"
          class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "dentistId"))}
          id="dentistId"
          name={isDentistRole ? undefined : "dentistId"}
          bind:value={selectedDentistId}
          disabled={isDentistRole}
          aria-invalid={fieldErrorFor(fieldErrors, "dentistId")
            ? "true"
            : undefined}
          aria-describedby={[
            fieldErrorFor(fieldErrors, "dentistId") ? "dentistId-error" : null,
            isDentistRole ? "dentistId-role-note" : null,
          ]
            .filter(Boolean)
            .join(" ") || undefined}
          required
        >
          <option value="" disabled>Elegí un odontólogo</option>
          {#each data.dentists as dentist}
            <option value={String(dentist.id)}>
              Dr/a. {dentist.firstName}
              {dentist.lastName} (Mat. {dentist.registrationNumber})
            </option>
          {/each}
        </select>
        {#if isDentistRole}
          <div id="dentistId-role-note" class="auth-help-text">
            No podés reasignar el odontólogo del turno.
          </div>
        {/if}
        {#if fieldErrorFor(fieldErrors, "dentistId")}
          <p id="dentistId-error" class="field-error">
            {fieldErrorFor(fieldErrors, "dentistId")}
          </p>
        {/if}
      </div>
    </div>

    <!-- Fecha y Hora -->
    <div class="row">
      <div class="col-md-6 mb-2">
        <label for="appointmentDate" class="form-label"
          >Fecha <span aria-hidden="true">*</span></label
        >
        <input
          type="date"
          class="form-control auth-input"
          class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "date"))}
          id="appointmentDate"
          name="appointmentDate"
          value={form?.oldData?.appointmentDate ?? appointment.date ?? ""}
          aria-invalid={fieldErrorFor(fieldErrors, "date") ? "true" : undefined}
          aria-describedby={fieldErrorFor(fieldErrors, "date")
            ? "appointmentDate-error appointment-hours-help"
            : "appointment-hours-help"}
          required
        />
        {#if fieldErrorFor(fieldErrors, "date")}
          <p id="appointmentDate-error" class="field-error">
            {fieldErrorFor(fieldErrors, "date")}
          </p>
        {/if}
      </div>
      <div class="col-md-6 mb-2">
        <label for="appointmentTime" class="form-label"
          >Hora <span aria-hidden="true">*</span></label
        >
        <input
          type="time"
          class="form-control auth-input"
          class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "time"))}
          id="appointmentTime"
          name="appointmentTime"
          value={form?.oldData?.appointmentTime ?? appointment.time ?? ""}
          aria-invalid={fieldErrorFor(fieldErrors, "time") ? "true" : undefined}
          aria-describedby={fieldErrorFor(fieldErrors, "time")
            ? "appointmentTime-error appointment-hours-help"
            : "appointment-hours-help"}
          required
        />
        {#if fieldErrorFor(fieldErrors, "time")}
          <p id="appointmentTime-error" class="field-error">
            {fieldErrorFor(fieldErrors, "time")}
          </p>
        {/if}
      </div>
    </div>
    <div id="appointment-hours-help" class="auth-help-text mb-3">
      Atención de lunes a viernes, de 08:00 a 18:00.
    </div>

    <!-- Descripción -->
    <div class="mb-3">
      <label for="description" class="form-label">Descripción / Motivo</label>
      <textarea
        class="form-control auth-input"
        class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "description"))}
        id="description"
        name="description"
        rows="3"
        placeholder="Ingresá el motivo de la consulta"
        value={appointment.description || ""}
        aria-invalid={fieldErrorFor(fieldErrors, "description")
          ? "true"
          : undefined}
        aria-describedby={fieldErrorFor(fieldErrors, "description")
          ? "description-error"
          : undefined}></textarea>
      {#if fieldErrorFor(fieldErrors, "description")}
        <p id="description-error" class="field-error">
          {fieldErrorFor(fieldErrors, "description")}
        </p>
      {/if}
    </div>

    <!-- Estado del turno (solo transiciones válidas; design.md §6.3/§7).
         El PUT /api/appointments/{id} no acepta estado (AppointmentRequestDTO
         no lo tiene), así que +page.server.js envía un PATCH separado a
         /appointments/{id}/status cuando el estado cambia. -->
    <div class="mb-3">
      <label for="statusSelect" class="form-label">Estado del turno</label>
      {#if currentStatus && statusOptions.length > 0}
        <select
          class="form-select auth-input"
          class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "status"))}
          id="statusSelect"
          name="status"
          bind:value={selectedStatus}
          aria-invalid={fieldErrorFor(fieldErrors, "status")
            ? "true"
            : undefined}
          aria-describedby={fieldErrorFor(fieldErrors, "status")
            ? "status-error"
            : undefined}
        >
          <option value={currentStatus}
            >{getStatusLabel(currentStatus)} (actual)</option
          >
          {#each statusOptions as option}
            <option value={option}>{getStatusLabel(option)}</option>
          {/each}
        </select>
        {#if fieldErrorFor(fieldErrors, "status")}
          <p id="status-error" class="field-error">
            {fieldErrorFor(fieldErrors, "status")}
          </p>
        {/if}
      {:else if currentStatus}
        <p class="mb-1">
          <span class="badge {getStatusClass(currentStatus)}"
            >{getStatusLabel(currentStatus)}</span
          >
        </p>
        <div class="auth-help-text">
          Este turno está en un estado final y no admite más cambios de estado.
        </div>
      {/if}
    </div>

    <div class="auth-actions">
      <a href="/appointments" class="btn btn-outline-primary">Cancelar</a>
      <button
        type="submit"
        class="btn auth-btn-primary"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Guardando..." : "Actualizar Turno"}
      </button>
    </div>
  </form>
</FormCard>
