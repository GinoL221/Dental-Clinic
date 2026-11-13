<script>
  import FormCard from "$lib/components/FormCard.svelte";
  import { fieldErrorFor } from "$lib/utils/formatters.js";

  /** @type {import('./$types').PageData} */
  export let data;
  /** @type {import('./$types').ActionData} */
  export let form;

  $: appointment = (form && form.oldData) || data.appointment;
  $: fieldErrors = form?.fieldErrors;

  const initialPatientId = appointment.patientId;
  let selectedPatientId = initialPatientId ? initialPatientId.toString() : "";
  $: selectedPatient = data.patients.find(function (/** @type {any} */ p) {
    return p.id === parseInt(selectedPatientId);
  });
</script>

<svelte:head>
  <title>Editar Cita | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Editar Cita"
  subtitle="Modifica los detalles de la cita"
  error={form?.error}
  fieldErrors={form?.fieldErrors}
  backHref="/appointments"
  backLabel="Volver a la lista de citas"
>
  <form method="POST" class="auth-form">
    <!-- Seleccionar Paciente -->
    <div class="mb-3">
      <label for="patientSelect" class="form-label">Seleccionar Paciente</label>
      <select
        class="form-control auth-input"
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
        <option value="">Seleccione un paciente</option>
        {#each data.patients as patient}
          <option
            value={patient.id}
            selected={patient.id === appointment.patientId}
          >
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
      <div id="patientInfoFields" class="mb-3 card p-3 bg-light">
        <div class="row">
          <div class="col-md-4">
            <span class="form-label font-weight-bold d-block mb-1">Nombre</span>
            <div>{selectedPatient.firstName}</div>
          </div>
          <div class="col-md-4">
            <span class="form-label font-weight-bold d-block mb-1"
              >Apellido</span
            >
            <div>{selectedPatient.lastName}</div>
          </div>
          <div class="col-md-4">
            <span class="form-label font-weight-bold d-block mb-1">Email</span>
            <div>{selectedPatient.email}</div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Seleccionar Odontólogo -->
    <div class="row">
      <div class="col-md-12 mb-3">
        <label for="dentistId" class="form-label">Odontólogo</label>
        <select
          class="form-control auth-input"
          id="dentistId"
          name="dentistId"
          aria-invalid={fieldErrorFor(fieldErrors, "dentistId")
            ? "true"
            : undefined}
          aria-describedby={fieldErrorFor(fieldErrors, "dentistId")
            ? "dentistId-error"
            : undefined}
          required
        >
          <option value="">Seleccione un odontólogo</option>
          {#each data.dentists as dentist}
            <option
              value={dentist.id}
              selected={dentist.id === appointment.dentistId}
            >
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
      <div class="col-md-6 mb-3">
        <label for="appointmentDate" class="form-label">Fecha</label>
        <input
          type="date"
          class="form-control auth-input"
          id="appointmentDate"
          name="appointmentDate"
          value={appointment.date || ""}
          aria-invalid={fieldErrorFor(fieldErrors, "date") ? "true" : undefined}
          aria-describedby={fieldErrorFor(fieldErrors, "date")
            ? "appointmentDate-error"
            : undefined}
          required
        />
        {#if fieldErrorFor(fieldErrors, "date")}
          <p id="appointmentDate-error" class="field-error">
            {fieldErrorFor(fieldErrors, "date")}
          </p>
        {/if}
      </div>
      <div class="col-md-6 mb-3">
        <label for="appointmentTime" class="form-label">Hora</label>
        <input
          type="time"
          class="form-control auth-input"
          id="appointmentTime"
          name="appointmentTime"
          value={appointment.time || ""}
          aria-invalid={fieldErrorFor(fieldErrors, "time") ? "true" : undefined}
          aria-describedby={fieldErrorFor(fieldErrors, "time")
            ? "appointmentTime-error"
            : undefined}
          required
        />
        {#if fieldErrorFor(fieldErrors, "time")}
          <p id="appointmentTime-error" class="field-error">
            {fieldErrorFor(fieldErrors, "time")}
          </p>
        {/if}
      </div>
    </div>

    <!-- Descripción -->
    <div class="mb-3">
      <label for="description" class="form-label">Descripción / Motivo</label>
      <textarea
        class="form-control auth-input"
        id="description"
        name="description"
        rows="3"
        placeholder="Ingrese el motivo de la consulta"
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

    <button type="submit" class="btn auth-btn-primary w-100 mb-3">
      Actualizar Cita
    </button>
  </form>
</FormCard>
