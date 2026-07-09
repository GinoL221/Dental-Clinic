package com.dh.dentalClinicMVC.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.dto.AppointmentRequestDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
public class AppointmentControllerTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  private String createDentistAsAdmin(int regNum, String email) throws Exception {
    Map<String, Object> dentist = new HashMap<>();
    dentist.put("registrationNumber", regNum);
    dentist.put("firstName", "Dr");
    dentist.put("lastName", "Test");
    dentist.put("email", email);

    String response =
        mockMvc
            .perform(
                post("/dentists")
                    .with(csrf())
                    .with(adminRequestPostProcessor())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(dentist)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

    return objectMapper.readTree(response).get("id").asText();
  }

  private String createPatientAsAdmin(int cardId, String email) throws Exception {
    Map<String, Object> patient = new HashMap<>();
    patient.put("cardIdentity", cardId);
    patient.put("firstName", "Test");
    patient.put("lastName", "Patient");
    patient.put("email", email);
    patient.put("admissionDate", LocalDate.now().toString());

    String response =
        mockMvc
            .perform(
                post("/patients")
                    .with(csrf())
                    .with(adminRequestPostProcessor())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(patient)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();

    return objectMapper.readTree(response).get("id").asText();
  }

  private void createAppointmentAsAdmin(String dentistId, String patientId, String description)
      throws Exception {
    createAppointmentAsAdminAndGetId(dentistId, patientId, description);
  }

  private String createAppointmentAsAdminAndGetId(
      String dentistId, String patientId, String description) throws Exception {
    AppointmentRequestDTO appointment =
        new AppointmentRequestDTO(
            Long.parseLong(dentistId),
            Long.parseLong(patientId),
            LocalDate.now()
                .with(java.time.temporal.TemporalAdjusters.next(java.time.DayOfWeek.MONDAY))
                .toString(),
            "10:00",
            description);

    String response =
        mockMvc
            .perform(
                post("/appointments")
                    .with(csrf())
                    .with(adminRequestPostProcessor())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(appointment)))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();

    JsonNode node = objectMapper.readTree(response);
    return node.get("id").asText();
  }

  private static org.springframework.test.web.servlet.request.RequestPostProcessor
      adminRequestPostProcessor() {
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(
        new UsernamePasswordAuthenticationToken(
            "admin@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
    return SecurityMockMvcRequestPostProcessors.securityContext(context);
  }

  @Test
  @Order(1)
  @WithMockUser(username = "admin@test.com", roles = "ADMIN")
  public void adminShouldSeeAllAppointments() throws Exception {
    String d1 = createDentistAsAdmin(9301, "dentist11@test.com");
    String p1 = createPatientAsAdmin(9301, "patient11@test.com");
    String d2 = createDentistAsAdmin(9302, "dentist22@test.com");
    String p2 = createPatientAsAdmin(9302, "patient22@test.com");

    createAppointmentAsAdmin(d1, p1, "Appointment for patient11");
    createAppointmentAsAdmin(d2, p2, "Appointment for patient22");

    mockMvc
        .perform(get("/appointments").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2));
  }

  @Test
  @Order(2)
  @WithMockUser(username = "patient_filter@test.com", roles = "PATIENT")
  public void patientShouldOnlySeeOwnAppointments() throws Exception {
    String d1 = createDentistAsAdmin(9311, "dentist_filter@test.com");
    String p1 = createPatientAsAdmin(9311, "patient_filter@test.com");
    createAppointmentAsAdmin(d1, p1, "My appointment");

    String d2 = createDentistAsAdmin(9312, "dentist_other2@test.com");
    String p2 = createPatientAsAdmin(9312, "patient_other2@test.com");
    createAppointmentAsAdmin(d2, p2, "Other patient appointment");

    mockMvc
        .perform(get("/appointments").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].description").value("My appointment"));
  }

  @Test
  @Order(3)
  @WithMockUser(username = "dentist_filter@test.com", roles = "DENTIST")
  public void dentistShouldOnlySeeOwnAppointments() throws Exception {
    String d1 = createDentistAsAdmin(9321, "dentist_filter@test.com");
    String p1 = createPatientAsAdmin(9321, "patient_filter_d@test.com");
    createAppointmentAsAdmin(d1, p1, "My dentist appointment");

    String d2 = createDentistAsAdmin(9322, "dentist_other2@test.com");
    String p2 = createPatientAsAdmin(9322, "patient_other_d@test.com");
    createAppointmentAsAdmin(d2, p2, "Other dentist appointment");

    mockMvc
        .perform(get("/appointments").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].description").value("My dentist appointment"));
  }

  // Item 3: DENTIST requesting their own appointment by ID succeeds.
  @Test
  @Order(4)
  @WithMockUser(username = "dentist_own@test.com", roles = "DENTIST")
  public void dentistRequestingOwnAppointmentById_thenOk() throws Exception {
    String d1 = createDentistAsAdmin(9401, "dentist_own@test.com");
    String p1 = createPatientAsAdmin(9401, "patient_own@test.com");
    String appointmentId = createAppointmentAsAdminAndGetId(d1, p1, "Own appointment for findById");

    mockMvc
        .perform(get("/appointments/" + appointmentId).accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.description").value("Own appointment for findById"));
  }

  // Item 3: DENTIST requesting another dentist's appointment by ID is forbidden.
  @Test
  @Order(5)
  @WithMockUser(username = "dentist_requester@test.com", roles = "DENTIST")
  public void dentistRequestingAnotherDentistAppointmentById_thenForbidden() throws Exception {
    createDentistAsAdmin(9402, "dentist_requester@test.com");
    String d2 = createDentistAsAdmin(9403, "dentist_owner@test.com");
    String p2 = createPatientAsAdmin(9402, "patient_other_owner@test.com");
    String appointmentId = createAppointmentAsAdminAndGetId(d2, p2, "Other dentist's appointment");

    mockMvc
        .perform(get("/appointments/" + appointmentId).accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isForbidden());
  }

  // Item 3: ADMIN requesting any appointment by ID still succeeds (regression guard).
  @Test
  @Order(6)
  @WithMockUser(username = "admin@test.com", roles = "ADMIN")
  public void adminRequestingAnyAppointmentById_thenOk() throws Exception {
    String d1 = createDentistAsAdmin(9404, "dentist_for_admin_check@test.com");
    String p1 = createPatientAsAdmin(9404, "patient_for_admin_check@test.com");
    String appointmentId = createAppointmentAsAdminAndGetId(d1, p1, "Appointment visible to admin");

    mockMvc
        .perform(get("/appointments/" + appointmentId).accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.description").value("Appointment visible to admin"));
  }

  // Item 3: PATIENT requesting any appointment by ID stays excluded at the
  // role level (unchanged — regression guard, design explicitly keeps
  // PATIENT out of this endpoint).
  @Test
  @Order(7)
  @WithMockUser(username = "patient_role_check@test.com", roles = "PATIENT")
  public void patientRequestingAppointmentById_thenForbiddenAtRoleLevel() throws Exception {
    String d1 = createDentistAsAdmin(9405, "dentist_for_patient_check@test.com");
    String p1 = createPatientAsAdmin(9405, "patient_role_check@test.com");
    String appointmentId =
        createAppointmentAsAdminAndGetId(d1, p1, "Appointment not visible to patient");

    mockMvc
        .perform(get("/appointments/" + appointmentId).accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isForbidden());
  }

  @Test
  @Order(8)
  @WithMockUser(username = "admin@test.com", roles = "ADMIN")
  public void adminShouldBeAbleToUpdateAnyAppointment() throws Exception {
    String d1 = createDentistAsAdmin(9501, "dentist_up1@test.com");
    String p1 = createPatientAsAdmin(9501, "patient_up1@test.com");
    String appointmentId = createAppointmentAsAdminAndGetId(d1, p1, "Initial Appointment");

    AppointmentRequestDTO updateDto =
        new AppointmentRequestDTO(
            Long.parseLong(d1),
            Long.parseLong(p1),
            LocalDate.now()
                .with(java.time.temporal.TemporalAdjusters.next(java.time.DayOfWeek.MONDAY))
                .plusWeeks(1)
                .toString(),
            "10:00",
            "Updated Appointment by Admin");

    mockMvc
        .perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(
                    "/appointments/" + appointmentId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.description").value("Updated Appointment by Admin"));
  }

  @Test
  @Order(9)
  @WithMockUser(username = "dentist_up_owner@test.com", roles = "DENTIST")
  public void dentistShouldBeAbleToUpdateOwnAppointment() throws Exception {
    String d1 = createDentistAsAdmin(9502, "dentist_up_owner@test.com");
    String p1 = createPatientAsAdmin(9502, "patient_up2@test.com");
    String appointmentId = createAppointmentAsAdminAndGetId(d1, p1, "Initial Appointment");

    AppointmentRequestDTO updateDto =
        new AppointmentRequestDTO(
            Long.parseLong(d1),
            Long.parseLong(p1),
            LocalDate.now()
                .with(java.time.temporal.TemporalAdjusters.next(java.time.DayOfWeek.MONDAY))
                .plusWeeks(1)
                .toString(),
            "11:00",
            "Updated Appointment by Dentist");

    mockMvc
        .perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(
                    "/appointments/" + appointmentId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.description").value("Updated Appointment by Dentist"));
  }

  @Test
  @Order(10)
  @WithMockUser(username = "dentist_up_other@test.com", roles = "DENTIST")
  public void dentistShouldBeForbiddenToUpdateOtherDentistAppointment() throws Exception {
    createDentistAsAdmin(9503, "dentist_up_other@test.com");
    String d2 = createDentistAsAdmin(9504, "dentist_up_owner2@test.com");
    String p1 = createPatientAsAdmin(9503, "patient_up3@test.com");
    String appointmentId = createAppointmentAsAdminAndGetId(d2, p1, "Initial Appointment");

    AppointmentRequestDTO updateDto =
        new AppointmentRequestDTO(
            Long.parseLong(d2),
            Long.parseLong(p1),
            LocalDate.now().plusDays(2).toString(),
            "12:00",
            "Try to hack appointment");

    mockMvc
        .perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(
                    "/appointments/" + appointmentId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
        .andExpect(status().isForbidden());
  }

  @Test
  @Order(11)
  @WithMockUser(username = "patient_up_user@test.com", roles = "PATIENT")
  public void patientShouldBeForbiddenToUpdateAppointments() throws Exception {
    String d1 = createDentistAsAdmin(9505, "dentist_up5@test.com");
    String p1 = createPatientAsAdmin(9505, "patient_up_user@test.com");
    String appointmentId = createAppointmentAsAdminAndGetId(d1, p1, "Initial Appointment");

    AppointmentRequestDTO updateDto =
        new AppointmentRequestDTO(
            Long.parseLong(d1),
            Long.parseLong(p1),
            LocalDate.now().plusDays(2).toString(),
            "12:00",
            "Try to update as patient");

    mockMvc
        .perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(
                    "/appointments/" + appointmentId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
        .andExpect(status().isForbidden());
  }

  @Test
  @Order(12)
  @WithMockUser(username = "admin@test.com", roles = "ADMIN")
  public void createAppointmentWithMissingDentistId_thenBadRequest() throws Exception {
    String p1 = createPatientAsAdmin(9601, "patient_val1@test.com");
    AppointmentRequestDTO dto =
        new AppointmentRequestDTO(
            null,
            Long.parseLong(p1),
            LocalDate.now().plusDays(1).toString(),
            "10:00",
            "Missing dentistId");

    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isBadRequest())
        .andExpect(
            jsonPath("$.message")
                .value(org.hamcrest.Matchers.containsString("El odontólogo es requerido")));
  }

  @Test
  @Order(13)
  @WithMockUser(username = "admin@test.com", roles = "ADMIN")
  public void createAppointmentWithMissingPatientId_thenBadRequest() throws Exception {
    String d1 = createDentistAsAdmin(9602, "dentist_val2@test.com");
    AppointmentRequestDTO dto =
        new AppointmentRequestDTO(
            Long.parseLong(d1),
            null,
            LocalDate.now().plusDays(1).toString(),
            "10:00",
            "Missing patientId");

    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isBadRequest())
        .andExpect(
            jsonPath("$.message")
                .value(org.hamcrest.Matchers.containsString("El paciente es requerido")));
  }

  @Test
  @Order(14)
  @WithMockUser(username = "admin@test.com", roles = "ADMIN")
  public void createAppointmentWithMissingDate_thenBadRequest() throws Exception {
    String d1 = createDentistAsAdmin(9603, "dentist_val3@test.com");
    String p1 = createPatientAsAdmin(9603, "patient_val3@test.com");
    AppointmentRequestDTO dto =
        new AppointmentRequestDTO(
            Long.parseLong(d1), Long.parseLong(p1), null, "10:00", "Missing date");

    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isBadRequest())
        .andExpect(
            jsonPath("$.message")
                .value(org.hamcrest.Matchers.containsString("La fecha es requerida")));
  }

  @Test
  @Order(15)
  @WithMockUser(username = "admin@test.com", roles = "ADMIN")
  public void createAppointmentWithMalformedDate_thenBadRequest() throws Exception {
    String d1 = createDentistAsAdmin(9604, "dentist_val4@test.com");
    String p1 = createPatientAsAdmin(9604, "patient_val4@test.com");
    AppointmentRequestDTO dto =
        new AppointmentRequestDTO(
            Long.parseLong(d1),
            Long.parseLong(p1),
            "2026/07/03", // invalid format
            "10:00",
            "Malformed date");

    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isBadRequest())
        .andExpect(
            jsonPath("$.message")
                .value(org.hamcrest.Matchers.containsString("Formato de fecha inválido")));
  }

  @Test
  @Order(16)
  @WithMockUser(username = "admin@test.com", roles = "ADMIN")
  public void createAppointmentWithMissingTime_thenBadRequest() throws Exception {
    String d1 = createDentistAsAdmin(9605, "dentist_val5@test.com");
    String p1 = createPatientAsAdmin(9605, "patient_val5@test.com");
    AppointmentRequestDTO dto =
        new AppointmentRequestDTO(
            Long.parseLong(d1),
            Long.parseLong(p1),
            LocalDate.now().plusDays(1).toString(),
            null,
            "Missing time");

    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isBadRequest())
        .andExpect(
            jsonPath("$.message")
                .value(org.hamcrest.Matchers.containsString("La hora es requerida")));
  }

  @Test
  @Order(17)
  @WithMockUser(username = "admin@test.com", roles = "ADMIN")
  public void createAppointmentWithMalformedTime_thenBadRequest() throws Exception {
    String d1 = createDentistAsAdmin(9606, "dentist_val6@test.com");
    String p1 = createPatientAsAdmin(9606, "patient_val6@test.com");
    AppointmentRequestDTO dto =
        new AppointmentRequestDTO(
            Long.parseLong(d1),
            Long.parseLong(p1),
            LocalDate.now().plusDays(1).toString(),
            "25:00", // invalid hour
            "Malformed time");

    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isBadRequest())
        .andExpect(
            jsonPath("$.message")
                .value(org.hamcrest.Matchers.containsString("Formato de hora inválido")));
  }

  // Coverage gap closed (review-reliability, R2 audit): save()'s IDOR guard for
  // PATIENT (AppointmentController.java's "Fix 1") had zero test coverage before
  // and after the AuthorizationUtils refactor. A PATIENT submitting another
  // patient's ID must have it silently overridden to their own.
  @Test
  @Order(18)
  @WithMockUser(username = "patient_idor@test.com", roles = "PATIENT")
  public void patientCreatingAppointmentForAnotherPatient_thenOwnPatientIdIsEnforced()
      throws Exception {
    String d1 = createDentistAsAdmin(9701, "dentist_idor@test.com");
    String ownPatientId = createPatientAsAdmin(9701, "patient_idor@test.com");
    String otherPatientId = createPatientAsAdmin(9702, "patient_idor_other@test.com");

    AppointmentRequestDTO dto =
        new AppointmentRequestDTO(
            Long.parseLong(d1),
            Long.parseLong(otherPatientId), // attacker-submitted, must be ignored
            LocalDate.now()
                .with(java.time.temporal.TemporalAdjusters.next(java.time.DayOfWeek.MONDAY))
                .toString(),
            "09:00",
            "Attempt to book for another patient");

    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.patient_id").value(Long.parseLong(ownPatientId)));
  }

  // Coverage gap closed (review-reliability, R2 audit): updateStatus()'s
  // ownership guard for DENTIST ("Fix 4") had zero test coverage before and
  // after the AuthorizationUtils refactor.
  @Test
  @Order(19)
  @WithMockUser(username = "dentist_status_owner@test.com", roles = "DENTIST")
  public void dentistUpdatingStatusOfOwnAppointment_thenOk() throws Exception {
    String d1 = createDentistAsAdmin(9711, "dentist_status_owner@test.com");
    String p1 = createPatientAsAdmin(9711, "patient_status1@test.com");
    String appointmentId = createAppointmentAsAdminAndGetId(d1, p1, "Owned by dentist");

    Map<String, String> body = new HashMap<>();
    body.put("status", "IN_PROGRESS");

    mockMvc
        .perform(
            patch("/appointments/" + appointmentId + "/status")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk());
  }

  @Test
  @Order(20)
  @WithMockUser(username = "dentist_status_other@test.com", roles = "DENTIST")
  public void dentistUpdatingStatusOfOtherDentistAppointment_thenForbidden() throws Exception {
    createDentistAsAdmin(9712, "dentist_status_other@test.com");
    String d2 = createDentistAsAdmin(9713, "dentist_status_owner2@test.com");
    String p1 = createPatientAsAdmin(9712, "patient_status2@test.com");
    String appointmentId = createAppointmentAsAdminAndGetId(d2, p1, "Owned by another dentist");

    Map<String, String> body = new HashMap<>();
    body.put("status", "IN_PROGRESS");

    mockMvc
        .perform(
            patch("/appointments/" + appointmentId + "/status")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isForbidden());
  }

  // R3 (authz-cleanup-round-2, Phase 5.1): PATIENT principal with no backing
  // Patient row (stale principal) must get 401, not the previous 400 — see
  // specs/stale-principal-resolution/spec.md.
  @Test
  @Order(21)
  @WithMockUser(username = "ghost-patient-save@test.com", roles = "PATIENT")
  public void patientWithNoBackingRecordCreatingAppointment_then401Unauthorized() throws Exception {
    String d1 = createDentistAsAdmin(9801, "dentist_ghost1@test.com");
    String p1 = createPatientAsAdmin(9801, "patient_ghost1@test.com");

    AppointmentRequestDTO dto =
        new AppointmentRequestDTO(
            Long.parseLong(d1),
            Long.parseLong(p1),
            LocalDate.now()
                .with(java.time.temporal.TemporalAdjusters.next(java.time.DayOfWeek.MONDAY))
                .toString(),
            "09:00",
            "Ghost patient attempt");

    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));
  }

  // R3 (authz-cleanup-round-2, Phase 5.2): DENTIST principal with no backing
  // Dentist row (stale principal) must get 401, not the previous 400.
  @Test
  @Order(22)
  @WithMockUser(username = "ghost-dentist-findbyid@test.com", roles = "DENTIST")
  public void dentistWithNoBackingRecordFindingAppointmentById_then401Unauthorized()
      throws Exception {
    String d1 = createDentistAsAdmin(9802, "dentist_ghost2@test.com");
    String p1 = createPatientAsAdmin(9802, "patient_ghost2@test.com");
    String appointmentId = createAppointmentAsAdminAndGetId(d1, p1, "Ghost dentist target");

    mockMvc
        .perform(get("/appointments/" + appointmentId).accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));
  }

  // R3 (authz-cleanup-round-2, Phase 5.3): DENTIST principal with no backing
  // Dentist row (stale principal) must get 401, not the previous 400.
  @Test
  @Order(23)
  @WithMockUser(username = "ghost-dentist-update@test.com", roles = "DENTIST")
  public void dentistWithNoBackingRecordUpdatingAppointment_then401Unauthorized() throws Exception {
    String d1 = createDentistAsAdmin(9803, "dentist_ghost3@test.com");
    String p1 = createPatientAsAdmin(9803, "patient_ghost3@test.com");
    String appointmentId = createAppointmentAsAdminAndGetId(d1, p1, "Ghost dentist update target");

    AppointmentRequestDTO updateDto =
        new AppointmentRequestDTO(
            Long.parseLong(d1),
            Long.parseLong(p1),
            LocalDate.now()
                .with(java.time.temporal.TemporalAdjusters.next(java.time.DayOfWeek.MONDAY))
                .toString(),
            "13:00",
            "Ghost dentist update attempt");

    mockMvc
        .perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(
                    "/appointments/" + appointmentId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateDto)))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));
  }

  // R3 (authz-cleanup-round-2, Phase 5.4): DENTIST principal with no backing
  // Dentist row (stale principal) must get 401, not the previous 400. The two
  // sibling status-validation throws in the same method (missing/invalid
  // 'status' field) are unrelated and MUST stay 400 — see next two tests.
  @Test
  @Order(24)
  @WithMockUser(username = "ghost-dentist-status@test.com", roles = "DENTIST")
  public void dentistWithNoBackingRecordUpdatingStatus_then401Unauthorized() throws Exception {
    String d1 = createDentistAsAdmin(9804, "dentist_ghost4@test.com");
    String p1 = createPatientAsAdmin(9804, "patient_ghost4@test.com");
    String appointmentId = createAppointmentAsAdminAndGetId(d1, p1, "Ghost dentist status target");

    Map<String, String> body = new HashMap<>();
    body.put("status", "IN_PROGRESS");

    mockMvc
        .perform(
            patch("/appointments/" + appointmentId + "/status")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));
  }

  // Regression guard (Phase 5.4): the sibling "status field missing" validation
  // throw must remain untouched — still 400, not swept into the 401 conversion.
  @Test
  @Order(25)
  @WithMockUser(username = "admin@test.com", roles = "ADMIN")
  public void updateStatusWithMissingStatusField_thenStillBadRequest() throws Exception {
    String d1 = createDentistAsAdmin(9805, "dentist_status_val1@test.com");
    String p1 = createPatientAsAdmin(9805, "patient_status_val1@test.com");
    String appointmentId = createAppointmentAsAdminAndGetId(d1, p1, "Missing status field target");

    Map<String, String> body = new HashMap<>();

    mockMvc
        .perform(
            patch("/appointments/" + appointmentId + "/status")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(
            jsonPath("$.message")
                .value(org.hamcrest.Matchers.containsString("El campo 'status' es obligatorio")));
  }

  // Regression guard (Phase 5.4): the sibling "invalid status value" validation
  // throw must remain untouched — still 400, not swept into the 401 conversion.
  @Test
  @Order(26)
  @WithMockUser(username = "admin@test.com", roles = "ADMIN")
  public void updateStatusWithInvalidStatusValue_thenStillBadRequest() throws Exception {
    String d1 = createDentistAsAdmin(9806, "dentist_status_val2@test.com");
    String p1 = createPatientAsAdmin(9806, "patient_status_val2@test.com");
    String appointmentId = createAppointmentAsAdminAndGetId(d1, p1, "Invalid status value target");

    Map<String, String> body = new HashMap<>();
    body.put("status", "NOT_A_REAL_STATUS");

    mockMvc
        .perform(
            patch("/appointments/" + appointmentId + "/status")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(
            jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Status inválido")));
  }

  // R3 (authz-cleanup-round-2, Phase 5.8/5.9): PATIENT/DENTIST principal with
  // no backing row hitting GET /appointments (AppointmentServiceImpl's
  // findAllForCurrentUser) must get 401, not the previous 400.
  @Test
  @Order(27)
  @WithMockUser(username = "ghost-patient-findall@test.com", roles = "PATIENT")
  public void patientWithNoBackingRecordListingAppointments_then401Unauthorized() throws Exception {
    mockMvc
        .perform(get("/appointments").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));
  }

  @Test
  @Order(28)
  @WithMockUser(username = "ghost-dentist-findall@test.com", roles = "DENTIST")
  public void dentistWithNoBackingRecordListingAppointments_then401Unauthorized() throws Exception {
    mockMvc
        .perform(get("/appointments").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));
  }
}
