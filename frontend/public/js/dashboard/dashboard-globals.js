export const SELECTORS = {
  statsContainer: "#stats-cards",
  loadingStats: "#loading-stats",
  chartCanvas: "#appointmentsChart",
  loadingChart: "#loading-chart",
  upcomingContainer: "#upcoming-appointments",
  loadingUpcoming: "#loading-appointments",
  currentDate: "#current-date",
  errorMessage: "#error-message",
  errorText: "#error-text",
};

export const CHART_DEFAULTS = {
  color: "#0d6efd",
  background: "rgba(13,110,253,0.1)",
  options: { maintainAspectRatio: false, responsive: true },
};

export const CACHE_KEYS = {
  DASHBOARD_STATS: "dashboard_stats_v1",
};
