package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.DashboardStatsDTO;
import com.dh.dentalClinicMVC.service.IDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private IDashboardService dashboardService;

    @Autowired
    public DashboardController(IDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    // Endpoint para obtener estadísticas generales
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = dashboardService.getDashboardStatistics();
        return ResponseEntity.ok(stats);
    }

    // Endpoint básico para compatibilidad
    @GetMapping("/basic-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardStatsDTO> getBasicStats() {
        DashboardStatsDTO stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    // Endpoint para obtener citas por mes (para gráfico)
    @GetMapping("/appointments-by-month")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAppointmentsByMonth() {
        Map<String, Object> data = dashboardService.getAppointmentsByMonth();
        return ResponseEntity.ok(data);
    }

    // Endpoint para obtener próximas citas del día
    @GetMapping("/upcoming-appointments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUpcomingAppointments() {
        Map<String, Object> data = dashboardService.getUpcomingAppointments();
        return ResponseEntity.ok(data);
    }
}
