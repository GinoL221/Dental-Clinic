<script>
  import { onMount, onDestroy } from 'svelte';

  export let data;
  $: user = data.user;

  onMount(async () => {
    // Set dataset attributes on body for legacy controller compatibility
    if (typeof document !== 'undefined' && document.body) {
      document.body.setAttribute('data-user-id', user?.id || '');
      document.body.setAttribute('data-user-first-name', user?.firstName || '');
      document.body.setAttribute('data-user-last-name', user?.lastName || '');
      document.body.setAttribute('data-user-email', user?.email || '');
      document.body.setAttribute('data-user-role', user?.role || '');
      document.body.setAttribute('data-is-admin', user?.role === 'ADMIN' ? 'true' : 'false');
      document.body.setAttribute('data-current-page', 'dashboard');
    }

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

    // Import the legacy controller that takes care of dashboard loading and rendering
    await import('/js/dashboard/dashboard-controller.js');
  });

  onDestroy(() => {
    if (typeof document !== 'undefined' && document.body) {
      ['data-user-id', 'data-user-first-name', 'data-user-last-name', 'data-user-email', 'data-user-role', 'data-is-admin', 'data-current-page'].forEach(attr => {
        document.body.removeAttribute(attr);
      });
    }
  });
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
          <span id="current-date"></span>
        </small>
      </div>

      <!-- Controles: refrescar y exportar -->
      <div class="d-flex gap-2 align-items-center mb-3">
        <button
          id="btn-refresh-dashboard"
          class="btn btn-sm btn-outline-primary"
        >
          🔁 Refrescar
        </button>
        <button
          id="btn-export-xlsx"
          class="btn btn-sm btn-outline-secondary"
        >
          ⬇️ Exportar XLSX
        </button>
      </div>

      <!-- Tarjetas de Estadísticas -->
      <div class="row mb-4" id="stats-cards">
        <!-- Loading state -->
        <div class="col-12 text-center" id="loading-stats">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando estadísticas...</span>
          </div>
          <p class="mt-2 text-muted">Cargando datos del dashboard...</p>
        </div>

        <!-- Cards (ocultas hasta que lleguen los datos) -->
        <div id="cards-row" class="row w-100" style="display: none">
          <div class="col-md-4 mb-3">
            <div class="card shadow-sm p-3">
              <small class="text-muted">Total citas</small>
              <h3 id="totalAppointments" class="mb-0">—</h3>
            </div>
          </div>

          <div class="col-md-4 mb-3">
            <div class="card shadow-sm p-3">
              <small class="text-muted">Dentistas</small>
              <h3 id="totalDentists" class="mb-0">—</h3>
            </div>
          </div>

          <div class="col-md-4 mb-3">
            <div class="card shadow-sm p-3">
              <small class="text-muted">Pacientes</small>
              <h3 id="totalPatients" class="mb-0">—</h3>
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
              <div id="loading-chart" class="text-center py-4">
                <div class="spinner-border text-info" role="status">
                  <span class="visually-hidden">Cargando gráfico...</span>
                </div>
              </div>
              <div
                id="appointmentsChart"
                style="display: none; height: 350px; max-height: 350px"
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
                Proximas citas
              </h5>
            </div>
            <div class="card-body p-0">
              <div id="loading-appointments" class="text-center py-4">
                <div class="spinner-border text-warning" role="status">
                  <span class="visually-hidden">Cargando citas...</span>
                </div>
              </div>
              <div
                id="upcoming-appointments"
                style="display: none; max-height: 350px; overflow-y: auto"
              >
                <!-- Las citas se cargarán aquí -->
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensaje de Error -->
      <div
        id="error-message"
        class="alert alert-danger"
        style="display: none"
      >
        <i class="bi bi-exclamation-triangle me-2"></i>
        <span id="error-text"></span>
      </div>
    </div>
  </div>
</div>
