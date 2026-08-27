package com.dh.dentalClinicMVC.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.dto.AppointmentRequestDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class AppointmentSearchAuthorizationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Test
  @WithMockUser(username = "patient-search-owner@test.com", roles = "PATIENT")
  void patientSearchIgnoresPatientOverrideAndDoesNotEnumerateOtherAppointments() throws Exception {
    SearchFixture fixture =
        createFixture("patient-search-owner@test.com", "dentist-search-owner@test.com");

    mockMvc
        .perform(
            get("/appointments/search")
                .param("patient", Long.toString(fixture.otherPatientId()))
                .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1))
        .andExpect(jsonPath("$.content[0].description").value("Own appointment"));

    mockMvc
        .perform(get("/appointments/search").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1))
        .andExpect(jsonPath("$.content[0].description").value("Own appointment"));
  }

  @Test
  @WithMockUser(username = "dentist-search-owner@test.com", roles = "DENTIST")
  void dentistSearchIgnoresDentistOverrideAndDoesNotEnumerateOtherAppointments() throws Exception {
    SearchFixture fixture =
        createFixture("patient-search-dentist@test.com", "dentist-search-owner@test.com");

    mockMvc
        .perform(
            get("/appointments/search")
                .param("dentist", Long.toString(fixture.otherDentistId()))
                .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1))
        .andExpect(jsonPath("$.content[0].description").value("Own appointment"));

    mockMvc
        .perform(get("/appointments/search").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1))
        .andExpect(jsonPath("$.content[0].description").value("Own appointment"));
  }

  @Test
  @WithMockUser(username = "admin-search@test.com", roles = "ADMIN")
  void adminSearchRemainsUnrestrictedAndHonorsOwnerFilters() throws Exception {
    SearchFixture fixture =
        createFixture("patient-search-admin@test.com", "dentist-search-admin@test.com");

    mockMvc
        .perform(get("/appointments/search").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(2));

    mockMvc
        .perform(
            get("/appointments/search")
                .param("patient", Long.toString(fixture.otherPatientId()))
                .param("dentist", Long.toString(fixture.otherDentistId()))
                .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1))
        .andExpect(jsonPath("$.content[0].description").value("Other appointment"));
  }

  @Test
  @WithMockUser(username = "stale-search-patient@test.com", roles = "PATIENT")
  void stalePatientPrincipalReturnsUnauthorized() throws Exception {
    mockMvc
        .perform(get("/appointments/search").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));
  }

  @Test
  @WithMockUser(username = "stale-search-dentist@test.com", roles = "DENTIST")
  void staleDentistPrincipalReturnsUnauthorized() throws Exception {
    mockMvc
        .perform(get("/appointments/search").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));
  }

  private SearchFixture createFixture(String patientEmail, String dentistEmail) throws Exception {
    long ownDentistId = createDentistAsAdmin(9921, dentistEmail);
    long ownPatientId = createPatientAsAdmin(9921, patientEmail);
    createAppointmentAsAdmin(ownDentistId, ownPatientId, "Own appointment");

    long otherDentistId = createDentistAsAdmin(9922, "dentist-search-other@test.com");
    long otherPatientId = createPatientAsAdmin(9922, "patient-search-other@test.com");
    createAppointmentAsAdmin(otherDentistId, otherPatientId, "Other appointment");

    return new SearchFixture(ownPatientId, otherPatientId, ownDentistId, otherDentistId);
  }

  private long createDentistAsAdmin(int registrationNumber, String email) throws Exception {
    Map<String, Object> request = new HashMap<>();
    request.put("registrationNumber", registrationNumber);
    request.put("firstName", "Search");
    request.put("lastName", "Dentist");
    request.put("email", email);

    String response =
        mockMvc
            .perform(
                post("/dentists")
                    .with(csrf())
                    .with(adminRequest())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return objectMapper.readTree(response).get("id").asLong();
  }

  private long createPatientAsAdmin(int cardIdentity, String email) throws Exception {
    Map<String, Object> request = new HashMap<>();
    request.put("cardIdentity", cardIdentity);
    request.put("firstName", "Search");
    request.put("lastName", "Patient");
    request.put("email", email);
    request.put("admissionDate", LocalDate.now().toString());

    String response =
        mockMvc
            .perform(
                post("/patients")
                    .with(csrf())
                    .with(adminRequest())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return objectMapper.readTree(response).get("id").asLong();
  }

  private void createAppointmentAsAdmin(long dentistId, long patientId, String description)
      throws Exception {
    AppointmentRequestDTO request =
        new AppointmentRequestDTO(
            dentistId, patientId, NextWeekday.fromToday().toString(), "10:00", description);

    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .with(adminRequest())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk());
  }

  private static RequestPostProcessor adminRequest() {
    return SecurityMockMvcRequestPostProcessors.user("admin-search@test.com").roles("ADMIN");
  }

  private record SearchFixture(
      long ownPatientId, long otherPatientId, long ownDentistId, long otherDentistId) {}
}
