<script>
  import { onMount, onDestroy } from 'svelte';
  import { invalidateAll } from '$app/navigation';

  /** @type {import('./$types').PageData} */
  export let data;
  $: snapshot = data.snapshot;
  $: errorMsg = data.error;

  /** @type {HTMLElement} */
  let chartContainer;
  /** @type {uPlot | null} */
  let chart;
  /** @type {Record<number, string>} */
  let chartLabelMap = {};
  let resizeHandler;
  let currentDateString = '';

  /**
   * @param {string | null | undefined} dateString
   * @returns {string}
   */
  function formatLocalDate(dateString) {
    if (!dateString) return '';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch (e) {}
    return dateString;
  }

  /**
   * @param {string} status
   * @returns {string}
   */
  function getStatusLabel(status) {
    const STATUS_LABELS = {
      SCHEDULED: 'Programada',
      IN_PROGRESS: 'En curso',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
      CANCELED: 'Cancelada',
    };
    return STATUS_LABELS[status] || status;
  }

  /**
   * @param {string} status
   * @returns {string}
   */
  function getStatusClass(status) {
    const STATUS_CLASSES = {
      SCHEDULED: 'bg-secondary',
      IN_PROGRESS: 'bg-info',
      COMPLETED: 'bg-success',
      CANCELLED: 'bg-danger',
      CANCELED: 'bg-danger',
    };
    return STATUS_CLASSES[status] || 'bg-secondary';
  }

  async function updateStatus(id, newStatus) {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('status', newStatus);

    try {
      const res = await fetch('?/updateStatus', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        await invalidateAll();
      } else {
        alert('Error al actualizar el estado');
      }
    } catch (e) {
      alert('Error al actualizar el estado');
    }
  }

  async function handleRefresh() {
    await invalidateAll();
  }

  onMount(async () => {
    // Current date display
    const now = new Date();
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    currentDateString = now.toLocaleDateString('es-ES', options);

    // Load uPlot script dynamically first
    if (typeof window.uPlot === 'undefined') {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = '/js/lib/uPlot.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    renderChart();
  });

  function renderChart() {
    if (!chartContainer || typeof uPlot === 'undefined') return;

    if (chart) {
      try {
        chart.destroy();
      } catch (e) {}
      chart = null;
    }

    const monthlyStats = snapshot?.monthlyStats || [];
    const labels = monthlyStats.map(entry => entry.monthName);
    const values = monthlyStats.map(entry => entry.appointmentCount);

    if (!labels.length || !values.length) return;

    const xValues = labels.map((_, index) => index + 1);
    chartLabelMap = {};
    labels.forEach((label, index) => {
      chartLabelMap[index + 1] = label;
    });

    const xRangeMax = Math.max(1, labels.length);

    chart = new uPlot(
      {
        width: chartContainer.clientWidth || 600,
        height: 350,
        series: [
          {},
          {
            label: 'Citas',
            stroke: '#0d6efd',
            width: 3,
            fill: 'rgba(13, 110, 253, 0.1)',
            paths: uPlot.paths.spline(),
          },
        ],
        axes: [
          {
            values: (u, valuesList) => valuesList.map(val => chartLabelMap[Math.round(val)] || ''),
            grid: { show: false },
          },
          {
            scale: 'y',
          },
        ],
        scales: {
          x: {
            auto: false,
            range: [1, xRangeMax],
          },
          y: {
            auto: false,
            range: (u, min, max) => [0, Math.max(1, Math.ceil(max))],
          },
        },
        legend: { show: false },
      },
      [xValues, values],
      chartContainer
    );

    if (!resizeHandler) {
      resizeHandler = () => {
        if (chart && chartContainer) {
          chart.setSize({ width: chartContainer.clientWidth || 600, height: 350 });
        }
      };
      window.addEventListener('resize', resizeHandler);
    }
  }

  // Update chart when snapshot changes
  $: if (snapshot && chart) {
    const monthlyStats = snapshot.monthlyStats || [];
    const labels = monthlyStats.map((/** @type {any} */ entry) => entry.monthName);
    const values = monthlyStats.map((/** @type {any} */ entry) => entry.appointmentCount);
    const xValues = labels.map((_, /** @type {any} */ index) => index + 1);
    chartLabelMap = {};
    labels.forEach((/** @type {any} */ label, /** @type {any} */ index) => {
      chartLabelMap[index + 1] = label;
    });
    chart.setData([xValues, values]);
    chart.setScale('x', { min: 1, max: Math.max(1, labels.length) });
    chart.setScale('y', { min: 0, max: Math.max(1, Math.ceil(Math.max(...values, 0))) });
  }

  onDestroy(() => {
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
    if (chart) {
      try {
        chart.destroy();
      } catch (e) {}
      chart = null;
    }
  });

  function exportCsv() {
    const items = snapshot?.upcomingAppointments || [];
    if (!items || !items.length) return alert('No hay datos para exportar');
    const keys = ['id', 'patientName', 'dentistName', 'date', 'time', 'status'];
    const rows = items.map((it) =>
      keys.map((k) => `"${String(it[k] ?? '').replace(/"/g, '""')}"`).join(','),
    );
    const csv = [keys.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'upcoming_appointments.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>Dashboard - Clínica Dental</title>
  <link rel="stylesheet" href="/css/lib/uPlot.min.css" />
  <link rel="stylesheet" href="/css/views/dashboard.css" />
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
        <button
          on:click={handleRefresh}
          class="btn btn-sm btn-outline-primary"
        >
          🔁 Refrescar
        </button>
        <button
          on:click={exportCsv}
          class="btn btn-sm btn-outline-secondary"
        >
          ⬇️ Exportar CSV
        </button>
      </div>

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
                    <div class="d-flex align-items-center p-3 border-bottom appointment-item" data-id="{appointment.id}">
                      <div class="flex-grow-1">
                        <h6 class="mb-1">{appointment.patientName}</h6>
                        <small class="text-muted">Dr/a. {appointment.dentistName}</small>
                        <div class="mt-1">
                          <small class="badge bg-light text-dark">
                            <i class="bi bi-clock me-1"></i>{appointment.time}
                          </small>
                          <small class="badge bg-primary ms-1">
                            <i class="bi bi-calendar3 me-1"></i>{formatLocalDate(appointment.date)}
                          </small>
                          <small class="badge ms-1 {getStatusClass(appointment.status)} text-white appointment-status">
                            {getStatusLabel(appointment.status)}
                          </small>
                        </div>
                      </div>
                      <div class="ms-2 d-flex align-items-center gap-2 appointment-actions">
                        <a href="/appointments/edit/{appointment.id}" class="btn btn-sm btn-outline-primary">
                          <i class="bi bi-pencil"></i>
                        </a>
                        <div class="dropdown appointment-status-dropdown">
                          <button class="btn btn-sm btn-outline-secondary dropdown-toggle appointment-status-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Estado
                          </button>
                          <ul class="dropdown-menu dropdown-menu-end">
                            <li><button class="dropdown-item change-status" on:click={() => updateStatus(appointment.id, 'IN_PROGRESS')}>Marcar en progreso</button></li>
                            <li><button class="dropdown-item change-status" on:click={() => updateStatus(appointment.id, 'COMPLETED')}>Marcar completada</button></li>
                            <li><button class="dropdown-item change-status text-danger" on:click={() => updateStatus(appointment.id, 'CANCELLED')}>Cancelar</button></li>
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

      <!-- Mensaje de Error -->
      {#if errorMsg}
        <div
          id="error-message"
          class="alert alert-danger"
        >
          <i class="bi bi-exclamation-triangle me-2"></i>
          <span>{errorMsg}</span>
        </div>
      {/if}
    </div>
  </div>
</div>
