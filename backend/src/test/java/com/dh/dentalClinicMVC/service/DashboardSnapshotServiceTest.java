package com.dh.dentalClinicMVC.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import com.dh.dentalClinicMVC.dto.DashboardSnapshotDTO;
import com.dh.dentalClinicMVC.service.impl.DashboardSnapshotService;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class DashboardSnapshotServiceTest {

  @Test
  void shouldReturnAggregatedSnapshotWithExpectedSections() {
    IDashboardService dashboardService = new FakeDashboardService(false, false);
    DashboardSnapshotService snapshotService = new DashboardSnapshotService(dashboardService);

    DashboardSnapshotDTO snapshot = snapshotService.getDashboardSnapshot();

    assertEquals(12L, snapshot.getTotalAppointments());
    assertEquals(3L, snapshot.getTotalDentists());
    assertEquals(8L, snapshot.getTotalPatients());
    assertEquals(2L, snapshot.getTodayAppointments());
    assertEquals(2, snapshot.getMonthlyStats().size());
    assertEquals(1, snapshot.getUpcomingAppointments().size());
    assertEquals("Patient Demo", snapshot.getUpcomingAppointments().get(0).getPatientName());
  }

  @Test
  void shouldKeepSafeDefaultsWhenMonthlySectionFails() {
    IDashboardService dashboardService = new FakeDashboardService(true, false);
    DashboardSnapshotService snapshotService = new DashboardSnapshotService(dashboardService);

    DashboardSnapshotDTO snapshot = snapshotService.getDashboardSnapshot();

    assertEquals(12L, snapshot.getTotalAppointments());
    assertFalse(snapshot.getUpcomingAppointments().isEmpty());
    assertEquals(0, snapshot.getMonthlyStats().size());
  }

  @Test
  void shouldWireStatusAndDentistBreakdownsIntoSnapshot() {
    IDashboardService dashboardService = new FakeDashboardService(false, false);
    DashboardSnapshotService snapshotService = new DashboardSnapshotService(dashboardService);

    DashboardSnapshotDTO snapshot = snapshotService.getDashboardSnapshot();

    assertEquals(4, snapshot.getStatusBreakdown().size());
    assertEquals("SCHEDULED", snapshot.getStatusBreakdown().get(0).getStatus());
    assertEquals(9L, snapshot.getStatusBreakdown().get(0).getCount());
    assertEquals(1, snapshot.getDentistBreakdown().size());
    assertEquals("Ana Gomez", snapshot.getDentistBreakdown().get(0).getDentistName());
    assertEquals(9L, snapshot.getDentistBreakdown().get(0).getCount());
  }

  @Test
  void shouldKeepEmptyBreakdownDefaultsWhenBreakdownSectionsFail() {
    IDashboardService dashboardService = new FakeDashboardService(false, true);
    DashboardSnapshotService snapshotService = new DashboardSnapshotService(dashboardService);

    DashboardSnapshotDTO snapshot = snapshotService.getDashboardSnapshot();

    assertEquals(12L, snapshot.getTotalAppointments());
    assertEquals(0, snapshot.getStatusBreakdown().size());
    assertEquals(0, snapshot.getDentistBreakdown().size());
  }

  private static class FakeDashboardService implements IDashboardService {
    private final boolean failMonthlySection;
    private final boolean failBreakdownSections;

    private FakeDashboardService(boolean failMonthlySection, boolean failBreakdownSections) {
      this.failMonthlySection = failMonthlySection;
      this.failBreakdownSections = failBreakdownSections;
    }

    @Override
    public com.dh.dentalClinicMVC.dto.DashboardStatsDTO getDashboardStats() {
      return new com.dh.dentalClinicMVC.dto.DashboardStatsDTO();
    }

    @Override
    public Map<String, Object> getDashboardStatistics() {
      Map<String, Object> stats = new HashMap<>();
      stats.put("totalAppointments", 12L);
      stats.put("totalDentists", 3L);
      stats.put("totalPatients", 8L);
      stats.put("todayAppointments", 2L);
      return stats;
    }

    @Override
    public Map<String, Object> getAppointmentsByMonth() {
      if (failMonthlySection) {
        throw new RuntimeException("Monthly section failure");
      }

      Map<String, Object> monthly = new HashMap<>();
      monthly.put("months", List.of("Jan 2026", "Feb 2026"));
      monthly.put("appointmentCounts", List.of(4L, 6L));
      return monthly;
    }

    @Override
    public Map<String, Object> getUpcomingAppointments() {
      Map<String, Object> result = new HashMap<>();

      Map<String, Object> appointment = new HashMap<>();
      appointment.put("id", 101L);
      appointment.put("patientName", "Patient Demo");
      appointment.put("dentistName", "Dentist Demo");
      appointment.put("date", "2026-06-10");
      appointment.put("time", "10:00");
      appointment.put("status", "SCHEDULED");

      List<Map<String, Object>> appointments = new ArrayList<>();
      appointments.add(appointment);

      result.put("upcomingAppointments", appointments);
      return result;
    }

    @Override
    public List<DashboardSnapshotDTO.StatusCountDTO> getAppointmentsByStatus() {
      if (failBreakdownSections) {
        throw new RuntimeException("Status breakdown failure");
      }

      return List.of(
          new DashboardSnapshotDTO.StatusCountDTO("SCHEDULED", 9L),
          new DashboardSnapshotDTO.StatusCountDTO("IN_PROGRESS", 0L),
          new DashboardSnapshotDTO.StatusCountDTO("COMPLETED", 0L),
          new DashboardSnapshotDTO.StatusCountDTO("CANCELLED", 0L));
    }

    @Override
    public List<DashboardSnapshotDTO.DentistCountDTO> getAppointmentsByDentist() {
      if (failBreakdownSections) {
        throw new RuntimeException("Dentist breakdown failure");
      }

      return List.of(new DashboardSnapshotDTO.DentistCountDTO(1L, "Ana Gomez", 9L));
    }
  }
}
