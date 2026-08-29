package com.dh.dentalClinicMVC.dto;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class AppointmentResponseMapperTest {

  @Test
  void toDTO_mapsAllFieldsWithResponseFormats() {
    Patient patient = new Patient();
    patient.setId(11L);
    Dentist dentist = new Dentist();
    dentist.setId(22L);

    Appointment appointment = new Appointment();
    appointment.setId(7L);
    appointment.setPatient(patient);
    appointment.setDentist(dentist);
    appointment.setDate(LocalDate.of(2026, 8, 28));
    appointment.setTime(LocalTime.of(9, 5));
    appointment.setDescription("Dental cleaning");
    appointment.setStatus(AppointmentStatus.IN_PROGRESS);

    AppointmentDTO result = AppointmentResponseMapper.toDTO(appointment);

    assertEquals(7L, result.getId());
    assertEquals(22L, result.getDentist_id());
    assertEquals(11L, result.getPatient_id());
    assertEquals("2026-08-28", result.getDate());
    assertEquals("09:05", result.getTime());
    assertEquals("Dental cleaning", result.getDescription());
    assertEquals("IN_PROGRESS", result.getStatus());
  }

  @Test
  void toDTO_preservesNullDescription() {
    Patient patient = new Patient();
    patient.setId(11L);
    Dentist dentist = new Dentist();
    dentist.setId(22L);

    Appointment appointment = new Appointment();
    appointment.setPatient(patient);
    appointment.setDentist(dentist);
    appointment.setDate(LocalDate.of(2026, 8, 28));
    appointment.setTime(LocalTime.of(9, 5));
    appointment.setDescription(null);
    appointment.setStatus(AppointmentStatus.SCHEDULED);

    AppointmentDTO result = AppointmentResponseMapper.toDTO(appointment);

    assertNull(result.getDescription());
  }

  private static Appointment buildAppointment(
      Long id, Long patientId, Long dentistId, LocalDate date, LocalTime time) {
    Patient patient = new Patient();
    patient.setId(patientId);
    Dentist dentist = new Dentist();
    dentist.setId(dentistId);

    Appointment appointment = new Appointment();
    appointment.setId(id);
    appointment.setPatient(patient);
    appointment.setDentist(dentist);
    appointment.setDate(date);
    appointment.setTime(time);
    appointment.setDescription("Checkup " + id);
    appointment.setStatus(AppointmentStatus.SCHEDULED);
    return appointment;
  }

  @Test
  void toDTOs_returnsEmptyListForEmptyInput() {
    List<AppointmentDTO> result = AppointmentResponseMapper.toDTOs(List.of());

    assertNotNull(result);
    assertTrue(result.isEmpty());
  }

  @Test
  void toDTOs_preservesSourceOrderForMultipleElements() {
    List<Appointment> appointments =
        List.of(
            buildAppointment(1L, 11L, 21L, LocalDate.of(2026, 8, 28), LocalTime.of(9, 0)),
            buildAppointment(2L, 12L, 22L, LocalDate.of(2026, 8, 29), LocalTime.of(10, 0)),
            buildAppointment(3L, 13L, 23L, LocalDate.of(2026, 8, 30), LocalTime.of(11, 0)));

    List<AppointmentDTO> result = AppointmentResponseMapper.toDTOs(appointments);

    assertEquals(3, result.size());
    assertEquals(1L, result.get(0).getId());
    assertEquals(2L, result.get(1).getId());
    assertEquals(3L, result.get(2).getId());
  }

  @Test
  void toDTOs_appliesToDTOFormattingToEveryElement() {
    List<Appointment> appointments =
        List.of(
            buildAppointment(1L, 11L, 21L, LocalDate.of(2026, 8, 28), LocalTime.of(9, 5)),
            buildAppointment(2L, 12L, 22L, LocalDate.of(2026, 9, 1), LocalTime.of(14, 30)));

    List<AppointmentDTO> result = AppointmentResponseMapper.toDTOs(appointments);

    assertEquals("2026-08-28", result.get(0).getDate());
    assertEquals("09:05", result.get(0).getTime());
    assertEquals("SCHEDULED", result.get(0).getStatus());
    assertEquals("2026-09-01", result.get(1).getDate());
    assertEquals("14:30", result.get(1).getTime());
    assertEquals("SCHEDULED", result.get(1).getStatus());
  }

  @Test
  void toDTOs_returnsMutableList() {
    List<Appointment> appointments =
        new ArrayList<>(
            List.of(buildAppointment(1L, 11L, 21L, LocalDate.of(2026, 8, 28), LocalTime.of(9, 0))));

    List<AppointmentDTO> result = AppointmentResponseMapper.toDTOs(appointments);

    assertDoesNotThrow(
        () -> {
          result.add(AppointmentDTO.builder().id(99L).build());
          result.remove(0);
        });
    assertEquals(1, result.size());
    assertEquals(99L, result.get(0).getId());
  }
}
