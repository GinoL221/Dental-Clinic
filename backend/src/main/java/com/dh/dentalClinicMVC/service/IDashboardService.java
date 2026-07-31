package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.dto.DashboardSnapshotDTO;
import com.dh.dentalClinicMVC.dto.DashboardStatsDTO;
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
   * Obtiene estadísticas generales del dashboard
   *
   * @return Map con contadores de citas, dentistas, pacientes
   */
  Map<String, Object> getDashboardStatistics();

  /**
   * Obtiene datos de citas agrupadas por mes
   *
   * @return Map con datos para gráfico de citas por mes
   */
  Map<String, Object> getAppointmentsByMonth();

  /**
   * Obtiene las próximas citas del día actual
   *
   * @return Map con lista de próximas citas
   */
  Map<String, Object> getUpcomingAppointments();

  /**
   * Obtiene el conteo de citas agrupado por estado. Siempre contiene exactamente una entrada por
   * cada {@link com.dh.dentalClinicMVC.entity.AppointmentStatus}, en orden de declaración del enum,
   * con conteo 0 para los estados sin actividad.
   *
   * @return lista de conteos por estado
   */
  List<DashboardSnapshotDTO.StatusCountDTO> getAppointmentsByStatus();

  /**
   * Obtiene el conteo de citas agrupado por dentista, ordenado por conteo descendente (empate por
   * nombre ascendente). Limitado a los 10 dentistas con más actividad; el resto se agrupa en una
   * entrada final "Otros". Los dentistas sin actividad no aparecen.
   *
   * @return lista de conteos por dentista (máximo 11 entradas)
   */
  List<DashboardSnapshotDTO.DentistCountDTO> getAppointmentsByDentist();
}
