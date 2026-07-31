<script>
  /** @type {import('./$types').PageData} */
  export var data;

  var searchQuery = '';

  function getPatientName(/** @type {any} */ patientId) {
    var patient = data.patients.find(function(/** @type {any} */ p) { return p.id === patientId; });
    return patient ? (patient.firstName + ' ' + patient.lastName) : ('Paciente #' + patientId);
  }

  function getDentistName(/** @type {any} */ dentistId) {
    var dentist = data.dentists.find(function(/** @type {any} */ d) { return d.id === dentistId; });
    return dentist ? ('Dr/a. ' + dentist.firstName + ' ' + dentist.lastName) : ('Odontólogo #' + dentistId);
  }

  $: filteredAppointments = data.appointments.filter(function(/** @type {any} */ appointment) {
    var search = searchQuery.toLowerCase();
    var patientName = getPatientName(appointment.patient_id).toLowerCase();
    var dentistName = getDentistName(appointment.dentist_id).toLowerCase();
    var desc = (appointment.description || '').toLowerCase();
    var date = (appointment.date || '').toLowerCase();
    return patientName.indexOf(search) !== -1 || dentistName.indexOf(search) !== -1 || desc.indexOf(search) !== -1 || date.indexOf(search) !== -1;
  });

  function clearSearch() {
    searchQuery = '';
  }
</script>

<svelte:head>
  <title>Lista de Citas | Dental Clinic</title>
</svelte:head>

<main class="main-content">
  <div class="container mt-4">
    <div class="content-card">
      <div class="patient-list-header d-flex justify-content-between align-items-center mb-4">
        <h1 class="patient-list-title">Lista de Citas</h1>
        <div class="d-flex gap-2">
          <input
            type="text"
            bind:value={searchQuery}
            class="form-control list-search-input"
            placeholder="Buscar cita..."
          />
          <button on:click={clearSearch} class="btn btn-outline-secondary" title="Limpiar búsqueda">
            <i class="bi bi-x-circle"></i>
          </button>
          <a href="/appointments/add" class="btn btn-add-patient">
            <i class="bi bi-plus-circle me-2"></i>Programar Cita
          </a>
        </div>
      </div>

      {#if data.error}
        <div class="alert alert-danger">{data.error}</div>
      {/if}

      <!-- Tabla de citas -->
      {#if filteredAppointments.length > 0}
        <div class="table-container">
          <!-- svelte-ignore a11y-no-redundant-roles -->
          <!-- role is redundant on desktop but load-bearing below 768px, where
               display:block strips the implicit table roles. See tables.css. -->
          <table class="table table-striped table-hover mb-0" role="table">
            <thead class="table-dark">
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Odontólogo</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <!-- svelte-ignore a11y-no-redundant-roles -->
            <tbody role="rowgroup">
              {#each filteredAppointments as appointment, index}
                <!-- svelte-ignore a11y-no-redundant-roles -->
                <tr role="row">
                  <td data-label="#" role="cell">{index + 1}</td>
                  <td data-label="Fecha" role="cell">{appointment.date || 'N/A'}</td>
                  <td data-label="Hora" role="cell">{appointment.time || 'N/A'}</td>
                  <td data-label="Paciente" role="cell">{getPatientName(appointment.patient_id)}</td>
                  <td data-label="Odontólogo" role="cell">{getDentistName(appointment.dentist_id)}</td>
                  <td data-label="Descripción" role="cell"><span class="cell-truncate">{appointment.description || ''}</span></td>
                  <td data-label="Estado" role="cell">
                    <span class="badge bg-success">{appointment.status || 'PROGRAMADA'}</span>
                  </td>
                  <td data-label="Acciones" role="cell" class="text-center">
                    <div class="d-flex justify-content-center gap-2">
                      <a href="/appointments/edit/{appointment.id}" class="btn btn-sm btn-outline-primary" title="Editar">
                        <i class="bi bi-pencil"></i>
                      </a>
                      <form method="POST" action="?/delete" on:submit|preventDefault={function(/** @type {any} */ e) {
                        if (confirm('¿Está seguro de que desea eliminar esta cita?')) {
                          e.target.submit();
                        }
                      }}>
                        <input type="hidden" name="id" value={appointment.id} />
                        <button type="submit" class="btn btn-sm btn-outline-danger" title="Eliminar">
                          <i class="bi bi-trash"></i>
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="text-center py-5">
          <i class="bi bi-calendar-event text-muted" style="font-size: 3rem"></i>
          <h5 class="text-muted mt-3">No se encontraron citas</h5>
          <p class="text-muted">Programe una cita o modifique su búsqueda.</p>
        </div>
      {/if}
    </div>
  </div>
</main>
