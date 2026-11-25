package com.dh.dentalClinicMVC.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.support.WithMockAppUser;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockAppUser(role = Role.ADMIN)
@Transactional
@Rollback
public class ApiIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Autowired private IPatientRepository patientRepository;

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

  // T4: bcrypt uses only the first 72 bytes, so an admin-supplied password over 72
  // characters must be rejected by @Size before the service encodes it.
  @Test
  public void whenAdminPutPatientWith73CharPassword_thenBadRequest() throws Exception {
    Patient target = new Patient();
    target.setFirstName("Long");
    target.setLastName("Password");
    target.setPassword("existing-hash");
    target.setRole(Role.PATIENT);
    target.setEmail("admin-put-longpassword@test.com");
    target.setCardIdentity(777888);
    target.setAdmissionDate(LocalDate.now());
    target = patientRepository.save(target);

    Map<String, Object> body = new java.util.HashMap<>();
    body.put("firstName", "Long");
    body.put("lastName", "Password");
    body.put("email", "admin-put-longpassword@test.com");
    body.put("cardIdentity", 777888);
    body.put("admissionDate", LocalDate.now().toString());
    body.put("password", "p".repeat(73));

    mockMvc
        .perform(
            put("/patients/{id}", target.getId())
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("Datos inválidos"))
        .andExpect(
            jsonPath("$.message")
                .value(
                    org.hamcrest.Matchers.containsString(
                        "password: La contraseña no puede superar los 72 caracteres")));
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
        .andExpect(status().isCreated());

    // Listar citas
    mockMvc
        .perform(get("/appointments").accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].description").value("Integration test appointment"));
  }
}
