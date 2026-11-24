<script>
  import ListPageHeader from "$lib/components/ListPageHeader.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import {
    getStatusClass,
    getStatusLabel,
    resolvePatientName,
  } from "$lib/utils/formatters.js";

  /** @type {import('./$types').PageData} */
  export let data;
  /** @type {import('./$types').ActionData} */
  export let form;

  let searchQuery = "";

  /** @type {{ form: HTMLFormElement; name: string } | null} */
  let pendingDelete = null;

  /**
   * Opens the in-page confirm dialog instead of the browser's confirm()
   * (design.md §6.1).
   * @param {any} event
   * @param {string} name
   */
  function requestDelete(event, name) {
    pendingDelete = { form: event.currentTarget, name };
  }

  function confirmDelete() {
    const pending = pendingDelete;
    pendingDelete = null;
    if (pending) pending.form.submit();
  }

  function getPatientName(/** @type {any} */ patientId) {
    return resolvePatientName(patientId, data.patients, data.user);
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
  <title>Lista de Turnos | Dental Clinic</title>
</svelte:head>

<div class="main-content">
  <div class="container">
    <div class="content-card">
      <ListPageHeader
        title="Lista de Turnos"
        bind:searchQuery
        searchLabel="Buscar turno"
        searchPlaceholder="Paciente, odontólogo, fecha o descripción..."
        resultCount={filteredAppointments.length}
        addHref="/appointments/add"
        addLabel="Programar Turno"
        canAdd={true}
      />

      {#if data.error}
        <div class="alert alert-danger">{data.error}</div>
      {/if}

      {#if form?.error}
        <div class="alert alert-danger" role="alert">{form.error}</div>
      {/if}

      <!-- Tabla de citas -->
      {#if filteredAppointments.length > 0}
        <div class="table-container">
          <!-- svelte-ignore a11y-no-redundant-roles -->
          <!-- role is redundant on desktop but load-bearing below 768px, where
               display:block strips the implicit table roles. See tables.css. -->
          <table class="table table-striped table-hover mb-0" role="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Fecha</th>
                <th scope="col">Hora</th>
                <th scope="col">Paciente</th>
                <th scope="col">Odontólogo</th>
                <th scope="col">Descripción</th>
                <th scope="col">Estado</th>
                <th scope="col" class="text-center">Acciones</th>
              </tr>
            </thead>
            <!-- svelte-ignore a11y-no-redundant-roles -->
            <tbody role="rowgroup">
              {#each filteredAppointments as appointment, index (appointment.id ?? `idx-${index}`)}
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
                      >{getStatusLabel(appointment.status) ||
                        "Programada"}</span
                    >
                  </td>
                  <td data-label="Acciones" role="cell" class="text-center">
                    <div class="d-flex justify-content-center gap-2">
                      {#if data.user?.role === "ADMIN" || (data.user?.role === "DENTIST" && appointment.dentistId === data.user?.id)}
                        <a
                          href="/appointments/edit/{appointment.id}"
                          class="btn btn-sm btn-outline-primary"
                          title="Editar"
                          aria-label="Editar turno de {getPatientName(
                            appointment.patientId,
                          )}"
                        >
                          <i class="bi bi-pencil" aria-hidden="true"></i>
                        </a>
                      {/if}
                      {#if data.user?.role === "ADMIN"}
                        <form
                          method="POST"
                          action="?/delete"
                          on:submit|preventDefault={(e) =>
                            requestDelete(
                              e,
                              `el turno de ${getPatientName(appointment.patientId)}`,
                            )}
                        >
                          <input
                            type="hidden"
                            name="id"
                            value={appointment.id}
                          />
                          <button
                            type="submit"
                            class="btn btn-sm btn-danger-outline"
                            title="Eliminar"
                            aria-label="Eliminar turno de {getPatientName(
                              appointment.patientId,
                            )}"
                          >
                            <i class="bi bi-trash" aria-hidden="true"></i>
                          </button>
                        </form>
                      {/if}
                      {#if data.user?.role !== "ADMIN" && !(data.user?.role === "DENTIST" && appointment.dentistId === data.user?.id)}
                        <span class="text-token-muted">—</span>
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
          title="No se encontraron turnos"
          message="Programá un turno o modificá tu búsqueda."
          icon="bi-calendar-event"
        />
      {/if}
    </div>
  </div>
</div>

<ConfirmDialog
  open={!!pendingDelete}
  title="Eliminar turno"
  message={pendingDelete
    ? `¿Querés eliminar ${pendingDelete.name}? Esta acción no se puede deshacer.`
    : ""}
  on:confirm={confirmDelete}
  on:cancel={() => (pendingDelete = null)}
/>
