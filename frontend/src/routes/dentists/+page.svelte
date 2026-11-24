<script>
  import ListPageHeader from "$lib/components/ListPageHeader.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";

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

  $: filteredDentists = data.dentists.filter(
    function (/** @type {any} */ dentist) {
      const search = searchQuery.toLowerCase();
      const fullName = (
        (dentist.firstName || "") +
        " " +
        (dentist.lastName || "")
      ).toLowerCase();
      const email = (dentist.email || "").toLowerCase();
      const reg = (dentist.registrationNumber || "").toString().toLowerCase();
      const specs = Array.isArray(dentist.specialties)
        ? dentist.specialties
            .map((/** @type {any} */ s) => s.name || "")
            .join(" ")
            .toLowerCase()
        : "";
      return (
        fullName.indexOf(search) !== -1 ||
        email.indexOf(search) !== -1 ||
        reg.indexOf(search) !== -1 ||
        specs.indexOf(search) !== -1
      );
    },
  );
</script>

<svelte:head>
  <title>Lista de Odontólogos | Dental Clinic</title>
</svelte:head>

<div class="main-content">
  <div class="container">
    <div class="content-card">
      <ListPageHeader
        title="Lista de Odontólogos"
        bind:searchQuery
        searchLabel="Buscar odontólogo"
        searchPlaceholder="Nombre, matrícula, email o especialidad..."
        resultCount={filteredDentists.length}
        addHref="/dentists/add"
        addLabel="Agregar Odontólogo"
        canAdd={data.user?.role === "ADMIN"}
      />

      {#if data.error}
        <div class="alert alert-danger">{data.error}</div>
      {/if}

      {#if form?.error}
        <!-- Surface the delete action's structured 409 (e.g. blocked deletion) -->
        <div class="alert alert-danger" role="alert">{form.error}</div>
      {/if}

      <!-- Tabla de odontólogos -->
      {#if filteredDentists.length > 0}
        <div class="table-container">
          <!-- svelte-ignore a11y-no-redundant-roles -->
          <!-- role is redundant on desktop but load-bearing below 768px, where
               display:block strips the implicit table roles. See tables.css. -->
          <table class="table table-striped table-hover mb-0" role="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Matrícula</th>
                <th scope="col">Nombre Completo</th>
                <th scope="col">Email</th>
                <th scope="col">Especialidades</th>
                <th scope="col" class="text-center">Acciones</th>
              </tr>
            </thead>
            <!-- svelte-ignore a11y-no-redundant-roles -->
            <tbody role="rowgroup">
              {#each filteredDentists as dentist, index (dentist.id ?? `idx-${index}`)}
                <!-- svelte-ignore a11y-no-redundant-roles -->
                <tr role="row">
                  <td data-label="#" role="cell">{index + 1}</td>
                  <td data-label="Matrícula" role="cell"
                    >{dentist.registrationNumber || "N/A"}</td
                  >
                  <td data-label="Nombre Completo" role="cell"
                    >{dentist.firstName} {dentist.lastName}</td
                  >
                  <td data-label="Email" role="cell">{dentist.email}</td>
                  <td data-label="Especialidades" role="cell">
                    {#if Array.isArray(dentist.specialties) && dentist.specialties.length > 0}
                      <div
                        class="d-flex flex-wrap gap-1 justify-content-end justify-content-md-start"
                      >
                        {#each dentist.specialties as specialty (specialty.id ?? specialty.name)}
                          <span class="badge status-scheduled">
                            {specialty.name}
                          </span>
                        {/each}
                      </div>
                    {:else}
                      <span class="text-token-muted">Sin especialidades</span>
                    {/if}
                  </td>
                  <td data-label="Acciones" role="cell" class="text-center">
                    <div class="d-flex justify-content-center gap-2">
                      {#if data.user?.role === "ADMIN" || (data.user?.role === "DENTIST" && dentist.id === data.user?.id)}
                        <a
                          href="/dentists/edit/{dentist.id}"
                          class="btn btn-sm btn-outline-primary"
                          title="Editar"
                          aria-label="Editar odontólogo {dentist.firstName} {dentist.lastName}"
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
                              `al odontólogo ${dentist.firstName} ${dentist.lastName}`,
                            )}
                        >
                          <input type="hidden" name="id" value={dentist.id} />
                          <button
                            type="submit"
                            class="btn btn-sm btn-danger-outline"
                            title="Eliminar"
                            aria-label="Eliminar odontólogo {dentist.firstName} {dentist.lastName}"
                          >
                            <i class="bi bi-trash" aria-hidden="true"></i>
                          </button>
                        </form>
                      {/if}
                      {#if data.user?.role !== "ADMIN" && !(data.user?.role === "DENTIST" && dentist.id === data.user?.id)}
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
          title="No se encontraron odontólogos"
          message="Agregá un odontólogo o modificá tu búsqueda."
        />
      {/if}
    </div>
  </div>
</div>

<ConfirmDialog
  open={!!pendingDelete}
  title="Eliminar odontólogo"
  message={pendingDelete
    ? `¿Querés eliminar ${pendingDelete.name}? Esta acción no se puede deshacer.`
    : ""}
  on:confirm={confirmDelete}
  on:cancel={() => (pendingDelete = null)}
/>
