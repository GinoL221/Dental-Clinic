package com.dh.dentalClinicMVC.configuration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("e2e")
@TestPropertySource(
    properties = {
      "app.jwt.secret=dGVzdFNlY3JldEtleUZvclRlc3RpbmdPbmx5MTIzNDU2Nzg=",
      "e2e.admin-email=e2e-admin@test.com",
      "e2e.admin-password=admin-password",
      "e2e.non-admin-email=e2e-patient@test.com",
      "e2e.non-admin-password=patient-password"
    })
class E2eProfileIntegrationTest {
  private static final String ADMIN_EMAIL = "e2e-admin@test.com";
  private static final String ADMIN_PASSWORD = "admin-password";
  private static final String PATIENT_EMAIL = "e2e-patient@test.com";
  private static final String PATIENT_PASSWORD = "patient-password";

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private IUserRepository userRepository;
  @Autowired private IDentistRepository dentistRepository;
  @Autowired private IPatientRepository patientRepository;
  @Autowired private IAppointmentRepository appointmentRepository;
  @Autowired private E2eDataInitializer initializer;

  @Test
  @Transactional
  void reinitializingAfterAppointmentRemovalRestoresOneStableFixtureSet() {
    Appointment first = appointmentRepository.findAll().stream().findFirst().orElseThrow();
    long users = userRepository.count();
    long dentists = dentistRepository.count();
    long patients = patientRepository.count();
    String description = first.getDescription();
    LocalDate date = first.getDate();
    String time = first.getTime().toString();

    appointmentRepository.deleteById(first.getId());
    appointmentRepository.flush();
    newInitializerRun();

    Appointment second = appointmentRepository.findAll().stream().findFirst().orElseThrow();
    assertEquals(users, userRepository.count());
    assertEquals(dentists, dentistRepository.count());
    assertEquals(patients, patientRepository.count());
    assertEquals(1, appointmentRepository.count());
    assertEquals(description, second.getDescription());
    assertEquals(date, second.getDate());
    assertEquals(time, second.getTime().toString());
  }

  @Test
  void e2eSeedsMinimumRolesAndOneFutureUtcAppointment() {
    assertRole(ADMIN_EMAIL, Role.ADMIN);
    assertRole(PATIENT_EMAIL, Role.PATIENT);
    assertRole("e2e.dentist@dentalclinic.test", Role.DENTIST);
    Appointment appointment = appointmentRepository.findAll().stream().findFirst().orElseThrow();

    assertEquals(3, userRepository.count());
    assertEquals(1, dentistRepository.count());
    assertEquals(1, patientRepository.count());
    assertEquals(1, appointmentRepository.count());
    assertTrue(appointment.getDate().isAfter(LocalDate.now(ZoneOffset.UTC)));
    assertTrue(appointment.getDate().getDayOfWeek().getValue() < 6);
    assertEquals("E2E seeded appointment", appointment.getDescription());
  }

  @Test
  void authMeReturnsTheSeededAdminProfile() throws Exception {
    String token = login(ADMIN_EMAIL, ADMIN_PASSWORD);

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value(ADMIN_EMAIL))
        .andExpect(jsonPath("$.role").value("ADMIN"));
  }

  @Test
  void appointmentEndpointReturnsPersistedDtoEvidence() throws Exception {
    Appointment appointment = appointmentRepository.findAll().stream().findFirst().orElseThrow();
    String token = login(ADMIN_EMAIL, ADMIN_PASSWORD);

    mockMvc
        .perform(
            get("/appointments/{id}", appointment.getId())
                .header("Authorization", "Bearer " + token)
                .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(appointment.getId()))
        .andExpect(jsonPath("$.patient_id").value(appointment.getPatient().getId()))
        .andExpect(jsonPath("$.dentist_id").value(appointment.getDentist().getId()))
        .andExpect(jsonPath("$.date").value(appointment.getDate().toString()))
        .andExpect(jsonPath("$.time").value("10:00"))
        .andExpect(jsonPath("$.description").value("E2E seeded appointment"))
        .andExpect(jsonPath("$.status").value("SCHEDULED"));
  }

  @Test
  void nonAdminCannotReadDashboardSnapshot() throws Exception {
    String token = login(PATIENT_EMAIL, PATIENT_PASSWORD);

    mockMvc
        .perform(get("/dashboard/snapshot").header("Authorization", "Bearer " + token))
        .andExpect(status().isForbidden());
  }

  private void assertRole(String email, Role role) {
    assertEquals(role, userRepository.findByEmail(email).orElseThrow().getRole());
  }

  private String login(String email, String password) throws Exception {
    String body =
        mockMvc
            .perform(
                post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            Map.of("email", email, "password", password))))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    JsonNode response = objectMapper.readTree(body);
    assertFalse(response.get("token").asText().isBlank());
    return response.get("token").asText();
  }

  private void newInitializerRun() {
    try {
      initializer.run(new DefaultApplicationArguments());
    } catch (Exception exception) {
      throw new AssertionError("E2E initializer rerun failed", exception);
    }
  }
}
