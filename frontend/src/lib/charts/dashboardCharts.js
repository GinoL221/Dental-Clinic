import { categoryXAxis } from "./categoryAxis.js";

/**
 * Dynamically loads the uPlot script if not already present on window.
 * @returns {Promise<void>}
 */
export async function loadUPlot() {
  if (typeof window === "undefined" || typeof window.uPlot !== "undefined") {
    return;
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "/js/lib/uPlot.min.js";
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/**
 * Creates a uPlot bar chart in container.
 * @param {HTMLElement} container
 * @param {string[]} labels
 * @param {number[]} values
 * @param {string} color
 * @returns {any}
 */
export function createBarChart(container, labels, values, color) {
  if (
    !container ||
    typeof uPlot === "undefined" ||
    !labels.length ||
    !values.length
  ) {
    return null;
  }

  const xValues = labels.map((_, index) => index + 1);
  /** @type {Record<number, string>} */
  const labelMap = {};
  labels.forEach((label, index) => {
    labelMap[index + 1] = label;
  });

  const n = labels.length;

  return new uPlot(
    {
      width: container.clientWidth || 600,
      height: 350,
      series: [
        {},
        {
          label: "Citas",
          stroke: color,
          fill: color,
          width: 1,
          paths: uPlot.paths.bars({
            size: [0.6, 60],
            align: 0,
            gap: 4,
            radius: 0.1,
          }),
        },
      ],
      axes: [
        categoryXAxis(labelMap),
        {
          scale: "y",
        },
      ],
      scales: {
        x: {
          auto: false,
          range: [0.5, n + 0.5],
        },
        y: {
          auto: false,
          range: (/** @type {any} */ _u, /** @type {any} */ _min, /** @type {any} */ max) => [
            0,
            Math.max(1, Math.ceil(max)),
          ],
        },
      },
      legend: { show: false },
    },
    [xValues, values],
    container,
  );
}

/**
 * Creates the monthly appointments line/spline chart.
 * @param {HTMLElement} container
 * @param {Array<{ monthName: string, appointmentCount: number }> | undefined} monthlyStats
 * @returns {any}
 */
export function createMonthlyLineChart(container, monthlyStats) {
  if (!container || typeof uPlot === "undefined" || !monthlyStats?.length) {
    return null;
  }

  const labels = monthlyStats.map((entry) => entry.monthName);
  const values = monthlyStats.map((entry) => entry.appointmentCount);

  if (!labels.length || !values.length) return null;

  const xValues = labels.map((_, index) => index + 1);
  /** @type {Record<number, string>} */
  const labelMap = {};
  labels.forEach((label, index) => {
    labelMap[index + 1] = label;
  });

  const xRangeMax = Math.max(1, labels.length);

  return new uPlot(
    {
      width: container.clientWidth || 600,
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
        categoryXAxis(labelMap),
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
          range: (/** @type {any} */ _u, /** @type {any} */ _min, /** @type {any} */ max) => [
            0,
            Math.max(1, Math.ceil(max)),
          ],
        },
      },
      legend: { show: false },
    },
    [xValues, values],
    container,
  );
}

/**
 * Creates the appointments by status bar chart.
 * @param {HTMLElement} container
 * @param {Array<{ status: string, count: number }> | undefined} statusBreakdown
 * @param {(status: string) => string} getStatusLabel
 * @returns {any}
 */
export function createStatusChart(container, statusBreakdown, getStatusLabel) {
  if (!statusBreakdown?.length) return null;
  const labels = statusBreakdown.map((entry) => getStatusLabel(entry.status));
  const values = statusBreakdown.map((entry) => entry.count);
  return createBarChart(container, labels, values, "#0dcaf0");
}

/**
 * Creates the appointments by dentist bar chart.
 * @param {HTMLElement} container
 * @param {Array<{ dentistName: string, count: number }> | undefined} dentistBreakdown
 * @returns {any}
 */
export function createDentistChart(container, dentistBreakdown) {
  if (!dentistBreakdown?.length) return null;
  const labels = dentistBreakdown.map((entry) => entry.dentistName);
  const values = dentistBreakdown.map((entry) => entry.count);
  return createBarChart(container, labels, values, "#20c997");
}
