<script>
  import { onMount, onDestroy } from "svelte";
  import { invalidateAll } from "$app/navigation";
  import {
    loadUPlot,
    createMonthlyLineChart,
    createStatusChart,
    createDentistChart,
  } from "$lib/charts/dashboardCharts.js";
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

  /**
   * @param {any} id
   * @param {any} newStatus
   */
  async function updateStatus(id, newStatus) {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("status", newStatus);

    try {
      const res = await fetch("?/updateStatus", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await invalidateAll();
      } else {
        alert("Error al actualizar el estado");
      }
    } catch (e) {
      alert("Error al actualizar el estado");
    }
  }

  async function handleRefresh() {
    await invalidateAll();
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
    exportAppointmentsCsv(snapshot?.upcomingAppointments || []);
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
          <div class="card border-0 shadow-sm bg-primary text-white">
            <div class="card-body d-flex align-items-center">
              <div class="flex-grow-1">
                <h4 class="mb-0">{snapshot.totalAppointments || 0}</h4>
                <p class="mb-0">Total Citas</p>
              </div>
              <div class="ms-3">
                <i class="bi bi-calendar-check fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-3 col-md-6 mb-4">
          <div class="card border-0 shadow-sm bg-success text-white">
            <div class="card-body d-flex align-items-center">
              <div class="flex-grow-1">
                <h4 class="mb-0">{snapshot.totalDentists || 0}</h4>
                <p class="mb-0">Dentistas</p>
              </div>
              <div class="ms-3">
                <i class="bi bi-person-badge fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-3 col-md-6 mb-4">
          <div class="card border-0 shadow-sm bg-info text-white">
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
          <div class="card border-0 shadow-sm bg-warning text-white">
            <div class="card-body d-flex align-items-center">
              <div class="flex-grow-1">
                <h4 class="mb-0">{snapshot.todayAppointments || 0}</h4>
                <p class="mb-0">Citas Hoy</p>
              </div>
              <div class="ms-3">
                <i class="bi bi-calendar-event fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sección de Gráficos y Próximas Citas -->
      <div class="row">
        <!-- Gráfico de Citas por Mes -->
        <div class="col-lg-8 mb-4">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-white border-bottom">
              <h5 class="card-title mb-0">
                <i class="bi bi-bar-chart-line text-info me-2"></i>
                Citas por Mes
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

        <!-- Próximas Citas -->
        <div class="col-lg-4 mb-4">
          <div class="card shadow-sm border-0">
            <div class="card-header bg-white border-bottom">
              <h5 class="card-title mb-0">
                <i class="bi bi-clock text-warning me-2"></i>
                Próximas citas
              </h5>
            </div>
            <div class="card-body p-0">
              <div
                id="upcoming-appointments"
                style="max-height: 350px; overflow-y: auto"
              >
                {#if snapshot.upcomingAppointments && snapshot.upcomingAppointments.length > 0}
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
                            <li>
                              <button
                                class="dropdown-item change-status"
                                on:click={() =>
                                  updateStatus(appointment.id, "IN_PROGRESS")}
                                >Marcar en progreso</button
                              >
                            </li>
                            <li>
                              <button
                                class="dropdown-item change-status"
                                on:click={() =>
                                  updateStatus(appointment.id, "COMPLETED")}
                                >Marcar completada</button
                              >
                            </li>
                            <li>
                              <button
                                class="dropdown-item change-status text-danger"
                                on:click={() =>
                                  updateStatus(appointment.id, "CANCELLED")}
                                >Cancelar</button
                              >
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  {/each}
                {:else}
                  <div class="text-center p-4">
                    <i class="bi bi-calendar-x text-muted fs-1 mb-3"></i>
                    <p class="text-muted">No hay citas próximas</p>
                  </div>
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
                Citas por Estado
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
                Citas por Odontólogo
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
