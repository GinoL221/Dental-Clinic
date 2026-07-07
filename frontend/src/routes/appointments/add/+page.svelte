<script>
  /** @type {import('./$types').PageData} */
  export var data;
  /** @type {import('./$types').ActionData} */
  export var form;

  var selectedPatientId = '';
  $: selectedPatient = data.patients.find(function(p) { return p.id === parseInt(selectedPatientId); });
</script>

<svelte:head>
  <title>Programar Cita | Dental Clinic</title>
</svelte:head>

<main class="main-content auth-page">
  <div class="container-fluid">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2 class="auth-title">Agregar Cita</h2>
          <p class="auth-subtitle">Programar una nueva cita médica</p>
        </div>

        {#if form && form.error}
          <div class="alert alert-danger mb-3">{form.error}</div>
        {/if}

        <form method="POST" class="auth-form">
          <!-- Seleccionar Paciente -->
          <div class="mb-3">
            <label for="patientSelect" class="form-label">Seleccionar Paciente</label>
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
                  {patient.firstName} {patient.lastName} - {patient.email}
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
                  <label class="form-label font-weight-bold">Nombre</label>
                  <div>{selectedPatient.firstName}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label font-weight-bold">Apellido</label>
                  <div>{selectedPatient.lastName}</div>
                </div>
                <div class="col-md-4">
                  <label class="form-label font-weight-bold">Email</label>
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
                required
              >
                <option value="">Seleccione un odontólogo</option>
                {#each data.dentists as dentist}
                  <option value={dentist.id}>
                    Dr/a. {dentist.firstName} {dentist.lastName} (Mat. {dentist.registrationNumber})
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
              placeholder="Ingrese el motivo de la consulta"
            ></textarea>
          </div>

          <button type="submit" class="btn auth-btn-primary w-100 mb-3">
            Programar Cita
          </button>

          <div class="auth-footer">
            <p>
              <a href="/appointments" class="auth-link">← Volver a la lista de citas</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
</main>
