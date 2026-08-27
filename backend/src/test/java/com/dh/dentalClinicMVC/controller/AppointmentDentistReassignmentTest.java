package com.dh.dentalClinicMVC.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.dto.AppointmentRequestDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
class AppointmentDentistReassignmentTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Test
  @WithMockUser(username = "dentist_reassignment_owner@test.com", roles = "DENTIST")
  void dentistCannotReassignOwnedAppointment() throws Exception {
    long ownerDentistId = createDentistAsAdmin(9901, "dentist_reassignment_owner@test.com");
    long replacementDentistId = createDentistAsAdmin(9902, "dentist_reassignment_target@test.com");
    long patientId = createPatientAsAdmin(9901, "patient_reassignment@test.com");
    String appointmentId =
        createAppointmentAsAdminAndGetId(ownerDentistId, patientId, "Initial appointment");

    AppointmentRequestDTO updateRequest =
        new AppointmentRequestDTO(
            replacementDentistId,
            patientId,
            NextWeekday.fromToday().toString(),
            "11:00",
            "Unauthorized reassignment");

    mockMvc
        .perform(
            put("/appointments/" + appointmentId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isForbidden());

    mockMvc
        .perform(
            get("/appointments/" + appointmentId)
                .with(adminRequestPostProcessor())
                .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.dentist_id").value(ownerDentistId))
        .andExpect(jsonPath("$.description").value("Initial appointment"));
  }

  @Test
  @WithMockUser(username = "admin@test.com", roles = "ADMIN")
  void adminCanReassignAppointment() throws Exception {
    long originalDentistId = createDentistAsAdmin(9911, "dentist_admin_original@test.com");
    long replacementDentistId = createDentistAsAdmin(9912, "dentist_admin_replacement@test.com");
    long patientId = createPatientAsAdmin(9911, "patient_admin_reassignment@test.com");
    String appointmentId =
        createAppointmentAsAdminAndGetId(originalDentistId, patientId, "Admin reassignment target");

    AppointmentRequestDTO updateRequest =
        new AppointmentRequestDTO(
            replacementDentistId,
            patientId,
            NextWeekday.fromToday().toString(),
            "11:00",
            "Reassigned by admin");

    mockMvc
        .perform(
            put("/appointments/" + appointmentId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.dentist_id").value(replacementDentistId))
        .andExpect(jsonPath("$.description").value("Reassigned by admin"));
  }

  private long createDentistAsAdmin(int registrationNumber, String email) throws Exception {
    Map<String, Object> dentist = new HashMap<>();
    dentist.put("registrationNumber", registrationNumber);
    dentist.put("firstName", "Dr");
    dentist.put("lastName", "ReassignmentTest");
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

    return objectMapper.readTree(response).get("id").asLong();
  }

  private long createPatientAsAdmin(int cardIdentity, String email) throws Exception {
    Map<String, Object> patient = new HashMap<>();
    patient.put("cardIdentity", cardIdentity);
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

    return objectMapper.readTree(response).get("id").asLong();
  }

  private String createAppointmentAsAdminAndGetId(
      long dentistId, long patientId, String description) throws Exception {
    AppointmentRequestDTO appointment =
        new AppointmentRequestDTO(
            dentistId, patientId, NextWeekday.fromToday().toString(), "10:00", description);

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

    return objectMapper.readTree(response).get("id").asText();
  }

  private static org.springframework.test.web.servlet.request.RequestPostProcessor
      adminRequestPostProcessor() {
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(
        new UsernamePasswordAuthenticationToken(
            "admin@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
    return SecurityMockMvcRequestPostProcessors.securityContext(context);
  }
}
