package com.dh.dentalClinicMVC.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(roles = "ADMIN")
@Transactional
@Rollback
public class ApiIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Test
  public void dentistCrudFlow() throws Exception {
    String dentistJson =
        "{\"registrationNumber\":9999,\"firstName\":\"Test\",\"lastName\":\"Dentist\",\"email\":\"testdentist@example.com\"}";

    // Create
    mockMvc
        .perform(
            post("/dentists")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(dentistJson))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.registrationNumber").value(9999))
        .andExpect(jsonPath("$.email").value("testdentist@example.com"));

    // List
    mockMvc
        .perform(get("/dentists").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].email").exists());
  }

  @Test
  public void patientCrudFlow() throws Exception {
    String admissionDate = LocalDate.now().toString();
    String patientJson =
        String.format(
            "{\"cardIdentity\":8888,\"firstName\":\"Test\",\"lastName\":\"Patient\",\"email\":\"testpatient@example.com\",\"admissionDate\":\"%s\"}",
            admissionDate);

    // Create
    mockMvc
        .perform(
            post("/patients")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(patientJson))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.cardIdentity").value(8888))
        .andExpect(jsonPath("$.email").value("testpatient@example.com"));

    // List (requires ADMIN)
    mockMvc
        .perform(get("/patients").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].email").exists());
  }

  @Test
  public void appointmentFlow() throws Exception {
    // Crear dentista y obtener ID
    String dentistJson =
        "{\"registrationNumber\":7777,\"firstName\":\"Al\",\"lastName\":\"Bo\",\"email\":\"apptdentist@example.com\"}";
    String dentistResponse =
        mockMvc
            .perform(
                post("/dentists")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(dentistJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int dentistId = objectMapper.readTree(dentistResponse).get("id").asInt();

    // Crear paciente y obtener ID
    String admissionDate = LocalDate.now().toString();
    String patientJson =
        String.format(
            "{\"cardIdentity\":7777,\"firstName\":\"Pa\",\"lastName\":\"Qu\",\"email\":\"apptpatient@example.com\",\"admissionDate\":\"%s\"}",
            admissionDate);
    String patientResponse =
        mockMvc
            .perform(
                post("/patients")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(patientJson))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    int patientId = objectMapper.readTree(patientResponse).get("id").asInt();

    // Construir cita con IDs correctos
    String date =
        LocalDate.now()
            .with(java.time.temporal.TemporalAdjusters.next(java.time.DayOfWeek.MONDAY))
            .toString();
    String time = "10:00";

    String appointmentJson =
        objectMapper.writeValueAsString(
            new java.util.HashMap<String, Object>() {
              {
                put("dentistId", dentistId);
                put("patientId", patientId);
                put("date", date);
                put("time", time);
                put("description", "Integration test appointment");
              }
            });

    // Crear cita
    mockMvc
        .perform(
            post("/appointments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(appointmentJson))
        .andExpect(status().isOk());

    // Listar citas
    mockMvc
        .perform(get("/appointments").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].description").value("Integration test appointment"));
  }
}
