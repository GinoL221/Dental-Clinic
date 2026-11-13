<script>
  import { onMount, onDestroy } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import { deserialize } from "$app/forms";
  import {
    loadUPlot,
    createMonthlyLineChart,
    createStatusChart,
    createDentistChart,
  } from "$lib/charts/dashboardCharts.js";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import ConfirmDialog from "$lib/utils/ConfirmDialog.svelte";
  import { validTransitions } from "$lib/utils/statusMachine.js";
  import {
    formatLocalDate,
    getStatusLabel,
    getStatusClass,
    exportAppointmentsCsv,
  } from "$lib/utils/formatters.js";
  /** @type {import('./$types').PageData} */
  export let data;
  $: snapshot = data.snapshot;
  $: errorMsg = data.error;
  $: dentists = data.dentists || [];
  $: filters = data.filters || { from: null, to: null, dentistId: null };
  $: filterError = data.filterError;
  $: statusBreakdown = snapshot?.statusBreakdown || [];
  $: dentistBreakdown = snapshot?.dentistBreakdown || [];

  /** @type {HTMLElement} */
  let chartContainer;
  /** @type {HTMLElement} */
  let statusChartContainer;
  /** @type {HTMLElement} */
  let dentistChartContainer;
  /** @type {any} */
  let chart;
  /** @type {any} */
  let statusChart;
  /** @type {any} */
  let dentistChart;
  /** @type {(() => void) | null} */
  let resizeHandler;
  let currentDateString = "";

  /** Loading flag for the dashboard's own client-side refetch flows
   *  (status change + manual refresh). Drives the skeleton rows and
   *  aria-busy on the upcoming-appointments list (design.md §6.1). */
  let loading = false;
  /** @type {string | null} */
  let statusError = null;
  /** @type {string | null} */
  let statusSuccess = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let successTimer = null;
  /** @type {{ id: any; patientName: string; status: string; label: string } | null} */
  let pendingStatusChange = null;

  /** @type {Record<string, string>} */
  const STATUS_ACTION_LABELS = {
    IN_PROGRESS: "Marcar en progreso",
    COMPLETED: "Marcar completada",
    CANCELLED: "Cancelar",
  };

  /**
   * @param {string} status
   * @returns {string}
   */
  function statusActionLabel(status) {
    return STATUS_ACTION_LABELS[status] || getStatusLabel(status);
  }

  /**
   * Opens the confirmation dialog instead of mutating immediately
   * (design.md §6.1: own dialog, not the browser's).
   * @param {any} appointment
   * @param {string} status
   */
  function requestStatusChange(appointment, status) {
    pendingStatusChange = {
      id: appointment.id,
      patientName: appointment.patientName,
      status,
      label: statusActionLabel(status),
    };
  }

  async function confirmStatusChange() {
    const pending = pendingStatusChange;
    pendingStatusChange = null;
    if (!pending) return;
    await updateStatus(pending.id, pending.status);
  }

  /**
   * @param {string} message
   */
  function showSuccess(message) {
    statusSuccess = message;
    if (successTimer) clearTimeout(successTimer);
    // design.md §6.4: success feedback dismisses itself after 6 s.
    successTimer = setTimeout(() => {
      statusSuccess = null;
    }, 6000);
  }

  /**
   * @param {any} id
   * @param {string} newStatus
   */
  async function updateStatus(id, newStatus) {
    loading = true;
    statusError = null;
    const formData = new FormData();
    formData.append("id", id);
    formData.append("status", newStatus);

    try {
      const res = await fetch("?/updateStatus", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      const result = await res.json().catch(() => null);
      const actionData = result?.data
        ? /** @type {any} */ (deserialize(result.data))
        : {};
      if (
        result &&
        (result.type === "success" || result.type === "failure") &&
        actionData.success !== false &&
        result.type !== "failure"
      ) {
        showSuccess("Estado del turno actualizado");
        await invalidateAll();
      } else {
        // Graceful handling of a losing race (backend 409 on an invalid
        // transition): the action returns the backend's Spanish message.
        statusError =
          actionData.error || "Error al actualizar el estado del turno";
      }
    } catch (e) {
      statusError = "Error al actualizar el estado del turno";
    } finally {
      loading = false;
    }
  }

  async function handleRefresh() {
    loading = true;
    try {
      await invalidateAll();
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    // Current date display
    const now = new Date();
    /** @type {Intl.DateTimeFormatOptions} */
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    currentDateString = now.toLocaleDateString("es-ES", options);

    await loadUPlot();
    ensureResizeHandler();
    renderCharts();
  });

  function ensureResizeHandler() {
    if (resizeHandler) return;
    resizeHandler = () => {
      if (chart && chartContainer) {
        chart.setSize({
          width: chartContainer.clientWidth || 600,
          height: 350,
        });
      }
      if (statusChart && statusChartContainer) {
        statusChart.setSize({
          width: statusChartContainer.clientWidth || 600,
          height: 350,
        });
      }
      if (dentistChart && dentistChartContainer) {
        dentistChart.setSize({
          width: dentistChartContainer.clientWidth || 600,
          height: 350,
        });
      }
    };
    window.addEventListener("resize", resizeHandler);
  }

  function renderCharts() {
    renderMonthlyChart();
    renderStatusChart();
    renderDentistChart();
  }

  function renderMonthlyChart() {
    if (chart) {
      try {
        chart.destroy();
      } catch (e) {}
      chart = null;
    }
    if (chartContainer) {
      chart = createMonthlyLineChart(chartContainer, snapshot?.monthlyStats);
    }
  }

  function renderStatusChart() {
    if (statusChart) {
      try {
        statusChart.destroy();
      } catch (e) {}
      statusChart = null;
    }
    if (statusChartContainer) {
      statusChart = createStatusChart(
        statusChartContainer,
        statusBreakdown,
        getStatusLabel,
      );
    }
  }

  function renderDentistChart() {
    if (dentistChart) {
      try {
        dentistChart.destroy();
      } catch (e) {}
      dentistChart = null;
    }
    if (dentistChartContainer) {
      dentistChart = createDentistChart(
        dentistChartContainer,
        dentistBreakdown,
      );
    }
  }

  // Re-render every chart whenever the (possibly filtered) snapshot changes.
  $: if (snapshot && chartContainer) renderMonthlyChart();
  $: if (snapshot && statusChartContainer) renderStatusChart();
  $: if (snapshot && dentistChartContainer) renderDentistChart();

  onDestroy(() => {
    if (successTimer) {
      clearTimeout(successTimer);
      successTimer = null;
    }
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }
    [chart, statusChart, dentistChart].forEach(
      (/** @type {any} */ instance) => {
        if (instance) {
          try {
            instance.destroy();
          } catch (e) {}
        }
      },
    );
    chart = null;
    statusChart = null;
    dentistChart = null;
  });

  function exportCsv() {
    if (!exportAppointmentsCsv(snapshot?.upcomingAppointments || [])) {
      statusError = "No hay datos para exportar";
    }
  }
</script>

<svelte:head>
  <title>Dashboard - Clínica Dental</title>
  <link rel="stylesheet" href="/css/lib/uPlot.min.css" />
</svelte:head>

<div class="container-fluid">
  <div class="row">
    <div class="col-12">
      <!-- Título del Dashboard -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="h3 mb-0">
          <i class="bi bi-speedometer2 text-primary me-2"></i>
          Dashboard
        </h2>
        <small class="text-muted">
          <i class="bi bi-calendar3"></i>
          <span>{currentDateString}</span>
        </small>
      </div>

      <!-- Feedback del cambio de estado (design.md §6.4: alerta bajo el
           título; el éxito se descarta solo a los 6 s, el error persiste) -->
      {#if statusError}
        <div id="status-error" class="alert alert-danger mb-3" role="alert">
          <i class="bi bi-exclamation-triangle me-2"></i>
          <span>{statusError}</span>
        </div>
      {/if}
      {#if statusSuccess}
        <div class="alert alert-success mb-3" role="status">
          <i class="bi bi-check-circle me-2"></i>
          <span>{statusSuccess}</span>
        </div>
      {/if}

      <!-- Controles: refrescar y exportar -->
      <div class="d-flex gap-2 align-items-center mb-3">
        <button on:click={handleRefresh} class="btn btn-sm btn-outline-primary">
          🔁 Refrescar
        </button>
        <button on:click={exportCsv} class="btn btn-sm btn-outline-secondary">
          ⬇️ Exportar CSV
        </button>
      </div>

      <!-- Error de validación de filtros -->
      {#if filterError}
        <div id="filter-error" class="alert alert-warning" role="alert">
          <i class="bi bi-exclamation-circle me-2"></i>
          <span>{filterError}</span>
        </div>
      {/if}

      <!-- Barra de filtros -->
      <form method="GET" id="dashboard-filters" class="filter-bar mb-4">
        <div class="filter-bar-field">
          <label for="filter-from" class="form-label">Desde</label>
          <input
            type="date"
            id="filter-from"
            name="from"
            class="form-control form-control-sm"
            value={filters.from ?? ""}
            aria-invalid={filterError ? "true" : "false"}
            aria-describedby={filterError ? "filter-error" : undefined}
          />
        </div>
        <div class="filter-bar-field">
          <label for="filter-to" class="form-label">Hasta</label>
          <input
            type="date"
            id="filter-to"
            name="to"
            class="form-control form-control-sm"
            value={filters.to ?? ""}
            aria-invalid={filterError ? "true" : "false"}
            aria-describedby={filterError ? "filter-error" : undefined}
          />
        </div>
        <div class="filter-bar-field">
          <label for="filter-dentist" class="form-label">Odontólogo</label>
          <select
            id="filter-dentist"
            name="dentistId"
            class="form-select form-select-sm"
            aria-invalid={filterError ? "true" : "false"}
            aria-describedby={filterError ? "filter-error" : undefined}
          >
            <option value="" selected={!filters.dentistId}>Todos</option>
            {#each dentists as dentist}
              <option
                value={dentist.id}
                selected={String(dentist.id) ===
                  String(filters.dentistId ?? "")}
              >
                {dentist.firstName}
                {dentist.lastName}
              </option>
            {/each}
          </select>
        </div>
        <div class="filter-bar-actions">
          <button
            type="submit"
            id="apply-filters"
            class="btn btn-sm btn-primary"
          >
            Filtrar
          </button>
          <a href="/dashboard" class="btn btn-sm btn-outline-secondary"
            >Limpiar</a
          >
        </div>
      </form>

      <!-- Tarjetas de Estadísticas -->
      <div class="row mb-4" id="stats-cards">
        <div class="col-lg-3 col-md-6 mb-4">
          <div class="card border-0 shadow-sm stat-card stat-card-total">
            <div class="card-body d-flex align-items-center">
              <div class="flex-grow-1">
                <h4 class="mb-0">{snapshot.totalAppointments || 0}</h4>
                <p class="mb-0">Total turnos</p>
              </div>
              <div class="ms-3">
                <i class="bi bi-calendar-check fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-3 col-md-6 mb-4">
          <div class="card border-0 shadow-sm stat-card stat-card-dentists">
            <div class="card-body d-flex align-items-center">
              <div class="flex-grow-1">
                <h4 class="mb-0">{snapshot.totalDentists || 0}</h4>
                <p class="mb-0">Odontólogos</p>
              </div>
              <div class="ms-3">
                <i class="bi bi-person-badge fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-3 col-md-6 mb-4">
          <div class="card border-0 shadow-sm stat-card stat-card-patients">
            <div class="card-body d-flex align-items-center">
              <div class="flex-grow-1">
                <h4 class="mb-0">{snapshot.totalPatients || 0}</h4>
                <p class="mb-0">Pacientes</p>
              </div>
              <div class="ms-3">
                <i class="bi bi-people fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-3 col-md-6 mb-4">
          <div class="card border-0 shadow-sm stat-card stat-card-today">
            <div class="card-body d-flex align-items-center">
              <div class="flex-grow-1">
                <h4 class="mb-0">{snapshot.todayAppointments || 0}</h4>
                <p class="mb-0">Turnos hoy</p>
              </div>
              <div class="ms-3">
                <i class="bi bi-calendar-event fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sección de Gráficos y Próximos Turnos -->
      <div class="row">
        <!-- Gráfico de Turnos por Mes -->
        <div class="col-lg-8 mb-4">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-white border-bottom">
              <h5 class="card-title mb-0">
                <i class="bi bi-bar-chart-line text-info me-2"></i>
                Turnos por mes
              </h5>
            </div>
            <div class="card-body">
              <div
                bind:this={chartContainer}
                id="appointmentsChart"
                style="height: 350px; max-height: 350px"
              ></div>
            </div>
          </div>
        </div>

        <!-- Próximos Turnos -->
        <div class="col-lg-4 mb-4">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-white border-bottom">
              <h5 class="card-title mb-0">
                <i class="bi bi-clock text-warning me-2"></i>
                Próximos turnos
              </h5>
            </div>
            <div class="card-body p-0">
              <div
                id="upcoming-appointments"
                style="max-height: 350px; overflow-y: auto"
                aria-busy={loading ? "true" : "false"}
              >
                {#if loading}
                  <!-- Skeleton rows (design.md §6.1 «cargando (esqueleto de
                       filas)») while a client-side refetch runs -->
                  {#each [0, 1, 2] as _row}
                    <div class="skeleton-row" aria-hidden="true">
                      <div class="skeleton-line skeleton-line-name"></div>
                      <div class="skeleton-line skeleton-line-meta"></div>
                      <div class="skeleton-line skeleton-line-chip"></div>
                    </div>
                  {/each}
                {:else if snapshot.upcomingAppointments && snapshot.upcomingAppointments.length > 0}
                  {#each snapshot.upcomingAppointments as appointment}
                    <div
                      class="d-flex align-items-center p-3 border-bottom appointment-item"
                      data-id={appointment.id}
                    >
                      <div class="flex-grow-1">
                        <h6 class="mb-1">{appointment.patientName}</h6>
                        <small class="text-muted"
                          >Dr/a. {appointment.dentistName}</small
                        >
                        <div class="mt-1">
                          <small class="badge bg-light text-dark">
                            <i class="bi bi-clock me-1"></i>{appointment.time}
                          </small>
                          <small class="badge bg-primary ms-1">
                            <i class="bi bi-calendar3 me-1"
                            ></i>{formatLocalDate(appointment.date)}
                          </small>
                          <small
                            class="badge ms-1 {getStatusClass(
                              appointment.status,
                            )} appointment-status"
                          >
                            {getStatusLabel(appointment.status)}
                          </small>
                        </div>
                      </div>
                      <div
                        class="ms-2 d-flex align-items-center gap-2 appointment-actions"
                      >
                        <a
                          href="/appointments/edit/{appointment.id}"
                          class="btn btn-sm btn-outline-primary"
                          aria-label="Editar turno de {appointment.patientName}"
                        >
                          <i class="bi bi-pencil"></i>
                        </a>
                        {#if validTransitions(appointment.status).length > 0}
                          <div class="dropdown appointment-status-dropdown">
                            <button
                              class="btn btn-sm btn-outline-secondary dropdown-toggle appointment-status-btn"
                              type="button"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              Estado
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                              {#each validTransitions(appointment.status) as option}
                                <li>
                                  <button
                                    class="dropdown-item change-status {option ===
                                    'CANCELLED'
                                      ? 'text-danger'
                                      : ''}"
                                    on:click={() =>
                                      requestStatusChange(appointment, option)}
                                    >{statusActionLabel(option)}</button
                                  >
                                </li>
                              {/each}
                            </ul>
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/each}
                {:else}
                  <EmptyState
                    title="No hay turnos próximos"
                    message="Los turnos programados aparecerán aquí."
                    icon="bi-calendar-x"
                  />
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Desgloses: por estado y por odontólogo -->
      <div class="row chart-grid">
        <div class="col-lg-6 mb-4">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-white border-bottom">
              <h5 class="card-title mb-0">
                <i class="bi bi-pie-chart text-info me-2"></i>
                Turnos por estado
              </h5>
            </div>
            <div class="card-body position-relative">
              <div
                bind:this={statusChartContainer}
                id="statusChart"
                class="chart-container"
                style="height: 350px; max-height: 350px; display: {statusBreakdown.length
                  ? 'block'
                  : 'none'}"
              ></div>
              {#if !statusBreakdown.length}
                <div class="chart-empty" id="statusChart-empty">
                  <i class="bi bi-bar-chart text-muted fs-1 mb-2"></i>
                  <p class="text-muted mb-0">No hay datos para mostrar</p>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <div class="col-lg-6 mb-4">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-white border-bottom">
              <h5 class="card-title mb-0">
                <i class="bi bi-person-badge text-success me-2"></i>
                Turnos por odontólogo
              </h5>
            </div>
            <div class="card-body position-relative">
              <div
                bind:this={dentistChartContainer}
                id="dentistChart"
                class="chart-container"
                style="height: 350px; max-height: 350px; display: {dentistBreakdown.length
                  ? 'block'
                  : 'none'}"
              ></div>
              {#if !dentistBreakdown.length}
                <div class="chart-empty" id="dentistChart-empty">
                  <i class="bi bi-bar-chart text-muted fs-1 mb-2"></i>
                  <p class="text-muted mb-0">No hay datos para mostrar</p>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Mensaje de Error -->
      {#if errorMsg}
        <div id="error-message" class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          <span>{errorMsg}</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<ConfirmDialog
  open={!!pendingStatusChange}
  title="Cambiar estado del turno"
  message={pendingStatusChange
    ? `¿Marcar el turno de ${pendingStatusChange.patientName} como «${pendingStatusChange.label}»?`
    : ""}
  confirmLabel="Confirmar"
  cancelLabel="Cancelar"
  on:confirm={confirmStatusChange}
  on:cancel={() => (pendingStatusChange = null)}
/>
