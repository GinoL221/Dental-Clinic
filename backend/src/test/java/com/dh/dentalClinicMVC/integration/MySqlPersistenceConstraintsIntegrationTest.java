package com.dh.dentalClinicMVC.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.dto.AppointmentRequestDTO;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessException;
import org.springframework.http.MediaType;

class MySqlPersistenceConstraintsIntegrationTest extends AbstractMySqlIntegrationTest {

  @Test
  void activeSlotGeneratedColumnBlocksDuplicateActiveBookingAndFreesSlotOnCancel()
      throws Exception {
    String adminAuth = seedAdminAndGetBearerToken("admin.slot@mysql.test");
    Long dentistId = createDentist(adminAuth, 51001, "dentist.slot@mysql.test");
    Long patient1Id = createPatient(adminAuth, 61001, "patient1.slot@mysql.test");
    Long patient2Id = createPatient(adminAuth, 61002, "patient2.slot@mysql.test");
    LocalDate date = nextWeekday();

    Long firstAppointmentId =
        createAppointment(adminAuth, dentistId, patient1Id, date.toString(), "10:00", "Consulta 1");

    Integer firstActiveSlot =
        jdbcTemplate.queryForObject(
            "SELECT active_slot FROM appointments WHERE id = ?", Integer.class, firstAppointmentId);
    assertEquals(1, firstActiveSlot);

    // Duplicate active booking for the same dentist/date/time must return 409 Conflict
    AppointmentRequestDTO duplicate =
        new AppointmentRequestDTO(dentistId, patient2Id, date.toString(), "10:00", "Duplicado");
    mockMvc
        .perform(
            post("/appointments")
                .header("Authorization", adminAuth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicate)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.status").value(409));

    assertEquals(
        1, jdbcTemplate.queryForObject("SELECT COUNT(*) FROM appointments", Integer.class));

    // Verify DB-level uk_appointment_active_dentist_slot rejects direct duplicate SQL inserts
    assertThrows(
        DataAccessException.class,
        () ->
            jdbcTemplate.update(
                "INSERT INTO appointments (patient_id, dentist_id, date, time, description, status) "
                    + "VALUES (?, ?, ?, ?, ?, 'SCHEDULED')",
                patient2Id,
                dentistId,
                date,
                LocalTime.of(10, 0),
                "Direct SQL duplicate"));

    // Cancelling the appointment sets active_slot = NULL in MySQL 8.4
    mockMvc
        .perform(
            patch("/appointments/{id}/status", firstAppointmentId)
                .header("Authorization", adminAuth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "CANCELLED"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("CANCELLED"));

    Integer cancelledActiveSlot =
        jdbcTemplate.queryForObject(
            "SELECT active_slot FROM appointments WHERE id = ?", Integer.class, firstAppointmentId);
    assertNull(cancelledActiveSlot, "Cancelled appointment must have active_slot = NULL in MySQL");

    // Re-booking the exact same dentist/date/time must now succeed (201 Created)
    Long rebookedAppointmentId =
        createAppointment(adminAuth, dentistId, patient2Id, date.toString(), "10:00", "Reagendado");

    Integer rebookedActiveSlot =
        jdbcTemplate.queryForObject(
            "SELECT active_slot FROM appointments WHERE id = ?",
            Integer.class,
            rebookedAppointmentId);
    assertEquals(1, rebookedActiveSlot);
    assertEquals(
        2, jdbcTemplate.queryForObject("SELECT COUNT(*) FROM appointments", Integer.class));
  }

  @Test
  void uniqueConstraintsReturnConflictWithoutPersistingDuplicateRows() throws Exception {
    String adminAuth = seedAdminAndGetBearerToken("admin.unique@mysql.test");

    // 1. Duplicate email on POST /auth/register
    Map<String, Object> register1 =
        Map.of(
            "firstName", "Ana",
            "lastName", "Unique",
            "email", "dup.email@mysql.test",
            "password", "Secret123!",
            "cardIdentity", 70001);
    Map<String, Object> register2 =
        Map.of(
            "firstName", "Otra",
            "lastName", "Persona",
            "email", "dup.email@mysql.test",
            "password", "Secret123!",
            "cardIdentity", 70002);

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(register1)))
        .andExpect(status().isOk());

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(register2)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.status").value(409));

    assertEquals(
        1,
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, "dup.email@mysql.test"));

    // 2. Duplicate card_identity on POST /patients
    createPatient(adminAuth, 70010, "patient.dni1@mysql.test");
    Map<String, Object> duplicatePatient =
        Map.of(
            "firstName", "Paciente",
            "lastName", "Duplicado",
            "email", "patient.dni2@mysql.test",
            "cardIdentity", 70010,
            "admissionDate", LocalDate.now().toString());
    mockMvc
        .perform(
            post("/patients")
                .header("Authorization", adminAuth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicatePatient)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.status").value(409));

    assertEquals(
        1,
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM patients WHERE card_identity = ?", Integer.class, 70010));

    // 3. Duplicate registration_number on POST /dentists
    createDentist(adminAuth, 80010, "dentist.reg1@mysql.test");
    Map<String, Object> duplicateDentist =
        Map.of(
            "firstName", "Dr",
            "lastName", "Duplicado",
            "email", "dentist.reg2@mysql.test",
            "registrationNumber", 80010);
    mockMvc
        .perform(
            post("/dentists")
                .header("Authorization", adminAuth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateDentist)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.status").value(409));

    assertEquals(
        1,
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM dentists WHERE registration_number = ?", Integer.class, 80010));

    // 4. Duplicate specialty.name on POST /specialties
    createSpecialty(adminAuth, "Ortodoncia", "Corrección dental");
    Map<String, Object> duplicateSpecialty =
        Map.of("name", "Ortodoncia", "description", "Descripción repetida");
    mockMvc
        .perform(
            post("/specialties")
                .header("Authorization", adminAuth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateSpecialty)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.status").value(409));

    assertEquals(
        1,
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM specialties WHERE name = ?", Integer.class, "Ortodoncia"));
  }

  @Test
  void referentialIntegrityBlocksDeletingDentistOrPatientWithAppointments() throws Exception {
    String adminAuth = seedAdminAndGetBearerToken("admin.fk@mysql.test");
    Long dentistId = createDentist(adminAuth, 52001, "dentist.fk@mysql.test");
    Long patientId = createPatient(adminAuth, 62001, "patient.fk@mysql.test");
    Long appointmentId =
        createAppointment(
            adminAuth, dentistId, patientId, nextWeekday().toString(), "11:00", "Turno activo");

    mockMvc
        .perform(delete("/dentists/{id}", dentistId).header("Authorization", adminAuth))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.error").value("Recurso en uso"))
        .andExpect(jsonPath("$.status").value(409));

    mockMvc
        .perform(delete("/patients/{id}", patientId).header("Authorization", adminAuth))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.error").value("Recurso en uso"))
        .andExpect(jsonPath("$.status").value(409));

    assertEquals(
        1,
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM dentists WHERE id = ?", Integer.class, dentistId));
    assertEquals(
        1,
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM patients WHERE id = ?", Integer.class, patientId));
    assertEquals(
        1,
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM appointments WHERE id = ?", Integer.class, appointmentId));
  }

  @Test
  void assignedSpecialtyCannotBeDeletedUntilUnassignedFromDentist() throws Exception {
    String adminAuth = seedAdminAndGetBearerToken("admin.spec@mysql.test");
    Long dentistId = createDentist(adminAuth, 53001, "dentist.spec@mysql.test");
    Long specialtyId = createSpecialty(adminAuth, "Endodoncia", "Tratamientos de conducto");

    mockMvc
        .perform(
            post(
                    "/specialties/dentists/{dentistId}/specialties/{specialtyId}",
                    dentistId,
                    specialtyId)
                .header("Authorization", adminAuth))
        .andExpect(status().isOk());

    assertEquals(
        1,
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM dentist_specialty WHERE dentist_id = ? AND specialty_id = ?",
            Integer.class,
            dentistId,
            specialtyId));

    // Assigned specialty cannot be deleted -> 409 Conflict
    mockMvc
        .perform(delete("/specialties/{id}", specialtyId).header("Authorization", adminAuth))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.status").value(409));

    assertEquals(
        1,
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM specialties WHERE id = ?", Integer.class, specialtyId));

    // Unassign specialty, then deletion succeeds
    mockMvc
        .perform(
            delete(
                    "/specialties/dentists/{dentistId}/specialties/{specialtyId}",
                    dentistId,
                    specialtyId)
                .header("Authorization", adminAuth))
        .andExpect(status().isNoContent());

    assertEquals(
        0,
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM dentist_specialty WHERE dentist_id = ? AND specialty_id = ?",
            Integer.class,
            dentistId,
            specialtyId));

    mockMvc
        .perform(delete("/specialties/{id}", specialtyId).header("Authorization", adminAuth))
        .andExpect(status().isNoContent());

    assertEquals(
        0,
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM specialties WHERE id = ?", Integer.class, specialtyId));
  }

  @Test
  void invalidAppointmentStatusTransitionReturnsConflictAndLeavesDatabaseUnchanged()
      throws Exception {
    String adminAuth = seedAdminAndGetBearerToken("admin.status@mysql.test");
    Long dentistId = createDentist(adminAuth, 54001, "dentist.status@mysql.test");
    Long patientId = createPatient(adminAuth, 64001, "patient.status@mysql.test");
    Long appointmentId =
        createAppointment(
            adminAuth, dentistId, patientId, nextWeekday().toString(), "14:00", "Control");

    // SCHEDULED -> CANCELLED succeeds
    mockMvc
        .perform(
            patch("/appointments/{id}/status", appointmentId)
                .header("Authorization", adminAuth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "CANCELLED"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("CANCELLED"));

    // CANCELLED -> COMPLETED is invalid -> 409 Conflict
    mockMvc
        .perform(
            patch("/appointments/{id}/status", appointmentId)
                .header("Authorization", adminAuth)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("status", "COMPLETED"))))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.error").value("Transición de estado inválida"))
        .andExpect(jsonPath("$.status").value(409));

    String persistedStatus =
        jdbcTemplate.queryForObject(
            "SELECT status FROM appointments WHERE id = ?", String.class, appointmentId);
    assertEquals("CANCELLED", persistedStatus);
  }

  private Long createDentist(String adminAuth, int registrationNumber, String email)
      throws Exception {
    Map<String, Object> body =
        Map.of(
            "firstName",
            "Dra",
            "lastName",
            "MySql",
            "email",
            email,
            "registrationNumber",
            registrationNumber);
    String response =
        mockMvc
            .perform(
                post("/dentists")
                    .header("Authorization", adminAuth)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return objectMapper.readTree(response).get("id").asLong();
  }

  private Long createPatient(String adminAuth, int cardIdentity, String email) throws Exception {
    Map<String, Object> body =
        Map.of(
            "firstName",
            "Paciente",
            "lastName",
            "MySql",
            "email",
            email,
            "cardIdentity",
            cardIdentity,
            "admissionDate",
            LocalDate.now().toString());
    String response =
        mockMvc
            .perform(
                post("/patients")
                    .header("Authorization", adminAuth)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return objectMapper.readTree(response).get("id").asLong();
  }

  private Long createSpecialty(String adminAuth, String name, String description) throws Exception {
    Map<String, Object> body = Map.of("name", name, "description", description);
    String response =
        mockMvc
            .perform(
                post("/specialties")
                    .header("Authorization", adminAuth)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
    return objectMapper.readTree(response).get("id").asLong();
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
}
