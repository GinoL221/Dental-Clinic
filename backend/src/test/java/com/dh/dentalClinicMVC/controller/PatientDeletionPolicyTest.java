package com.dh.dentalClinicMVC.controller;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

// S3 (frontend-debt-and-cascade T3): deleting a PATIENT that has appointments must be
// BLOCKED with a structured 409 (same policy as the dentist), not cascaded. Covers:
// (a) patient without appointments still deletes (204);
// (b) patient with an appointment gets 409 with the ErrorResponse contract;
// (c) the appointment (and the patient) survive the failed deletion.
//
// Uses the full security filter chain (same rationale as PatientControllerAuthzTest:
// the delete endpoint returns ResponseEntity<Void> and the policy surfaces through the
// GlobalExceptionHandler, so we integrate through the controller with real security).
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class PatientDeletionPolicyTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private IPatientRepository patientRepository;

  @Autowired private IDentistRepository dentistRepository;

  @Autowired private IAppointmentRepository appointmentRepository;

  private Patient seedPatient(String email, int cardIdentity) {
    Patient patient = new Patient();
    patient.setEmail(email);
    patient.setFirstName("Paciente");
    patient.setLastName(email);
    patient.setPassword("irrelevant-hash");
    patient.setRole(Role.PATIENT);
    patient.setCardIdentity(cardIdentity);
    patient.setAdmissionDate(LocalDate.now());
    return patientRepository.save(patient);
  }

  private Dentist seedDentist(String email, int registrationNumber) {
    Dentist dentist = new Dentist();
    dentist.setEmail(email);
    dentist.setFirstName("Dr");
    dentist.setLastName(email);
    dentist.setPassword("irrelevant-hash");
    dentist.setRole(Role.DENTIST);
    dentist.setRegistrationNumber(registrationNumber);
    return dentistRepository.save(dentist);
  }

  private Appointment seedAppointment(Patient patient, Dentist dentist, LocalTime time) {
    Appointment appointment = new Appointment();
    appointment.setPatient(patient);
    appointment.setDentist(dentist);
    appointment.setDate(
        LocalDate.now()
            .with(java.time.temporal.TemporalAdjusters.next(java.time.DayOfWeek.MONDAY)));
    appointment.setTime(time);
    appointment.setDescription("Turno de control");
    return appointmentRepository.save(appointment);
  }

  private static RequestPostProcessor authAsAdmin() {
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(
        new UsernamePasswordAuthenticationToken(
            "admin@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
    return SecurityMockMvcRequestPostProcessors.securityContext(context);
  }

  // (a) Patient WITHOUT appointments deletes normally: 204 and the row is gone.
  @Test
  public void whenDeletePatientWithoutAppointments_thenNoContent() throws Exception {
    Patient patient = seedPatient("delete-clean@test.com", 91001);

    mockMvc
        .perform(delete("/patients/{id}", patient.getId()).with(csrf()).with(authAsAdmin()))
        .andExpect(status().isNoContent());

    assertNull(
        patientRepository.findById(patient.getId()).orElse(null),
        "Patient without appointments must be deleted");
  }

  // (b) Patient WITH an appointment cannot be deleted: 409 with the ErrorResponse contract.
  @Test
  public void whenDeletePatientWithAppointment_thenConflict() throws Exception {
    Patient patient = seedPatient("delete-with-turno@test.com", 91002);
    Dentist dentist = seedDentist("deletion-block-dentist@test.com", 91002);
    seedAppointment(patient, dentist, LocalTime.of(10, 0));

    mockMvc
        .perform(delete("/patients/{id}", patient.getId()).with(csrf()).with(authAsAdmin()))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.error").value("Recurso en uso"))
        .andExpect(jsonPath("$.status").value(409))
        .andExpect(
            jsonPath("$.message")
                .value("El paciente tiene turnos asociados y no puede eliminarse"));
  }

  // (c) The appointment SURVIVES the failed deletion (data unchanged rule).
  @Test
  public void whenPatientDeletionBlocked_thenAppointmentSurvives() throws Exception {
    Patient patient = seedPatient("surviving-turno@test.com", 91003);
    Dentist dentist = seedDentist("deletion-survive-dentist@test.com", 91003);
    Appointment appointment = seedAppointment(patient, dentist, LocalTime.of(11, 0));

    mockMvc
        .perform(delete("/patients/{id}", patient.getId()).with(csrf()).with(authAsAdmin()))
        .andExpect(status().isConflict());

    assertNotNull(
        appointmentRepository.findById(appointment.getId()).orElse(null),
        "The appointment must survive the failed patient deletion");
    assertNotNull(
        patientRepository.findById(patient.getId()).orElse(null),
        "The patient must survive the failed deletion");
    assertTrue(
        !appointmentRepository.findByPatient_Id(patient.getId()).isEmpty(),
        "The patient must still own the appointment after the blocked deletion");
    assertFalse(
        patientRepository.findById(patient.getId()).isEmpty(),
        "The patient row must remain after the blocked deletion");
  }
}
