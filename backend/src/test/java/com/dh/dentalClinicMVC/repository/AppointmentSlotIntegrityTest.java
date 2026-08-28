package com.dh.dentalClinicMVC.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Locale;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

@DataJpaTest
class AppointmentSlotIntegrityTest {
  private static final String ACTIVE_SLOT_CONSTRAINT = "uk_appointment_active_dentist_slot";
  private static final LocalDate SLOT_DATE = LocalDate.of(2099, 1, 5);

  @Autowired private IAppointmentRepository appointmentRepository;
  @Autowired private IDentistRepository dentistRepository;
  @Autowired private IPatientRepository patientRepository;

  @Test
  void rejectsTwoActiveAppointmentsForTheSameDentistAndSlot() {
    Dentist dentist = saveDentist();
    Patient firstPatient = savePatient(10001);
    Patient secondPatient = savePatient(10002);

    appointmentRepository.saveAndFlush(
        appointment(dentist, firstPatient, LocalTime.of(10, 0), AppointmentStatus.SCHEDULED));

    DataIntegrityViolationException exception =
        assertThrows(
            DataIntegrityViolationException.class,
            () ->
                appointmentRepository.saveAndFlush(
                    appointment(
                        dentist, secondPatient, LocalTime.of(10, 0), AppointmentStatus.SCHEDULED)));

    assertConstraintName(exception);
  }

  @Test
  void allowsCancelledAppointmentsToShareSlotAndCoexistWithActiveAppointment() {
    Dentist dentist = saveDentist();
    Patient firstPatient = savePatient(10003);
    Patient secondPatient = savePatient(10004);
    Patient activePatient = savePatient(10005);

    appointmentRepository.saveAndFlush(
        appointment(dentist, firstPatient, LocalTime.of(11, 0), AppointmentStatus.CANCELLED));
    appointmentRepository.saveAndFlush(
        appointment(dentist, secondPatient, LocalTime.of(11, 0), AppointmentStatus.CANCELLED));
    appointmentRepository.saveAndFlush(
        appointment(dentist, activePatient, LocalTime.of(11, 0), AppointmentStatus.SCHEDULED));

    assertEquals(3, appointmentRepository.count());
  }

  @Test
  void rejectsUpdatingAnActiveAppointmentIntoAnOccupiedActiveSlot() {
    Dentist dentist = saveDentist();
    Patient firstPatient = savePatient(10006);
    Patient secondPatient = savePatient(10007);
    Appointment firstAppointment =
        appointmentRepository.saveAndFlush(
            appointment(dentist, firstPatient, LocalTime.of(12, 0), AppointmentStatus.SCHEDULED));
    appointmentRepository.saveAndFlush(
        appointment(dentist, secondPatient, LocalTime.of(13, 0), AppointmentStatus.SCHEDULED));

    firstAppointment.setTime(LocalTime.of(13, 0));
    DataIntegrityViolationException exception =
        assertThrows(
            DataIntegrityViolationException.class,
            () -> appointmentRepository.saveAndFlush(firstAppointment));

    assertConstraintName(exception);
  }

  private Appointment appointment(
      Dentist dentist, Patient patient, LocalTime time, AppointmentStatus status) {
    Appointment appointment = new Appointment();
    appointment.setDentist(dentist);
    appointment.setPatient(patient);
    appointment.setDate(SLOT_DATE);
    appointment.setTime(time);
    appointment.setStatus(status);
    appointment.setDescription("Slot integrity test");
    return appointment;
  }

  private Dentist saveDentist() {
    Dentist dentist = new Dentist();
    dentist.setFirstName("Slot");
    dentist.setLastName("Dentist");
    dentist.setEmail("slot-dentist@example.com");
    dentist.setPassword("password");
    dentist.setRole(Role.DENTIST);
    dentist.setRegistrationNumber(90001);
    return dentistRepository.saveAndFlush(dentist);
  }

  private Patient savePatient(int cardIdentity) {
    Patient patient = new Patient();
    patient.setFirstName("Slot");
    patient.setLastName("Patient");
    patient.setEmail("slot-patient-" + cardIdentity + "@example.com");
    patient.setPassword("password");
    patient.setRole(Role.PATIENT);
    patient.setCardIdentity(cardIdentity);
    patient.setAdmissionDate(LocalDate.of(2024, 1, 1));
    return patientRepository.saveAndFlush(patient);
  }

  private void assertConstraintName(DataIntegrityViolationException exception) {
    String message = exception.getMessage();
    assertNotNull(message);
    assertTrue(
        message.toLowerCase(Locale.ROOT).contains(ACTIVE_SLOT_CONSTRAINT),
        () -> "Expected named active-slot constraint in: " + message);
  }
}
