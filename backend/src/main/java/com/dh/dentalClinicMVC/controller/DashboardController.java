package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.DashboardSnapshotDTO;
import com.dh.dentalClinicMVC.service.IDashboardSnapshotService;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

  private final IDashboardSnapshotService dashboardSnapshotService;

  public DashboardController(IDashboardSnapshotService dashboardSnapshotService) {
    this.dashboardSnapshotService = dashboardSnapshotService;
  }

  @GetMapping("/snapshot")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<DashboardSnapshotDTO> getDashboardSnapshot(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      @RequestParam(required = false) Long dentistId) {
    if (from != null && to != null && from.isAfter(to)) {
      return ResponseEntity.badRequest().build();
    }

    DashboardSnapshotDTO snapshot =
        dashboardSnapshotService.getDashboardSnapshot(from, to, dentistId);
    return ResponseEntity.ok(snapshot);
  }
}
