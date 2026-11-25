package com.dh.dentalClinicMVC.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.dto.AppointmentRequestDTO;
import jakarta.servlet.http.Cookie;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import tools.jackson.databind.JsonNode;

class MySqlAuthAndSecurityIntegrationTest extends AbstractMySqlIntegrationTest {

  @Test
  void registerLoginAndSessionMeWorkViaBearerAndSingleCookieAndRejectDuplicateCookies()
      throws Exception {
    Map<String, Object> registerBody =
        Map.of(
            "firstName", "Lucia",
            "lastName", "Gomez",
            "email", "lucia.auth@mysql.test",
            "password", "Password123!",
            "cardIdentity", 81001);

    String registerResponse =
        mockMvc
            .perform(
                post("/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registerBody)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.email").value("lucia.auth@mysql.test"))
            .andExpect(jsonPath("$.role").value("PATIENT"))
            .andExpect(jsonPath("$.mustChangePassword").value(false))
            .andReturn()
            .getResponse()
            .getContentAsString();
    Long userId = objectMapper.readTree(registerResponse).get("id").asLong();

    Boolean persistedMustChange =
        jdbcTemplate.queryForObject(
            "SELECT must_change_password FROM users WHERE id = ?", Boolean.class, userId);
    assertEquals(Boolean.FALSE, persistedMustChange);

    // Login via POST /auth/login
    String loginResponse =
        mockMvc
            .perform(
                post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            Map.of("email", "lucia.auth@mysql.test", "password", "Password123!"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.role").value("PATIENT"))
            .andExpect(jsonPath("$.mustChangePassword").value(false))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String jwt = objectMapper.readTree(loginResponse).get("token").asString();

    // GET /auth/me via Authorization: Bearer <jwt>
    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + jwt))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(userId))
        .andExpect(jsonPath("$.email").value("lucia.auth@mysql.test"))
        .andExpect(jsonPath("$.role").value("PATIENT"))
        .andExpect(jsonPath("$.mustChangePassword").value(false));

    // GET /auth/me via single authToken cookie (no Authorization header)
    mockMvc
        .perform(get("/auth/me").cookie(new Cookie("authToken", jwt)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(userId))
        .andExpect(jsonPath("$.email").value("lucia.auth@mysql.test"))
        .andExpect(jsonPath("$.role").value("PATIENT"))
        .andExpect(jsonPath("$.mustChangePassword").value(false));

    // Duplicate authToken cookies must fail closed with 401 Unauthorized
    mockMvc
        .perform(get("/auth/me").cookie(new Cookie("authToken", jwt), new Cookie("authToken", jwt)))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("No autenticado"))
        .andExpect(jsonPath("$.status").value(401));
  }

  @Test
  void mustChangePasswordLifecyclePersistsForAdminCreatedPatientAndDentist() throws Exception {
    String adminAuth = seedAdminAndGetBearerToken("admin.mcp@mysql.test");

    // 1. Admin creates Patient -> V3 must_change_password = true in MySQL
    Map<String, Object> patientPayload =
        Map.of(
            "firstName", "Carlos",
            "lastName", "Temp",
            "email", "carlos.mcp@mysql.test",
            "cardIdentity", 82001,
            "admissionDate", LocalDate.now().toString());
    JsonNode createdPatient =
        objectMapper.readTree(
            mockMvc
                .perform(
                    post("/patients")
                        .header("Authorization", adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patientPayload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mustChangePassword").value(true))
                .andExpect(jsonPath("$.temporaryPassword").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString());

    verifyMustChangePasswordLifecycle(
        createdPatient.get("id").asLong(),
        "carlos.mcp@mysql.test",
        createdPatient.get("temporaryPassword").asString(),
        "PatientNewPass123!");

    // 2. Admin creates Dentist -> V3 must_change_password = true in MySQL
    Map<String, Object> dentistPayload =
        Map.of(
            "firstName", "Elena",
            "lastName", "Temp",
            "email", "elena.mcp@mysql.test",
            "registrationNumber", 92001);
    JsonNode createdDentist =
        objectMapper.readTree(
            mockMvc
                .perform(
                    post("/dentists")
                        .header("Authorization", adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dentistPayload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mustChangePassword").value(true))
                .andExpect(jsonPath("$.temporaryPassword").isNotEmpty())
                .andReturn()
                .getResponse()
                .getContentAsString());

    verifyMustChangePasswordLifecycle(
        createdDentist.get("id").asLong(),
        "elena.mcp@mysql.test",
        createdDentist.get("temporaryPassword").asString(),
        "DentistNewPass123!");
  }

  @Test
  void patientRbacAndIdorBoundariesAreEnforcedAndPersistedInMySql() throws Exception {
    String adminAuth = seedAdminAndGetBearerToken("admin.patient.sec@mysql.test");
    Long dentistId = createDentist(adminAuth, 93001, "dentist.patient.sec@mysql.test");
    CreatedAccount patientA = createPatient(adminAuth, 83001, "patient.a@mysql.test", "Alicia");
    CreatedAccount patientB = createPatient(adminAuth, 83002, "patient.b@mysql.test", "Bruno");

    String date = nextWeekday().toString();
    Long existingAppointmentId =
        createAppointment(adminAuth, dentistId, patientA.id(), date, "09:00", "Turno inicial");

    String patientAToken =
        loginAndActivateTemporaryAccount(
            patientA.email(), patientA.temporaryPassword(), "PatientA123!");

    // RBAC: PATIENT is blocked (403) on admin-only endpoints
    mockMvc
        .perform(get("/dashboard/snapshot").header("Authorization", "Bearer " + patientAToken))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403));

    Map<String, Object> newDentist =
        Map.of(
            "firstName", "No",
            "lastName", "Autorizado",
            "email", "blocked.dentist@mysql.test",
            "registrationNumber", 93999);
    mockMvc
        .perform(
            post("/dentists")
                .header("Authorization", "Bearer " + patientAToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newDentist)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403));
    assertEquals(1, jdbcTemplate.queryForObject("SELECT COUNT(*) FROM dentists", Integer.class));

    mockMvc
        .perform(
            delete("/appointments/{id}", existingAppointmentId)
                .header("Authorization", "Bearer " + patientAToken))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403));
    assertEquals(
        1,
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM appointments WHERE id = ?",
            Integer.class,
            existingAppointmentId));

    // IDOR: PATIENT A blocked (403) reading/updating PATIENT B
    mockMvc
        .perform(
            get("/patients/{id}", patientB.id()).header("Authorization", "Bearer " + patientAToken))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403));

    Map<String, Object> updatePatientB =
        Map.of(
            "firstName",
            "Hacked",
            "lastName",
            "Bruno",
            "email",
            patientB.email(),
            "cardIdentity",
            83002,
            "admissionDate",
            LocalDate.now().toString());
    mockMvc
        .perform(
            put("/patients/{id}", patientB.id())
                .header("Authorization", "Bearer " + patientAToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updatePatientB)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403));

    assertEquals(
        "Bruno",
        jdbcTemplate.queryForObject(
            "SELECT first_name FROM users WHERE id = ?", String.class, patientB.id()));

    // Self-access: PATIENT A allowed (200) reading/updating own profile
    mockMvc
        .perform(
            get("/patients/{id}", patientA.id()).header("Authorization", "Bearer " + patientAToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(patientA.id()));

    Map<String, Object> updateOwnProfile =
        Map.of(
            "firstName",
            "AliciaEditada",
            "lastName",
            "MySql",
            "email",
            patientA.email(),
            "cardIdentity",
            83001,
            "admissionDate",
            LocalDate.now().toString());
    mockMvc
        .perform(
            put("/patients/{id}", patientA.id())
                .header("Authorization", "Bearer " + patientAToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateOwnProfile)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.firstName").value("AliciaEditada"));

    assertEquals(
        "AliciaEditada",
        jdbcTemplate.queryForObject(
            "SELECT first_name FROM users WHERE id = ?", String.class, patientA.id()));

    // IDOR override: PATIENT A creating appointment with patientId = B persists own ID A in MySQL
    AppointmentRequestDTO spoofedAppointment =
        new AppointmentRequestDTO(dentistId, patientB.id(), date, "10:30", "Intento otro paciente");
    String createdAppointmentJson =
        mockMvc
            .perform(
                post("/appointments")
                    .header("Authorization", "Bearer " + patientAToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(spoofedAppointment)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.patientId").value(patientA.id()))
            .andReturn()
            .getResponse()
            .getContentAsString();
    Long createdAppointmentId = objectMapper.readTree(createdAppointmentJson).get("id").asLong();

    Long persistedPatientId =
        jdbcTemplate.queryForObject(
            "SELECT patient_id FROM appointments WHERE id = ?", Long.class, createdAppointmentId);
    assertEquals(patientA.id(), persistedPatientId);
  }

  @Test
  void dentistIdorBoundariesProtectOtherDentistsAppointmentsInMySql() throws Exception {
    String adminAuth = seedAdminAndGetBearerToken("admin.dentist.sec@mysql.test");
    CreatedAccount dentistA = createDentistAccount(adminAuth, 94001, "dentist.a@mysql.test");
    CreatedAccount dentistB = createDentistAccount(adminAuth, 94002, "dentist.b@mysql.test");
    CreatedAccount patient = createPatient(adminAuth, 84001, "patient.dsec@mysql.test", "Sofia");

    String date = nextWeekday().toString();
    Long dentistAAppointmentId =
        createAppointment(adminAuth, dentistA.id(), patient.id(), date, "09:30", "Turno A");
    Long dentistBAppointmentId =
        createAppointment(adminAuth, dentistB.id(), patient.id(), date, "10:30", "Turno B");

    String dentistAToken =
        loginAndActivateTemporaryAccount(
            dentistA.email(), dentistA.temporaryPassword(), "DentistA123!");

    // DENTIST A blocked (403) reading, updating, and transitioning DENTIST B's appointment
    mockMvc
        .perform(
            get("/appointments/{id}", dentistBAppointmentId)
                .header("Authorization", "Bearer " + dentistAToken))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403));

    AppointmentRequestDTO tamperDentistB =
        new AppointmentRequestDTO(dentistB.id(), patient.id(), date, "11:30", "Modificado por A");
    mockMvc
        .perform(
            put("/appointments/{id}", dentistBAppointmentId)
                .header("Authorization", "Bearer " + dentistAToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(tamperDentistB)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403));

    mockMvc
        .perform(
            patch("/appointments/{id}/status", dentistBAppointmentId)
                .header("Authorization", "Bearer " + dentistAToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "IN_PROGRESS"))))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403));

    assertEquals(
        "Turno B",
        jdbcTemplate.queryForObject(
            "SELECT description FROM appointments WHERE id = ?",
            String.class,
            dentistBAppointmentId));
    assertEquals(
        "SCHEDULED",
        jdbcTemplate.queryForObject(
            "SELECT status FROM appointments WHERE id = ?", String.class, dentistBAppointmentId));

    // DENTIST A allowed (200) reading, updating, and transitioning own appointment
    mockMvc
        .perform(
            get("/appointments/{id}", dentistAAppointmentId)
                .header("Authorization", "Bearer " + dentistAToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(dentistAAppointmentId));

    AppointmentRequestDTO updateOwn =
        new AppointmentRequestDTO(
            dentistA.id(), patient.id(), date, "09:30", "Turno A actualizado");
    mockMvc
        .perform(
            put("/appointments/{id}", dentistAAppointmentId)
                .header("Authorization", "Bearer " + dentistAToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateOwn)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.description").value("Turno A actualizado"));

    mockMvc
        .perform(
            patch("/appointments/{id}/status", dentistAAppointmentId)
                .header("Authorization", "Bearer " + dentistAToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "IN_PROGRESS"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

    assertEquals(
        "Turno A actualizado",
        jdbcTemplate.queryForObject(
            "SELECT description FROM appointments WHERE id = ?",
            String.class,
            dentistAAppointmentId));
    assertEquals(
        "IN_PROGRESS",
        jdbcTemplate.queryForObject(
            "SELECT status FROM appointments WHERE id = ?", String.class, dentistAAppointmentId));
  }

  private void verifyMustChangePasswordLifecycle(
      Long userId, String email, String temporaryPassword, String newPassword) throws Exception {
    assertNotNull(temporaryPassword);
    assertTrue(
        Boolean.TRUE.equals(
            jdbcTemplate.queryForObject(
                "SELECT must_change_password FROM users WHERE id = ?", Boolean.class, userId)),
        "must_change_password must be true in MySQL right after admin creation");

    String tempLoginResponse =
        mockMvc
            .perform(
                post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsString(
                            Map.of("email", email, "password", temporaryPassword))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.mustChangePassword").value(true))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String token = objectMapper.readTree(tempLoginResponse).get("token").asString();

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mustChangePassword").value(true));

    mockMvc
        .perform(get("/appointments").header("Authorization", "Bearer " + token))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.status").value(403));

    mockMvc
        .perform(
            post("/auth/change-password")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of("currentPassword", temporaryPassword, "newPassword", newPassword))))
        .andExpect(status().isNoContent());

    mockMvc
        .perform(get("/appointments").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk());

    assertFalse(
        Boolean.TRUE.equals(
            jdbcTemplate.queryForObject(
                "SELECT must_change_password FROM users WHERE id = ?", Boolean.class, userId)),
        "must_change_password must flip to false in MySQL after password change");

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mustChangePassword").value(false));

    mockMvc
        .perform(
            post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of("email", email, "password", newPassword))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mustChangePassword").value(false));

    mockMvc
        .perform(
            post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of("email", email, "password", temporaryPassword))))
        .andExpect(status().isUnauthorized());
  }

  private String loginAndActivateTemporaryAccount(
      String email, String temporaryPassword, String newPassword) throws Exception {
    String token = loginAndGetToken(email, temporaryPassword);
    mockMvc
        .perform(
            post("/auth/change-password")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of("currentPassword", temporaryPassword, "newPassword", newPassword))))
        .andExpect(status().isNoContent());
    return loginAndGetToken(email, newPassword);
  }

  private String loginAndGetToken(String email, String password) throws Exception {
    String response =
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
    return objectMapper.readTree(response).get("token").asString();
  }

  private Long createDentist(String adminAuth, int registrationNumber, String email)
      throws Exception {
    return createDentistAccount(adminAuth, registrationNumber, email).id();
  }

  private CreatedAccount createDentistAccount(
      String adminAuth, int registrationNumber, String email) throws Exception {
    Map<String, Object> body =
        Map.of(
            "firstName",
            "Dr",
            "lastName",
            "Security",
            "email",
            email,
            "registrationNumber",
            registrationNumber);
    JsonNode node =
        objectMapper.readTree(
            mockMvc
                .perform(
                    post("/dentists")
                        .header("Authorization", adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString());
    return new CreatedAccount(
        node.get("id").asLong(), email, node.get("temporaryPassword").asString());
  }

  private CreatedAccount createPatient(
      String adminAuth, int cardIdentity, String email, String firstName) throws Exception {
    Map<String, Object> body =
        Map.of(
            "firstName", firstName,
            "lastName", "MySql",
            "email", email,
            "cardIdentity", cardIdentity,
            "admissionDate", LocalDate.now().toString());
    JsonNode node =
        objectMapper.readTree(
            mockMvc
                .perform(
                    post("/patients")
                        .header("Authorization", adminAuth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString());
    return new CreatedAccount(
        node.get("id").asLong(), email, node.get("temporaryPassword").asString());
  }

  private Long createAppointment(
      String adminAuth,
      Long dentistId,
      Long patientId,
      String date,
      String time,
      String description)
      throws Exception {
    AppointmentRequestDTO dto =
        new AppointmentRequestDTO(dentistId, patientId, date, time, description);
    String response =
        mockMvc
            .perform(
                post("/appointments")
                    .header("Authorization", adminAuth)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return objectMapper.readTree(response).get("id").asLong();
  }

  private record CreatedAccount(Long id, String email, String temporaryPassword) {}
}
