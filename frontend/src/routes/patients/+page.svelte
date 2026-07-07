<script>
  /** @type {import('./$types').PageData} */
  export var data;

  var searchQuery = '';

  $: filteredPatients = data.patients.filter(function(/** @type {any} */ patient) {
    var search = searchQuery.toLowerCase();
    var fullName = ((patient.firstName || '') + ' ' + (patient.lastName || '')).toLowerCase();
    var email = (patient.email || '').toLowerCase();
    var dni = (patient.cardIdentity || '').toString();
    return fullName.indexOf(search) !== -1 || email.indexOf(search) !== -1 || dni.indexOf(search) !== -1;
  });

  function clearSearch() {
    searchQuery = '';
  }
</script>

<svelte:head>
  <title>Lista de Pacientes | Dental Clinic</title>
</svelte:head>

<main class="main-content">
  <div class="container mt-4">
    <div class="content-card">
      <div class="patient-list-header d-flex justify-content-between align-items-center mb-4">
        <h1 class="patient-list-title">Lista de Pacientes</h1>
        <div class="d-flex gap-2">
          <input
            type="text"
            bind:value={searchQuery}
            class="form-control"
            placeholder="Buscar paciente..."
            style="width: 250px"
          />
          <button on:click={clearSearch} class="btn btn-outline-secondary" title="Limpiar búsqueda">
            <i class="bi bi-x-circle"></i>
          </button>
          <a href="/patients/add" class="btn btn-add-patient">
            <i class="bi bi-plus-circle me-2"></i>Agregar Paciente
          </a>
        </div>
      </div>

      {#if data.error}
        <div class="alert alert-danger">{data.error}</div>
      {/if}

      <!-- Tabla de pacientes -->
      {#if filteredPatients.length > 0}
        <div class="table-container">
          <table class="table table-striped table-hover mb-0">
            <thead class="table-dark">
              <tr>
                <th>#</th>
                <th>DNI</th>
                <th>Nombre Completo</th>
                <th>Email</th>
                <th>Fecha Admisión</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredPatients as patient, index}
                <tr>
                  <td>{index + 1}</td>
                  <td>{patient.cardIdentity || 'N/A'}</td>
                  <td>{patient.firstName} {patient.lastName}</td>
                  <td>{patient.email}</td>
                  <td>{patient.admissionDate || 'N/A'}</td>
                  <td class="text-center">
                    <div class="d-flex justify-content-center gap-2">
                      <a href="/patients/edit/{patient.id}" class="btn btn-sm btn-outline-primary" title="Editar">
                        <i class="bi bi-pencil"></i>
                      </a>
                      <form method="POST" action="?/delete" on:submit|preventDefault={function(/** @type {any} */ e) {
                        if (confirm('¿Está seguro de que desea eliminar al paciente ' + patient.firstName + ' ' + patient.lastName + '?')) {
                          e.target.submit();
                        }
                      }}>
                        <input type="hidden" name="id" value={patient.id} />
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
          <i class="bi bi-inbox text-muted" style="font-size: 3rem"></i>
          <h5 class="text-muted mt-3">No se encontraron pacientes</h5>
          <p class="text-muted">Agregue un paciente o modifique su búsqueda.</p>
        </div>
      {/if}
    </div>
  </div>
</main>
