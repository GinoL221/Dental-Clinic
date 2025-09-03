package com.dh.dentalClinicMVC.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private Long totalAppointments;
    private Long totalDentists;
    private Long totalPatients;
    private Long todayAppointments;

    // Próximas citas del día
    private List<AppointmentDTO> todayAppointmentsList;

    // Estadísticas para gráficos (citas por mes de los últimos 6 meses)
    private List<MonthlyStatsDTO> monthlyStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyStatsDTO {
        private String month;
        private String monthName;
        private Long appointmentCount;
    }
}
