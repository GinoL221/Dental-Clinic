<script>
  import ListPageHeader from "$lib/components/ListPageHeader.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import { getStatusClass } from "$lib/utils/formatters.js";

  /** @type {import('./$types').PageData} */
  export let data;

  let searchQuery = "";

  function getPatientName(/** @type {any} */ patientId) {
    const patient = data.patients.find(function (/** @type {any} */ p) {
      return p.id === patientId;
    });
    return patient
      ? patient.firstName + " " + patient.lastName
      : "Paciente #" + patientId;
  }

  function getDentistName(/** @type {any} */ dentistId) {
    const dentist = data.dentists.find(function (/** @type {any} */ d) {
      return d.id === dentistId;
    });
    return dentist
      ? "Dr/a. " + dentist.firstName + " " + dentist.lastName
      : "Odontólogo #" + dentistId;
  }

  $: filteredAppointments = data.appointments.filter(
    function (/** @type {any} */ appointment) {
      const search = searchQuery.toLowerCase();
      const patientName = getPatientName(appointment.patientId).toLowerCase();
      const dentistName = getDentistName(appointment.dentistId).toLowerCase();
      const desc = (appointment.description || "").toLowerCase();
      const date = (appointment.date || "").toLowerCase();
      return (
        patientName.indexOf(search) !== -1 ||
        dentistName.indexOf(search) !== -1 ||
        desc.indexOf(search) !== -1 ||
        date.indexOf(search) !== -1
      );
    },
  );
</script>

<svelte:head>
  <title>Lista de Citas | Dental Clinic</title>
</svelte:head>

<main class="main-content">
  <div class="container mt-4">
    <div class="content-card">
      <ListPageHeader
        title="Lista de Citas"
        bind:searchQuery
        searchPlaceholder="Buscar cita..."
        addHref="/appointments/add"
        addLabel="Programar Cita"
        canAdd={true}
      />

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
                  <td data-label="Fecha" role="cell"
                    >{appointment.date || "N/A"}</td
                  >
                  <td data-label="Hora" role="cell"
                    >{appointment.time || "N/A"}</td
                  >
                  <td data-label="Paciente" role="cell"
                    >{getPatientName(appointment.patientId)}</td
                  >
                  <td data-label="Odontólogo" role="cell"
                    >{getDentistName(appointment.dentistId)}</td
                  >
                  <td data-label="Descripción" role="cell"
                    ><span class="cell-truncate"
                      >{appointment.description || ""}</span
                    ></td
                  >
                  <td data-label="Estado" role="cell">
                    <span class="badge {getStatusClass(appointment.status)}"
                      >{appointment.status || "PROGRAMADA"}</span
                    >
                  </td>
                  <td data-label="Acciones" role="cell" class="text-center">
                    <div class="d-flex justify-content-center gap-2">
                      {#if data.user?.role === "ADMIN" || (data.user?.role === "DENTIST" && appointment.dentistId === data.user?.id)}
                        <a
                          href="/appointments/edit/{appointment.id}"
                          class="btn btn-sm btn-outline-primary"
                          title="Editar"
                          aria-label="Editar cita #{appointment.id}"
                        >
                          <i class="bi bi-pencil"></i>
                        </a>
                      {/if}
                      {#if data.user?.role === "ADMIN"}
                        <form
                          method="POST"
                          action="?/delete"
                          on:submit|preventDefault={function (
                            /** @type {any} */ e,
                          ) {
                            if (
                              confirm(
                                "¿Está seguro de que desea eliminar esta cita?",
                              )
                            ) {
                              e.target.submit();
                            }
                          }}
                        >
                          <input
                            type="hidden"
                            name="id"
                            value={appointment.id}
                          />
                          <button
                            type="submit"
                            class="btn btn-sm btn-outline-danger"
                            title="Eliminar"
                            aria-label="Eliminar cita #{appointment.id}"
                          >
                            <i class="bi bi-trash"></i>
                          </button>
                        </form>
                      {/if}
                      {#if data.user?.role !== "ADMIN" && !(data.user?.role === "DENTIST" && appointment.dentistId === data.user?.id)}
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
          title="No se encontraron citas"
          message="Programe una cita o modifique su búsqueda."
          icon="bi-calendar-event"
        />
      {/if}
    </div>
  </div>
</main>
