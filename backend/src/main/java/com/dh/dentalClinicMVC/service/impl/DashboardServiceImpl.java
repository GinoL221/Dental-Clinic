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
  private static final int MAX_MONTH_BUCKETS = 24;

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
  public Map<String, Object> getDashboardStatistics(LocalDate from, LocalDate to, Long dentistId) {
    Map<String, Object> stats = new HashMap<>();

    // totalAppointments narrowa al filtro activo; totalDentists/totalPatients permanecen
    // globales porque no son datos derivados de citas.
    long totalAppointments = appointmentRepository.countFiltered(from, to, dentistId);
    long totalDentists = dentistRepository.count();
    long totalPatients = patientRepository.count();

    stats.put("totalAppointments", totalAppointments);
    stats.put("totalDentists", totalDentists);
    stats.put("totalPatients", totalPatients);

    // Citas de hoy: 0 si hoy queda fuera de [from, to], si no, narrowa al filtro activo.
    LocalDate today = LocalDate.now();
    long todayAppointments;
    if ((from != null && today.isBefore(from)) || (to != null && today.isAfter(to))) {
      todayAppointments = 0L;
    } else {
      todayAppointments = appointmentRepository.countFiltered(today, today, dentistId);
    }
    stats.put("todayAppointments", todayAppointments);

    // Fecha de última actualización
    stats.put("lastUpdated", today.toString());

    return stats;
  }

  @Override
  public Map<String, Object> getAppointmentsByMonth(LocalDate from, LocalDate to, Long dentistId) {
    Map<String, Object> data = new HashMap<>();

    List<String> months = new ArrayList<>();
    List<Long> appointmentCounts = new ArrayList<>();

    LocalDate[] range = resolveMonthlyRange(from, to);
    List<LocalDate> monthBuckets = buildMonthBuckets(range[0], range[1]);

    for (LocalDate monthStart : monthBuckets) {
      String monthName =
          monthStart.getMonth().getDisplayName(TextStyle.SHORT, Locale.forLanguageTag("es"));

      // Calcular primer y último día del mes
      LocalDate firstDay = monthStart.withDayOfMonth(1);
      LocalDate lastDay = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

      // Sin dentistId activo, se preserva la consulta histórica countByDateBetween tal cual
      // (byte-equivalente cuando from/to/dentistId son null); con dentistId activo, se usa la
      // consulta filtrada.
      long count =
          dentistId == null
              ? appointmentRepository.countByDateBetween(firstDay, lastDay)
              : appointmentRepository.countFiltered(firstDay, lastDay, dentistId);

      months.add(monthName + " " + monthStart.getYear());
      appointmentCounts.add(count);
    }

    data.put("months", months);
    data.put("appointmentCounts", appointmentCounts);

    return data;
  }

  private LocalDate[] resolveMonthlyRange(LocalDate from, LocalDate to) {
    LocalDate today = LocalDate.now();
    if (from == null && to == null) {
      return new LocalDate[] {today.minusMonths(5), today};
    }
    if (to == null) {
      return new LocalDate[] {from, today};
    }
    if (from == null) {
      return new LocalDate[] {to.minusMonths(5), to};
    }
    return new LocalDate[] {from, to};
  }

  private List<LocalDate> buildMonthBuckets(LocalDate rangeStart, LocalDate rangeEnd) {
    LocalDate cursor = rangeStart.withDayOfMonth(1);
    LocalDate lastBucket = rangeEnd.withDayOfMonth(1);

    List<LocalDate> buckets = new ArrayList<>();
    while (!cursor.isAfter(lastBucket)) {
      buckets.add(cursor);
      cursor = cursor.plusMonths(1);
    }

    if (buckets.size() > MAX_MONTH_BUCKETS) {
      buckets =
          new ArrayList<>(buckets.subList(buckets.size() - MAX_MONTH_BUCKETS, buckets.size()));
    }

    return buckets;
  }

  @Override
  public Map<String, Object> getUpcomingAppointments(LocalDate from, LocalDate to, Long dentistId) {
    Map<String, Object> data = new HashMap<>();

    LocalDate today = LocalDate.now();
    LocalDate effectiveFrom = (from != null && from.isAfter(today)) ? from : today;

    // Obtener citas de hoy y próximos días, respetando el filtro opcional to/dentistId
    List<Object[]> upcomingAppointments =
        appointmentRepository.findUpcomingAppointmentsFiltered(effectiveFrom, to, dentistId);

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
  public List<DashboardSnapshotDTO.StatusCountDTO> getAppointmentsByStatus(
      LocalDate from, LocalDate to, Long dentistId) {
    Map<AppointmentStatus, Long> countsByStatus = new LinkedHashMap<>();
    for (AppointmentStatus status : AppointmentStatus.values()) {
      countsByStatus.put(status, 0L);
    }

    List<Object[]> rows = appointmentRepository.countGroupedByStatus(from, to, dentistId);
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
  public List<DashboardSnapshotDTO.DentistCountDTO> getAppointmentsByDentist(
      LocalDate from, LocalDate to, Long dentistId) {
    List<Object[]> rows = appointmentRepository.countGroupedByDentist(from, to, dentistId);

    List<DashboardSnapshotDTO.DentistCountDTO> sorted = new ArrayList<>();
    for (Object[] row : rows) {
      Long rowDentistId = (Long) row[0];
      String dentistName = (String) row[1];
      Long count = (Long) row[2];
      sorted.add(new DashboardSnapshotDTO.DentistCountDTO(rowDentistId, dentistName, count));
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
