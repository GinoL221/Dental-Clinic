package com.dh.dentalClinicMVC.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import java.time.LocalDate;
import java.time.LocalTime;
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
}
