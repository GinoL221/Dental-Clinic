package com.dh.dentalClinicMVC.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import com.dh.dentalClinicMVC.dto.DashboardSnapshotDTO;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DashboardServiceImplTest {

  @Mock private IAppointmentRepository appointmentRepository;
  @Mock private IDentistRepository dentistRepository;
  @Mock private IPatientRepository patientRepository;

  private DashboardServiceImpl service;

  @BeforeEach
  void setUp() {
    service = new DashboardServiceImpl(appointmentRepository, dentistRepository, patientRepository);
  }

  // ---- getAppointmentsByStatus() ----

  @Test
  void shouldZeroFillMissingStatusesInEnumOrderWhenOnlyOneStatusHasActivity() {
    when(appointmentRepository.countGroupedByStatus(null, null, null))
        .thenReturn(List.<Object[]>of(new Object[] {AppointmentStatus.SCHEDULED, 5L}));

    List<DashboardSnapshotDTO.StatusCountDTO> result = service.getAppointmentsByStatus();

    assertEquals(4, result.size());
    assertEquals("SCHEDULED", result.get(0).getStatus());
    assertEquals(5L, result.get(0).getCount());
    assertEquals("IN_PROGRESS", result.get(1).getStatus());
    assertEquals(0L, result.get(1).getCount());
    assertEquals("COMPLETED", result.get(2).getStatus());
    assertEquals(0L, result.get(2).getCount());
    assertEquals("CANCELLED", result.get(3).getStatus());
    assertEquals(0L, result.get(3).getCount());
  }

  @Test
  void shouldReturnAllFourStatusesAtZeroWhenNoAppointmentsMatch() {
    when(appointmentRepository.countGroupedByStatus(null, null, null)).thenReturn(List.of());

    List<DashboardSnapshotDTO.StatusCountDTO> result = service.getAppointmentsByStatus();

    assertEquals(4, result.size());
    result.forEach(entry -> assertEquals(0L, entry.getCount()));
  }

  // ---- getAppointmentsByDentist() ----

  @Test
  void shouldReturnAllActiveDentistsWhenEightHaveActivityAndNoOverflowOccurs() {
    List<Object[]> rows = new ArrayList<>();
    for (int i = 1; i <= 8; i++) {
      rows.add(new Object[] {(long) i, "Dentist " + String.format("%02d", i), (long) (30 - i)});
    }
    when(appointmentRepository.countGroupedByDentist(null, null, null)).thenReturn(rows);

    List<DashboardSnapshotDTO.DentistCountDTO> result = service.getAppointmentsByDentist();

    assertEquals(8, result.size());
    assertEquals("Dentist 01", result.get(0).getDentistName());
    assertEquals(29L, result.get(0).getCount());
    assertEquals("Dentist 08", result.get(7).getDentistName());
    assertEquals(22L, result.get(7).getCount());
  }

  @Test
  void shouldCapAtTop10AndAggregateOverflowIntoOtrosWhen14DentistsAreActive() {
    List<Object[]> rows = new ArrayList<>();
    for (int i = 1; i <= 14; i++) {
      rows.add(new Object[] {(long) i, "Dentist " + String.format("%02d", i), (long) (30 - i)});
    }
    when(appointmentRepository.countGroupedByDentist(null, null, null)).thenReturn(rows);

    List<DashboardSnapshotDTO.DentistCountDTO> result = service.getAppointmentsByDentist();

    assertEquals(11, result.size());
    assertEquals("Dentist 01", result.get(0).getDentistName());
    assertEquals("Dentist 10", result.get(9).getDentistName());
    assertEquals("Otros", result.get(10).getDentistName());
    assertEquals(null, result.get(10).getDentistId());

    long expectedOverflow = 0L;
    for (int i = 11; i <= 14; i++) {
      expectedOverflow += 30 - i;
    }
    assertEquals(expectedOverflow, result.get(10).getCount());

    long totalFromRows = rows.stream().mapToLong(row -> (Long) row[2]).sum();
    long totalFromBreakdown =
        result.stream().mapToLong(DashboardSnapshotDTO.DentistCountDTO::getCount).sum();
    assertEquals(totalFromRows, totalFromBreakdown);
  }

  @Test
  void shouldBreakTiedCountsByNameAscending() {
    when(appointmentRepository.countGroupedByDentist(null, null, null))
        .thenReturn(
            List.of(new Object[] {2L, "Beatriz Ruiz", 5L}, new Object[] {1L, "Ana Gomez", 5L}));

    List<DashboardSnapshotDTO.DentistCountDTO> result = service.getAppointmentsByDentist();

    assertEquals(2, result.size());
    assertEquals("Ana Gomez", result.get(0).getDentistName());
    assertEquals("Beatriz Ruiz", result.get(1).getDentistName());
  }

  @Test
  void shouldReturnEmptyDentistBreakdownWhenNoAppointmentsMatch() {
    when(appointmentRepository.countGroupedByDentist(null, null, null)).thenReturn(List.of());

    List<DashboardSnapshotDTO.DentistCountDTO> result = service.getAppointmentsByDentist();

    assertEquals(0, result.size());
  }

  // ---- 1.4 SAFETY NET: characterization test for getAppointmentsByMonth() ----
  // Pins CURRENT behavior. Must pass UNMODIFIED against today's implementation —
  // this is the byte-equivalence guard that slice 2's refactor must not break.

  @Test
  void shouldPreserveCurrentMonthlyDefaultOutputAndCallOrder() {
    LocalDate currentDate = LocalDate.now();
    List<String> expectedMonths = new ArrayList<>();
    List<LocalDate[]> expectedRanges = new ArrayList<>();

    for (int i = 5; i >= 0; i--) {
      LocalDate monthDate = currentDate.minusMonths(i);
      String monthName =
          monthDate.getMonth().getDisplayName(TextStyle.SHORT, Locale.forLanguageTag("es"));
      LocalDate firstDay = monthDate.withDayOfMonth(1);
      LocalDate lastDay = monthDate.withDayOfMonth(monthDate.lengthOfMonth());

      expectedMonths.add(monthName + " " + monthDate.getYear());
      expectedRanges.add(new LocalDate[] {firstDay, lastDay});
    }

    for (int idx = 0; idx < expectedRanges.size(); idx++) {
      LocalDate[] range = expectedRanges.get(idx);
      when(appointmentRepository.countByDateBetween(range[0], range[1])).thenReturn((long) idx);
    }

    Map<String, Object> result = service.getAppointmentsByMonth();

    assertEquals(expectedMonths, result.get("months"));
    assertEquals(List.of(0L, 1L, 2L, 3L, 4L, 5L), result.get("appointmentCounts"));

    InOrder inOrder = Mockito.inOrder(appointmentRepository);
    for (LocalDate[] range : expectedRanges) {
      inOrder.verify(appointmentRepository).countByDateBetween(range[0], range[1]);
    }
  }
}
