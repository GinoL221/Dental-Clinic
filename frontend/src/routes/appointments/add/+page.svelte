<script>
  import FormCard from "$lib/components/FormCard.svelte";

  /** @type {import('./$types').PageData} */
  export let data;
  /** @type {import('./$types').ActionData} */
  export let form;

  let selectedPatientId = "";
  $: selectedPatient = data.patients.find(function (/** @type {any} */ p) {
    return p.id === parseInt(selectedPatientId);
  });
</script>

<svelte:head>
  <title>Programar Cita | Dental Clinic</title>
</svelte:head>

<FormCard
  title="Agregar Cita"
  subtitle="Programar una nueva cita médica"
  error={form?.error}
  backHref="/appointments"
  backLabel="Volver a la lista de citas"
>
  <form method="POST" class="auth-form">
    {#if data.isPatient}
      <input type="hidden" name="patientId" value={data.user?.id || ""} />
      <div class="mb-3 card p-3 bg-light">
        <span class="form-label font-weight-bold d-block mb-1">Paciente</span>
        <div>
          {data.user?.firstName}
          {data.user?.lastName} ({data.user?.email})
        </div>
        <small class="form-text text-muted"
          >La cita quedará agendada a tu nombre.</small
        >
      </div>
    {:else}
      <!-- Seleccionar Paciente -->
      <div class="mb-3">
        <label for="patientSelect" class="form-label"
          >Seleccionar Paciente</label
        >
        <select
          class="form-control auth-input"
          id="patientSelect"
          name="patientId"
          bind:value={selectedPatientId}
          required
        >
          <option value="">Seleccione un paciente</option>
          {#each data.patients as patient}
            <option value={patient.id}>
              {patient.firstName}
              {patient.lastName} - {patient.email}
            </option>
          {/each}
        </select>
        <small class="form-text text-muted">
          Seleccione el usuario que será el paciente para esta cita.
        </small>
      </div>

      <!-- Información del paciente seleccionado -->
      {#if selectedPatient}
        <div id="patientInfoFields" class="mb-3 card p-3 bg-light">
          <div class="row">
            <div class="col-md-4">
              <span class="form-label font-weight-bold d-block mb-1"
                >Nombre</span
              >
              <div>{selectedPatient.firstName}</div>
            </div>
            <div class="col-md-4">
              <span class="form-label font-weight-bold d-block mb-1"
                >Apellido</span
              >
              <div>{selectedPatient.lastName}</div>
            </div>
            <div class="col-md-4">
              <span class="form-label font-weight-bold d-block mb-1">Email</span
              >
              <div>{selectedPatient.email}</div>
            </div>
          </div>
        </div>
      {/if}
    {/if}

    <!-- Seleccionar Odontólogo -->
    <div class="row">
      <div class="col-md-12 mb-3">
        <label for="dentistId" class="form-label">Odontólogo</label>
        <select
          class="form-control auth-input"
          id="dentistId"
          name="dentistId"
          required
        >
          <option value="">Seleccione un odontólogo</option>
          {#each data.dentists as dentist}
            <option value={dentist.id}>
              Dr/a. {dentist.firstName}
              {dentist.lastName} (Mat. {dentist.registrationNumber})
            </option>
          {/each}
        </select>
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
          required
        />
      </div>
      <div class="col-md-6 mb-3">
        <label for="appointmentTime" class="form-label">Hora</label>
        <input
          type="time"
          class="form-control auth-input"
          id="appointmentTime"
          name="appointmentTime"
          required
        />
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
        placeholder="Ingrese el motivo de la consulta"></textarea>
    </div>

    <button type="submit" class="btn auth-btn-primary w-100 mb-3">
      Programar Cita
    </button>
  </form>
</FormCard>
