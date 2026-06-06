package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.DashboardStatsDTO;
import com.dh.dentalClinicMVC.service.IDashboardService;
import com.dh.dentalClinicMVC.dto.DashboardSnapshotDTO;
import com.dh.dentalClinicMVC.service.IDashboardSnapshotService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final IDashboardService dashboardService;
    private final IDashboardSnapshotService dashboardSnapshotService;

    public DashboardController(IDashboardService dashboardService,
                               IDashboardSnapshotService dashboardSnapshotService) {
        this.dashboardService = dashboardService;
        this.dashboardSnapshotService = dashboardSnapshotService;
    }

    @GetMapping("/snapshot")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardSnapshotDTO> getDashboardSnapshot() {
        DashboardSnapshotDTO snapshot = dashboardSnapshotService.getDashboardSnapshot();
        return ResponseEntity.ok(snapshot);
    }

    // Deprecated: replaced by /dashboard/snapshot
    @Deprecated
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = dashboardService.getDashboardStatistics();
        return ResponseEntity.ok(stats);
    }

    // Deprecated: replaced by /dashboard/snapshot
    @Deprecated
    @GetMapping("/basic-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardStatsDTO> getBasicStats() {
        DashboardStatsDTO stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    // Deprecated: replaced by /dashboard/snapshot
    @Deprecated
    @GetMapping("/appointments-by-month")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAppointmentsByMonth() {
        Map<String, Object> data = dashboardService.getAppointmentsByMonth();
        return ResponseEntity.ok(data);
    }

    // Deprecated: replaced by /dashboard/snapshot
    @Deprecated
    @GetMapping("/upcoming-appointments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUpcomingAppointments() {
        Map<String, Object> data = dashboardService.getUpcomingAppointments();
        return ResponseEntity.ok(data);
    }
}
