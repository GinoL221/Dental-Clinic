<script>
  import ListPageHeader from "$lib/components/ListPageHeader.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";

  /** @type {import('./$types').PageData} */
  export let data;
  /** @type {import('./$types').ActionData} */
  export let form;

  let searchQuery = "";

  $: filteredPatients = data.patients.filter(
    function (/** @type {any} */ patient) {
      const search = searchQuery.toLowerCase();
      const fullName = (
        (patient.firstName || "") +
        " " +
        (patient.lastName || "")
      ).toLowerCase();
      const email = (patient.email || "").toLowerCase();
      const dni = (patient.cardIdentity || "").toString();
      return (
        fullName.indexOf(search) !== -1 ||
        email.indexOf(search) !== -1 ||
        dni.indexOf(search) !== -1
      );
    },
  );
</script>

<svelte:head>
  <title>Lista de Pacientes | Dental Clinic</title>
</svelte:head>

<main class="main-content">
  <div class="container mt-4">
    <div class="content-card">
      <ListPageHeader
        title="Lista de Pacientes"
        bind:searchQuery
        searchPlaceholder="Buscar paciente..."
        addHref="/patients/add"
        addLabel="Agregar Paciente"
        canAdd={data.user?.role === "ADMIN"}
      />

      {#if data.error}
        <div class="alert alert-danger">{data.error}</div>
      {/if}

      {#if form?.error}
        <!-- Surface the delete action's structured 409 (e.g. blocked deletion) -->
        <div class="alert alert-danger" role="alert">{form.error}</div>
      {/if}

      <!-- Tabla de pacientes -->
      {#if filteredPatients.length > 0}
        <div class="table-container">
          <!-- svelte-ignore a11y-no-redundant-roles -->
          <!-- role is redundant on desktop but load-bearing below 768px, where
               display:block strips the implicit table roles. See tables.css. -->
          <table class="table table-striped table-hover mb-0" role="table">
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
            <!-- svelte-ignore a11y-no-redundant-roles -->
            <tbody role="rowgroup">
              {#each filteredPatients as patient, index}
                <!-- svelte-ignore a11y-no-redundant-roles -->
                <tr role="row">
                  <td data-label="#" role="cell">{index + 1}</td>
                  <td data-label="DNI" role="cell"
                    >{patient.cardIdentity || "N/A"}</td
                  >
                  <td data-label="Nombre Completo" role="cell"
                    >{patient.firstName} {patient.lastName}</td
                  >
                  <td data-label="Email" role="cell">{patient.email}</td>
                  <td data-label="Fecha Admisión" role="cell"
                    >{patient.admissionDate || "N/A"}</td
                  >
                  <td data-label="Acciones" role="cell" class="text-center">
                    <div class="d-flex justify-content-center gap-2">
                      {#if data.user?.role === "ADMIN"}
                        <a
                          href="/patients/edit/{patient.id}"
                          class="btn btn-sm btn-outline-primary"
                          title="Editar"
                          aria-label="Editar paciente {patient.firstName} {patient.lastName}"
                        >
                          <i class="bi bi-pencil"></i>
                        </a>
                        <form
                          method="POST"
                          action="?/delete"
                          on:submit|preventDefault={function (
                            /** @type {any} */ e,
                          ) {
                            if (
                              confirm(
                                "¿Está seguro de que desea eliminar al paciente " +
                                  patient.firstName +
                                  " " +
                                  patient.lastName +
                                  "?",
                              )
                            ) {
                              e.target.submit();
                            }
                          }}
                        >
                          <input type="hidden" name="id" value={patient.id} />
                          <button
                            type="submit"
                            class="btn btn-sm btn-outline-danger"
                            title="Eliminar"
                            aria-label="Eliminar paciente {patient.firstName} {patient.lastName}"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </form>
                      {:else}
                        <span class="text-muted small">—</span>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <EmptyState
          title="No se encontraron pacientes"
          message="Agregá un paciente o modificá tu búsqueda."
        />
      {/if}
    </div>
  </div>
</main>
