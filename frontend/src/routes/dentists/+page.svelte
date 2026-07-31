<script>
  /** @type {import('./$types').PageData} */
  export var data;

  var searchQuery = '';

  $: filteredDentists = data.dentists.filter(function(/** @type {any} */ dentist) {
    var search = searchQuery.toLowerCase();
    var fullName = ((dentist.firstName || '') + ' ' + (dentist.lastName || '')).toLowerCase();
    var email = (dentist.email || '').toLowerCase();
    var reg = (dentist.registrationNumber || '').toString().toLowerCase();
    return fullName.indexOf(search) !== -1 || email.indexOf(search) !== -1 || reg.indexOf(search) !== -1;
  });

  function clearSearch() {
    searchQuery = '';
  }
</script>

<svelte:head>
  <title>Lista de Odontólogos | Dental Clinic</title>
</svelte:head>

<main class="main-content">
  <div class="container mt-4">
    <div class="content-card">
      <div class="patient-list-header d-flex justify-content-between align-items-center mb-4">
        <h1 class="patient-list-title">Lista de Odontólogos</h1>
        <div class="d-flex gap-2">
          <input
            type="text"
            bind:value={searchQuery}
            class="form-control list-search-input"
            placeholder="Buscar odontólogo..."
          />
          <button on:click={clearSearch} class="btn btn-outline-secondary" title="Limpiar búsqueda">
            <i class="bi bi-x-circle"></i>
          </button>
          <a href="/dentists/add" class="btn btn-add-patient">
            <i class="bi bi-plus-circle me-2"></i>Agregar Odontólogo
          </a>
        </div>
      </div>

      {#if data.error}
        <div class="alert alert-danger">{data.error}</div>
      {/if}

      <!-- Tabla de odontólogos -->
      {#if filteredDentists.length > 0}
        <div class="table-container">
          <!-- svelte-ignore a11y-no-redundant-roles -->
          <!-- role is redundant on desktop but load-bearing below 768px, where
               display:block strips the implicit table roles. See tables.css. -->
          <table class="table table-striped table-hover mb-0" role="table">
            <thead class="table-dark">
              <tr>
                <th>#</th>
                <th>Matrícula</th>
                <th>Nombre Completo</th>
                <th>Email</th>
                <th class="text-center">Acciones</th>
              </tr>
            </thead>
            <!-- svelte-ignore a11y-no-redundant-roles -->
            <tbody role="rowgroup">
              {#each filteredDentists as dentist, index}
                <!-- svelte-ignore a11y-no-redundant-roles -->
                <tr role="row">
                  <td data-label="#" role="cell">{index + 1}</td>
                  <td data-label="Matrícula" role="cell">{dentist.registrationNumber || 'N/A'}</td>
                  <td data-label="Nombre Completo" role="cell">{dentist.firstName} {dentist.lastName}</td>
                  <td data-label="Email" role="cell">{dentist.email}</td>
                  <td data-label="Acciones" role="cell" class="text-center">
                    <div class="d-flex justify-content-center gap-2">
                      <a href="/dentists/edit/{dentist.id}" class="btn btn-sm btn-outline-primary" title="Editar">
                        <i class="bi bi-pencil"></i>
                      </a>
                      <form method="POST" action="?/delete" on:submit|preventDefault={function(/** @type {any} */ e) {
                        if (confirm('¿Está seguro de que desea eliminar al odontólogo ' + dentist.firstName + ' ' + dentist.lastName + '?')) {
                          e.target.submit();
                        }
                      }}>
                        <input type="hidden" name="id" value={dentist.id} />
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
          <h5 class="text-muted mt-3">No se encontraron odontólogos</h5>
          <p class="text-muted">Agregue un odontólogo o modifique su búsqueda.</p>
        </div>
      {/if}
    </div>
  </div>
</main>
