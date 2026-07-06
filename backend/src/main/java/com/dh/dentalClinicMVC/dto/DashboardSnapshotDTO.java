package com.dh.dentalClinicMVC.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSnapshotDTO {

  private Long totalAppointments;
  private Long totalDentists;
  private Long totalPatients;
  private Long todayAppointments;
  private List<DashboardStatsDTO.MonthlyStatsDTO> monthlyStats;
  private List<UpcomingAppointmentDTO> upcomingAppointments;

  public Long getTotalAppointments() {
    return totalAppointments;
  }

  public void setTotalAppointments(Long totalAppointments) {
    this.totalAppointments = totalAppointments;
  }

  public Long getTotalDentists() {
    return totalDentists;
  }

  public void setTotalDentists(Long totalDentists) {
    this.totalDentists = totalDentists;
  }

  public Long getTotalPatients() {
    return totalPatients;
  }

  public void setTotalPatients(Long totalPatients) {
    this.totalPatients = totalPatients;
  }

  public Long getTodayAppointments() {
    return todayAppointments;
  }

  public void setTodayAppointments(Long todayAppointments) {
    this.todayAppointments = todayAppointments;
  }

  public List<DashboardStatsDTO.MonthlyStatsDTO> getMonthlyStats() {
    return monthlyStats;
  }

  public void setMonthlyStats(List<DashboardStatsDTO.MonthlyStatsDTO> monthlyStats) {
    this.monthlyStats = monthlyStats;
  }

  public List<UpcomingAppointmentDTO> getUpcomingAppointments() {
    return upcomingAppointments;
  }

  public void setUpcomingAppointments(List<UpcomingAppointmentDTO> upcomingAppointments) {
    this.upcomingAppointments = upcomingAppointments;
  }

  public static DashboardSnapshotDTO withDefaults() {
    DashboardSnapshotDTO snapshot = new DashboardSnapshotDTO();
    snapshot.totalAppointments = 0L;
    snapshot.totalDentists = 0L;
    snapshot.totalPatients = 0L;
    snapshot.todayAppointments = 0L;
    snapshot.monthlyStats = new ArrayList<>();
    snapshot.upcomingAppointments = new ArrayList<>();
    return snapshot;
  }

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UpcomingAppointmentDTO {
    private Long id;
    private String patientName;
    private String dentistName;
    private String date;
    private String time;
    private String status;

    public Long getId() {
      return id;
    }

    public void setId(Long id) {
      this.id = id;
    }

    public String getPatientName() {
      return patientName;
    }

    public void setPatientName(String patientName) {
      this.patientName = patientName;
    }

    public String getDentistName() {
      return dentistName;
    }

    public void setDentistName(String dentistName) {
      this.dentistName = dentistName;
    }

    public String getDate() {
      return date;
    }

    public void setDate(String date) {
      this.date = date;
    }

    public String getTime() {
      return time;
    }

    public void setTime(String time) {
      this.time = time;
    }

    public String getStatus() {
      return status;
    }

    public void setStatus(String status) {
      this.status = status;
    }
  }
}
