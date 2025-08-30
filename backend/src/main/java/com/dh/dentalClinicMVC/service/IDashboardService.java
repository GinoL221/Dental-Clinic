package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.dto.DashboardStatsDTO;
import java.util.Map;

public interface IDashboardService {
    
    /**
     * Obtiene estadísticas básicas del dashboard
     * @return DashboardStatsDTO con contadores básicos
     */
    DashboardStatsDTO getDashboardStats();
    
    /**
     * Obtiene estadísticas generales del dashboard
     * @return Map con contadores de citas, dentistas, pacientes
     */
    Map<String, Object> getDashboardStatistics();
    
    /**
     * Obtiene datos de citas agrupadas por mes
     * @return Map con datos para gráfico de citas por mes
     */
    Map<String, Object> getAppointmentsByMonth();
    
    /**
     * Obtiene las próximas citas del día actual
     * @return Map con lista de próximas citas
     */
    Map<String, Object> getUpcomingAppointments();
}
