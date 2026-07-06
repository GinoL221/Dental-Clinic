package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.DashboardSnapshotDTO;
import com.dh.dentalClinicMVC.service.IDashboardSnapshotService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
  public ResponseEntity<DashboardSnapshotDTO> getDashboardSnapshot() {
    DashboardSnapshotDTO snapshot = dashboardSnapshotService.getDashboardSnapshot();
    return ResponseEntity.ok(snapshot);
  }
}
