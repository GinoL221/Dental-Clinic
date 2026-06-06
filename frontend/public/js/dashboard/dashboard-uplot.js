import logger from "../logger.js";

/**
 * Dashboard uPlot module
 * Handles all chart rendering and data management using uPlot.
 */
class DashboardUPlot {
  constructor() {
    this.chart = null;
    this.chartLabelMap = {};
    this._chartResizeHandler = null;
  }

  /**
   * Load chart data from snapshot and render
   * @param {Object} snapshot - Dashboard snapshot with monthlyStats
   */
  loadChart(snapshot) {
    try {
      const monthlyStats =
        snapshot && Array.isArray(snapshot.monthlyStats)
          ? snapshot.monthlyStats
          : [];
      const data = {
        months: monthlyStats.map((entry) => entry.monthName),
        appointmentCounts: monthlyStats.map((entry) => entry.appointmentCount),
      };
      this.renderChart(data);
    } catch (error) {
      logger.error("Error al cargar datos del gráfico:", error);
      const el = document.getElementById("loading-chart");
      if (el)
        el.innerHTML = '<p class="text-muted">Error al cargar el gráfico</p>';
    }
  }

  /**
   * Render uPlot chart with given data
   * @param {Object} data - { months: string[], appointmentCounts: number[] }
   */
  renderChart(data) {
    const loadingChart = document.getElementById("loading-chart");
    const chartContainer = document.getElementById("appointmentsChart");

    if (loadingChart) loadingChart.style.display = "none";
    if (!chartContainer) return;

    chartContainer.style.display = "block";

    // destroy previous chart if exists
    if (this.chart) {
      try {
        this.chart.destroy();
      } catch (e) {}
      this.chart = null;
    }

    if (typeof uPlot === "undefined") {
      logger.error("uPlot no está cargado");
      chartContainer.style.display = "none";
      return;
    }

    // Validate data shape
    const labels = data && data.months ? data.months : [];
    const values = data && data.appointmentCounts ? data.appointmentCounts : [];

    if (!labels.length || !values.length) {
      chartContainer.style.display = "none";
      if (loadingChart) {
        loadingChart.innerHTML =
          '<p class="text-muted">No hay datos suficientes para mostrar el gráfico</p>';
        loadingChart.style.display = "block";
      }
      return;
    }

    const xValues = labels.map((_, index) => index + 1);
    const chartData = [xValues, values];

    this.chartLabelMap = {};
    labels.forEach((label, index) => {
      this.chartLabelMap[index + 1] = label;
    });

    const xRangeMax = Math.max(1, labels.length);

    this.chart = new uPlot(
      {
        width: chartContainer.clientWidth || 600,
        height: 350,
        series: [
          {},
          {
            label: "Citas",
            stroke: "#0d6efd",
            width: 3,
            fill: "rgba(13, 110, 253, 0.1)",
            paths: uPlot.paths.spline(),
          },
        ],
        axes: [
          {
            values: (_u, valuesList) =>
              valuesList.map((val) => this.chartLabelMap[Math.round(val)] || ""),
            grid: { show: false },
          },
          {
            scale: "y",
          },
        ],
        scales: {
          x: {
            auto: false,
            range: [1, xRangeMax],
          },
          y: {
            auto: false,
            range: (_u, min, max) => [0, Math.max(1, Math.ceil(max))],
          },
        },
        legend: { show: false },
      },
      chartData,
      chartContainer
    );

    if (!this._chartResizeHandler) {
      this._chartResizeHandler = () => {
        if (!this.chart) return;
        this.chart.setSize({ width: chartContainer.clientWidth || 600, height: 350 });
      };
      window.addEventListener("resize", this._chartResizeHandler);
    }
  }

  /**
   * Update chart data without recreating the chart
   * @param {string[]} labels - Month labels
   * @param {number[]} values - Appointment counts
   */
  updateChartData(labels = [], values = []) {
    if (!this.chart) {
      this.renderChart({ months: labels, appointmentCounts: values });
      return;
    }
    try {
      const xValues = labels.map((_, index) => index + 1);
      this.chartLabelMap = {};
      labels.forEach((label, index) => {
        this.chartLabelMap[index + 1] = label;
      });

      this.chart.setData([xValues, values]);
      this.chart.setScale("x", { min: 1, max: Math.max(1, labels.length) });
      this.chart.setScale("y", { min: 0, max: Math.max(1, Math.ceil(Math.max(...values, 0))) });
    } catch (e) {
      logger.warn("updateChartData failed, recreating chart", e);
      this.renderChart({ months: labels, appointmentCounts: values });
    }
  }

  /**
   * Destroy chart and cleanup
   */
  destroy() {
    if (this._chartResizeHandler) {
      window.removeEventListener("resize", this._chartResizeHandler);
      this._chartResizeHandler = null;
    }
    if (this.chart) {
      try {
        this.chart.destroy();
      } catch (e) {}
      this.chart = null;
    }
    this.chartLabelMap = {};
  }
}

// Export as singleton for dashboard use
const dashboardUPlot = new DashboardUPlot();

export default dashboardUPlot;