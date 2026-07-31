package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.dto.DashboardSnapshotDTO;
import com.dh.dentalClinicMVC.dto.DashboardStatsDTO;
import com.dh.dentalClinicMVC.service.IDashboardService;
import com.dh.dentalClinicMVC.service.IDashboardSnapshotService;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class DashboardSnapshotService implements IDashboardSnapshotService {

  private final IDashboardService dashboardService;

  public DashboardSnapshotService(IDashboardService dashboardService) {
    this.dashboardService = dashboardService;
  }

  @Override
  @Cacheable(
      value = "dashboardSnapshot",
      key = "'default'",
      condition = "#from == null && #to == null && #dentistId == null",
      unless = "#result == null")
  public DashboardSnapshotDTO getDashboardSnapshot(LocalDate from, LocalDate to, Long dentistId) {
    DashboardSnapshotDTO snapshot = DashboardSnapshotDTO.withDefaults();

    applyStatsSection(snapshot, from, to, dentistId);
    applyMonthlySection(snapshot, from, to, dentistId);
    applyUpcomingSection(snapshot, from, to, dentistId);
    applyStatusSection(snapshot, from, to, dentistId);
    applyDentistSection(snapshot, from, to, dentistId);

    return snapshot;
  }

  private void applyStatsSection(
      DashboardSnapshotDTO snapshot, LocalDate from, LocalDate to, Long dentistId) {
    try {
      Map<String, Object> stats = dashboardService.getDashboardStatistics(from, to, dentistId);
      snapshot.setTotalAppointments(extractLong(stats.get("totalAppointments")));
      snapshot.setTotalDentists(extractLong(stats.get("totalDentists")));
      snapshot.setTotalPatients(extractLong(stats.get("totalPatients")));
      snapshot.setTodayAppointments(extractLong(stats.get("todayAppointments")));
    } catch (RuntimeException ignored) {
      // Keep safe defaults for this section
    }
  }

  private void applyMonthlySection(
      DashboardSnapshotDTO snapshot, LocalDate from, LocalDate to, Long dentistId) {
    try {
      Map<String, Object> monthlyData =
          dashboardService.getAppointmentsByMonth(from, to, dentistId);
      Object monthsObj = monthlyData.get("months");
      Object countsObj = monthlyData.get("appointmentCounts");

      if (!(monthsObj instanceof List<?> months) || !(countsObj instanceof List<?> counts)) {
        snapshot.setMonthlyStats(new ArrayList<>());
        return;
      }

      int size = Math.min(months.size(), counts.size());
      List<DashboardStatsDTO.MonthlyStatsDTO> monthlyStats = new ArrayList<>(size);

      for (int i = 0; i < size; i++) {
        String monthLabel = months.get(i) != null ? months.get(i).toString() : "";
        Long appointmentCount = extractLong(counts.get(i));
        monthlyStats.add(
            new DashboardStatsDTO.MonthlyStatsDTO(monthLabel, monthLabel, appointmentCount));
      }

      snapshot.setMonthlyStats(monthlyStats);
    } catch (RuntimeException ignored) {
      // Keep safe defaults for this section
    }
  }

  @SuppressWarnings("unchecked")
  private void applyUpcomingSection(
      DashboardSnapshotDTO snapshot, LocalDate from, LocalDate to, Long dentistId) {
    try {
      Map<String, Object> upcomingData =
          dashboardService.getUpcomingAppointments(from, to, dentistId);
      Object upcomingObj = upcomingData.get("upcomingAppointments");

      if (!(upcomingObj instanceof List<?> upcomingList)) {
        snapshot.setUpcomingAppointments(new ArrayList<>());
        return;
      }

      List<DashboardSnapshotDTO.UpcomingAppointmentDTO> appointments = new ArrayList<>();
      for (Object item : upcomingList) {
        if (!(item instanceof Map<?, ?> itemMap)) {
          continue;
        }

        Map<String, Object> appointment = (Map<String, Object>) itemMap;

        DashboardSnapshotDTO.UpcomingAppointmentDTO dto =
            new DashboardSnapshotDTO.UpcomingAppointmentDTO();
        dto.setId(extractLong(appointment.get("id")));
        dto.setPatientName(extractString(appointment.get("patientName")));
        dto.setDentistName(extractString(appointment.get("dentistName")));
        dto.setDate(extractString(appointment.get("date")));
        dto.setTime(extractString(appointment.get("time")));
        dto.setStatus(extractString(appointment.get("status")));
        appointments.add(dto);
      }

      snapshot.setUpcomingAppointments(appointments);
    } catch (RuntimeException ignored) {
      // Keep safe defaults for this section
    }
  }

  private void applyStatusSection(
      DashboardSnapshotDTO snapshot, LocalDate from, LocalDate to, Long dentistId) {
    try {
      snapshot.setStatusBreakdown(dashboardService.getAppointmentsByStatus(from, to, dentistId));
    } catch (RuntimeException ignored) {
      // Keep safe defaults for this section
    }
  }

  private void applyDentistSection(
      DashboardSnapshotDTO snapshot, LocalDate from, LocalDate to, Long dentistId) {
    try {
      snapshot.setDentistBreakdown(dashboardService.getAppointmentsByDentist(from, to, dentistId));
    } catch (RuntimeException ignored) {
      // Keep safe defaults for this section
    }
  }

  private Long extractLong(Object value) {
    if (value instanceof Number number) {
      return number.longValue();
    }
    if (value == null) {
      return 0L;
    }
    try {
      return Long.parseLong(value.toString());
    } catch (NumberFormatException ex) {
      return 0L;
    }
  }

  private String extractString(Object value) {
    return value != null ? value.toString() : "";
  }
}
