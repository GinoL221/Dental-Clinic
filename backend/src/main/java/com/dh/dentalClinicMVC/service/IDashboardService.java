package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.dto.DashboardSnapshotDTO;
import com.dh.dentalClinicMVC.dto.DashboardStatsDTO;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface IDashboardService {

  /**
   * Obtiene estadísticas básicas del dashboard
   *
   * @return DashboardStatsDTO con contadores básicos
   */
  DashboardStatsDTO getDashboardStats();

  /**
   * Obtiene estadísticas generales del dashboard, sin filtro. Delega en el trío (from, to,
   * dentistId) con los tres valores en null.
   *
   * @return Map con contadores de citas, dentistas, pacientes
   */
  default Map<String, Object> getDashboardStatistics() {
    return getDashboardStatistics(null, null, null);
  }

  /**
   * Obtiene estadísticas generales del dashboard, respetando el filtro opcional from/to/dentistId.
   * totalDentists/totalPatients permanecen globales (no son datos derivados de citas);
   * totalAppointments y todayAppointments narrowan al filtro. todayAppointments es 0 si hoy queda
   * fuera de [from, to].
   *
   * @return Map con contadores de citas, dentistas, pacientes
   */
  Map<String, Object> getDashboardStatistics(LocalDate from, LocalDate to, Long dentistId);

  /**
   * Obtiene datos de citas agrupadas por mes, sin filtro (ventana de los últimos 6 meses, idéntica
   * byte a byte al comportamiento histórico). Delega en el trío (from, to, dentistId) con los tres
   * valores en null.
   *
   * @return Map con datos para gráfico de citas por mes
   */
  default Map<String, Object> getAppointmentsByMonth() {
    return getAppointmentsByMonth(null, null, null);
  }

  /**
   * Obtiene datos de citas agrupadas por mes, respetando el filtro opcional from/to/dentistId.
   * Rango resuelto: sólo from -&gt; from..hoy; sólo to -&gt; (to - 5 meses)..to; ambos -&gt;
   * from..to, acotado a los últimos 24 buckets terminando en el extremo superior del rango.
   *
   * @return Map con datos para gráfico de citas por mes
   */
  Map<String, Object> getAppointmentsByMonth(LocalDate from, LocalDate to, Long dentistId);

  /**
   * Obtiene las próximas citas, sin filtro. Delega en el trío (from, to, dentistId) con los tres
   * valores en null.
   *
   * @return Map con lista de próximas citas
   */
  default Map<String, Object> getUpcomingAppointments() {
    return getUpcomingAppointments(null, null, null);
  }

  /**
   * Obtiene las próximas citas, respetando el filtro opcional from/to/dentistId. La cota inferior
   * efectiva es max(hoy, from).
   *
   * @return Map con lista de próximas citas
   */
  Map<String, Object> getUpcomingAppointments(LocalDate from, LocalDate to, Long dentistId);

  /**
   * Obtiene el conteo de citas agrupado por estado, sin filtro. Delega en el trío (from, to,
   * dentistId) con los tres valores en null.
   *
   * @return lista de conteos por estado
   */
  default List<DashboardSnapshotDTO.StatusCountDTO> getAppointmentsByStatus() {
    return getAppointmentsByStatus(null, null, null);
  }

  /**
   * Obtiene el conteo de citas agrupado por estado, respetando el filtro opcional
   * from/to/dentistId. Siempre contiene exactamente una entrada por cada {@link
   * com.dh.dentalClinicMVC.entity.AppointmentStatus}, en orden de declaración del enum, con conteo
   * 0 para los estados sin actividad dentro del filtro activo.
   *
   * @return lista de conteos por estado
   */
  List<DashboardSnapshotDTO.StatusCountDTO> getAppointmentsByStatus(
      LocalDate from, LocalDate to, Long dentistId);

  /**
   * Obtiene el conteo de citas agrupado por dentista, sin filtro. Delega en el trío (from, to,
   * dentistId) con los tres valores en null.
   *
   * @return lista de conteos por dentista (máximo 11 entradas)
   */
  default List<DashboardSnapshotDTO.DentistCountDTO> getAppointmentsByDentist() {
    return getAppointmentsByDentist(null, null, null);
  }

  /**
   * Obtiene el conteo de citas agrupado por dentista, respetando el filtro opcional
   * from/to/dentistId, ordenado por conteo descendente (empate por nombre ascendente). Limitado a
   * los 10 dentistas con más actividad dentro del filtro; el resto se agrupa en una entrada final
   * "Otros". Los dentistas sin actividad no aparecen.
   *
   * @return lista de conteos por dentista (máximo 11 entradas)
   */
  List<DashboardSnapshotDTO.DentistCountDTO> getAppointmentsByDentist(
      LocalDate from, LocalDate to, Long dentistId);
}
