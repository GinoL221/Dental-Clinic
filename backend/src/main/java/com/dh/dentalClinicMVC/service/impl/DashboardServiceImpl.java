package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.dto.DashboardSnapshotDTO;
import com.dh.dentalClinicMVC.dto.DashboardStatsDTO;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.service.IDashboardService;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DashboardServiceImpl implements IDashboardService {

  private static final int DENTIST_BREAKDOWN_TOP_N = 10;

  private final IAppointmentRepository appointmentRepository;
  private final IDentistRepository dentistRepository;
  private final IPatientRepository patientRepository;

  @Autowired
  public DashboardServiceImpl(
      IAppointmentRepository appointmentRepository,
      IDentistRepository dentistRepository,
      IPatientRepository patientRepository) {
    this.appointmentRepository = appointmentRepository;
    this.dentistRepository = dentistRepository;
    this.patientRepository = patientRepository;
  }

  @Override
  public DashboardStatsDTO getDashboardStats() {
    // Implementación básica para compatibilidad
    DashboardStatsDTO stats = new DashboardStatsDTO();
    stats.setTotalAppointments(appointmentRepository.count());
    stats.setTotalDentists(dentistRepository.count());
    stats.setTotalPatients(patientRepository.count());
    return stats;
  }

  @Override
  public Map<String, Object> getDashboardStatistics() {
    Map<String, Object> stats = new HashMap<>();

    // Contadores principales
    long totalAppointments = appointmentRepository.count();
    long totalDentists = dentistRepository.count();
    long totalPatients = patientRepository.count();

    stats.put("totalAppointments", totalAppointments);
    stats.put("totalDentists", totalDentists);
    stats.put("totalPatients", totalPatients);

    // Citas de hoy
    long todayAppointments = appointmentRepository.countByDate(LocalDate.now());
    stats.put("todayAppointments", todayAppointments);

    // Fecha de última actualización
    stats.put("lastUpdated", LocalDate.now().toString());

    return stats;
  }

  @Override
  public Map<String, Object> getAppointmentsByMonth() {
    Map<String, Object> data = new HashMap<>();

    // Obtener datos de los últimos 6 meses
    List<String> months = new ArrayList<>();
    List<Long> appointmentCounts = new ArrayList<>();

    LocalDate currentDate = LocalDate.now();

    for (int i = 5; i >= 0; i--) {
      LocalDate monthDate = currentDate.minusMonths(i);
      String monthName =
          monthDate.getMonth().getDisplayName(TextStyle.SHORT, Locale.forLanguageTag("es"));

      // Calcular primer y último día del mes
      LocalDate firstDay = monthDate.withDayOfMonth(1);
      LocalDate lastDay = monthDate.withDayOfMonth(monthDate.lengthOfMonth());

      // Contar citas en ese mes
      long count = appointmentRepository.countByDateBetween(firstDay, lastDay);

      months.add(monthName + " " + monthDate.getYear());
      appointmentCounts.add(count);
    }

    data.put("months", months);
    data.put("appointmentCounts", appointmentCounts);

    return data;
  }

  @Override
  public Map<String, Object> getUpcomingAppointments() {
    Map<String, Object> data = new HashMap<>();

    LocalDate today = LocalDate.now();

    // Obtener citas de hoy y próximos días
    List<Object[]> upcomingAppointments =
        appointmentRepository.findUpcomingAppointmentsWithDetails(today);

    List<Map<String, String>> appointmentsList = new ArrayList<>();

    for (Object[] appointment : upcomingAppointments) {
      Map<String, String> appointmentInfo = new HashMap<>();
      appointmentInfo.put("id", appointment[0].toString());
      appointmentInfo.put("time", appointment[1].toString());
      appointmentInfo.put("patientName", appointment[2].toString());
      appointmentInfo.put("dentistName", appointment[3].toString());
      appointmentInfo.put("date", appointment[4].toString());
      // appointment[5] is expected to be the status enum
      if (appointment.length > 5 && appointment[5] != null) {
        appointmentInfo.put("status", appointment[5].toString());
      }

      appointmentsList.add(appointmentInfo);
    }

    data.put("upcomingAppointments", appointmentsList);
    data.put("count", appointmentsList.size());

    return data;
  }

  @Override
  public List<DashboardSnapshotDTO.StatusCountDTO> getAppointmentsByStatus() {
    Map<AppointmentStatus, Long> countsByStatus = new LinkedHashMap<>();
    for (AppointmentStatus status : AppointmentStatus.values()) {
      countsByStatus.put(status, 0L);
    }

    List<Object[]> rows = appointmentRepository.countGroupedByStatus(null, null, null);
    for (Object[] row : rows) {
      AppointmentStatus status = (AppointmentStatus) row[0];
      Long count = (Long) row[1];
      countsByStatus.put(status, count);
    }

    List<DashboardSnapshotDTO.StatusCountDTO> result = new ArrayList<>();
    for (Map.Entry<AppointmentStatus, Long> entry : countsByStatus.entrySet()) {
      result.add(new DashboardSnapshotDTO.StatusCountDTO(entry.getKey().name(), entry.getValue()));
    }
    return result;
  }

  @Override
  public List<DashboardSnapshotDTO.DentistCountDTO> getAppointmentsByDentist() {
    List<Object[]> rows = appointmentRepository.countGroupedByDentist(null, null, null);

    List<DashboardSnapshotDTO.DentistCountDTO> sorted = new ArrayList<>();
    for (Object[] row : rows) {
      Long dentistId = (Long) row[0];
      String dentistName = (String) row[1];
      Long count = (Long) row[2];
      sorted.add(new DashboardSnapshotDTO.DentistCountDTO(dentistId, dentistName, count));
    }

    sorted.sort(
        Comparator.comparing(
                DashboardSnapshotDTO.DentistCountDTO::getCount, Comparator.reverseOrder())
            .thenComparing(DashboardSnapshotDTO.DentistCountDTO::getDentistName));

    if (sorted.size() <= DENTIST_BREAKDOWN_TOP_N) {
      return sorted;
    }

    List<DashboardSnapshotDTO.DentistCountDTO> topDentists =
        new ArrayList<>(sorted.subList(0, DENTIST_BREAKDOWN_TOP_N));

    long overflowCount = 0L;
    for (int i = DENTIST_BREAKDOWN_TOP_N; i < sorted.size(); i++) {
      overflowCount += sorted.get(i).getCount();
    }
    topDentists.add(new DashboardSnapshotDTO.DentistCountDTO(null, "Otros", overflowCount));

    return topDentists;
  }
}
