<script>
  import { enhance } from "$app/forms";
  import FormCard from "$lib/components/FormCard.svelte";
  import { createSubmitEnhance } from "$lib/utils/formEnhance.js";
  import {
    APPOINTMENT_HOURS_HELP,
    fieldErrorFor,
  } from "$lib/utils/formatters.js";

  /** @type {import('./$types').PageData} */
  export let data;
  /** @type {import('./$types').ActionData} */
  export let form;

  let isSubmitting = false;
  const handleEnhance = createSubmitEnhance((v) => (isSubmitting = v));

  $: fieldErrors = form?.fieldErrors;

  let selectedPatientId = form?.oldData?.patientId
    ? String(form.oldData.patientId)
    : "";
  let selectedDentistId = form?.oldData?.dentistId
    ? String(form.oldData.dentistId)
    : "";

  $: selectedPatient = data.patients.find(function (/** @type {any} */ p) {
    return p.id === parseInt(selectedPatientId);
  });
</script>

<svelte:head>
  <title>Programar Turno | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Agregar Turno"
  subtitle="Programar un nuevo turno"
  error={form?.error}
  fieldErrors={form?.fieldErrors}
  backHref="/appointments"
  backLabel="Volver a la lista de turnos"
>
  <form method="POST" class="auth-form" use:enhance={handleEnhance}>
    <p class="auth-required-legend">
      Los campos marcados con <span aria-hidden="true">*</span> son obligatorios.
    </p>

    {#if data.isPatient}
      <input type="hidden" name="patientId" value={data.user?.id || ""} />
      <div class="auth-info-summary">
        <span class="auth-info-label">Paciente</span>
        <div>
          {data.user?.firstName}
          {data.user?.lastName} ({data.user?.email})
        </div>
        <div class="auth-help-text">El turno quedará agendado a tu nombre.</div>
      </div>
    {:else}
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
            ? "patientId-error patientSelect-help"
            : "patientSelect-help"}
          required
        >
          <option value="" disabled>Elegí un paciente</option>
          {#each data.patients as patient (patient.id)}
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
        <div id="patientSelect-help" class="auth-help-text">
          Elegí el usuario que será el paciente para este turno.
        </div>
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
    {/if}

    <!-- Seleccionar Odontólogo -->
    <div class="row">
      <div class="col-md-12 mb-3">
        <label for="dentistId" class="form-label"
          >Odontólogo <span aria-hidden="true">*</span></label
        >
        <select
          class="form-select auth-input"
          class:is-invalid={Boolean(fieldErrorFor(fieldErrors, "dentistId"))}
          id="dentistId"
          name="dentistId"
          bind:value={selectedDentistId}
          aria-invalid={fieldErrorFor(fieldErrors, "dentistId")
            ? "true"
            : undefined}
          aria-describedby={fieldErrorFor(fieldErrors, "dentistId")
            ? "dentistId-error"
            : undefined}
          required
        >
          <option value="" disabled>Elegí un odontólogo</option>
          {#each data.dentists as dentist (dentist.id)}
            <option value={String(dentist.id)}>
              Dr/a. {dentist.firstName}
              {dentist.lastName} (Mat. {dentist.registrationNumber})
            </option>
          {/each}
        </select>
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
          value={form?.oldData?.appointmentDate ?? ""}
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
          value={form?.oldData?.appointmentTime ?? ""}
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
      {APPOINTMENT_HOURS_HELP}
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
        value={form?.oldData?.description ?? ""}
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

    <div class="auth-actions">
      <a href="/appointments" class="btn btn-outline-primary">Cancelar</a>
      <button
        type="submit"
        class="btn auth-btn-primary"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Guardando..." : "Programar Turno"}
      </button>
    </div>
  </form>
</FormCard>
