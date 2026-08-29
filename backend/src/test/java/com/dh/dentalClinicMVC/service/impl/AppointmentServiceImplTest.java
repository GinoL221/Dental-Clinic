package com.dh.dentalClinicMVC.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.exception.InvalidPrincipalRoleException;
import com.dh.dentalClinicMVC.exception.StalePrincipalException;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceImplTest {

  @Mock private IAppointmentRepository appointmentRepository;
  @Mock private IDentistRepository dentistRepository;
  @Mock private IPatientRepository patientRepository;
  @Mock private AppointmentSearchQuery query;
  @Mock private AppointmentScheduleValidator scheduleValidator;

  private AppointmentServiceImpl service;

  @BeforeEach
  void setUp() {
    service =
        new AppointmentServiceImpl(
            appointmentRepository, dentistRepository, patientRepository, query, scheduleValidator);
  }

  private static Appointment buildAppointment(Long id, Long patientId, Long dentistId) {
    Patient patient = new Patient();
    patient.setId(patientId);
    Dentist dentist = new Dentist();
    dentist.setId(dentistId);

    Appointment appointment = new Appointment();
    appointment.setId(id);
    appointment.setPatient(patient);
    appointment.setDentist(dentist);
    appointment.setDate(LocalDate.of(2026, 8, 28));
    appointment.setTime(LocalTime.of(9, 0));
    appointment.setDescription("Checkup " + id);
    appointment.setStatus(AppointmentStatus.SCHEDULED);
    return appointment;
  }

  // ---- findAll() ----

  @Test
  void findAll_returnsDTOsInRepositoryOrder() {
    Appointment first = buildAppointment(1L, 11L, 21L);
    Appointment second = buildAppointment(2L, 12L, 22L);
    when(appointmentRepository.findAll()).thenReturn(List.of(first, second));

    List<AppointmentDTO> result = service.findAll();

    assertEquals(2, result.size());
    assertEquals(1L, result.get(0).getId());
    assertEquals(2L, result.get(1).getId());
  }

  @Test
  void findAll_returnsEmptyListWhenNoAppointments() {
    when(appointmentRepository.findAll()).thenReturn(List.of());

    List<AppointmentDTO> result = service.findAll();

    assertNotNull(result);
    assertTrue(result.isEmpty());
  }

  @Test
  void findAll_returnsMutableList() {
    when(appointmentRepository.findAll()).thenReturn(List.of(buildAppointment(1L, 11L, 21L)));

    List<AppointmentDTO> result = service.findAll();

    result.add(AppointmentDTO.builder().id(99L).build());

    assertEquals(2, result.size());
  }

  // ---- findAllForCurrentUser() ----

  @Test
  void findAllForCurrentUser_returnsAllAppointmentsForAdmin() {
    Appointment appointment = buildAppointment(1L, 11L, 21L);
    when(appointmentRepository.findAll()).thenReturn(List.of(appointment));

    List<AppointmentDTO> result = service.findAllForCurrentUser("admin@dh.com", Role.ADMIN);

    assertEquals(1, result.size());
    assertEquals(1L, result.get(0).getId());
    verifyNoInteractions(patientRepository, dentistRepository);
  }

  @Test
  void findAllForCurrentUser_returnsOnlyPatientAppointmentsForPatient() {
    Patient patient = new Patient();
    patient.setId(11L);
    Appointment appointment = buildAppointment(1L, 11L, 21L);
    when(patientRepository.findByEmail("patient@dh.com")).thenReturn(Optional.of(patient));
    when(appointmentRepository.findByPatient_Id(11L)).thenReturn(List.of(appointment));

    List<AppointmentDTO> result = service.findAllForCurrentUser("patient@dh.com", Role.PATIENT);

    assertEquals(1, result.size());
    assertEquals(1L, result.get(0).getId());
  }

  @Test
  void findAllForCurrentUser_returnsOnlyDentistAppointmentsForDentist() {
    Dentist dentist = new Dentist();
    dentist.setId(21L);
    Appointment appointment = buildAppointment(1L, 11L, 21L);
    when(dentistRepository.findByEmail("dentist@dh.com")).thenReturn(Optional.of(dentist));
    when(appointmentRepository.findByDentist_Id(21L)).thenReturn(List.of(appointment));

    List<AppointmentDTO> result = service.findAllForCurrentUser("dentist@dh.com", Role.DENTIST);

    assertEquals(1, result.size());
    assertEquals(1L, result.get(0).getId());
  }

  @Test
  void findAllForCurrentUser_throwsStalePrincipalExceptionWhenPatientRowMissing() {
    when(patientRepository.findByEmail("ghost@dh.com")).thenReturn(Optional.empty());

    assertThrows(
        StalePrincipalException.class,
        () -> service.findAllForCurrentUser("ghost@dh.com", Role.PATIENT));
  }

  @Test
  void findAllForCurrentUser_throwsStalePrincipalExceptionWhenDentistRowMissing() {
    when(dentistRepository.findByEmail("ghost@dh.com")).thenReturn(Optional.empty());

    assertThrows(
        StalePrincipalException.class,
        () -> service.findAllForCurrentUser("ghost@dh.com", Role.DENTIST));
  }

  // appointment-role-null-hardening, Phase 5: a null (or otherwise unrecognized) role MUST
  // NOT fall through to the ADMIN-equivalent findAll() branch. verifyNoInteractions proves
  // the unrestricted appointment collection is never touched for a null-role principal.
  @Test
  void findAllForCurrentUser_throwsInvalidPrincipalRoleWhenRoleIsNull() {
    assertThrows(
        InvalidPrincipalRoleException.class,
        () -> service.findAllForCurrentUser("corrupt@dh.com", null));

    verifyNoInteractions(appointmentRepository, patientRepository, dentistRepository);
  }
}
