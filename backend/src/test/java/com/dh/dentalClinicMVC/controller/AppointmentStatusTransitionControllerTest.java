package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.AppointmentRequestDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
public class AppointmentStatusTransitionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static org.springframework.test.web.servlet.request.RequestPostProcessor adminRequestPostProcessor() {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(
                "admin@test.com",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        ));
        return SecurityMockMvcRequestPostProcessors.securityContext(context);
    }

    private Long createDentist(int regNum, String email) throws Exception {
        Map<String, Object> dentist = new HashMap<>();
        dentist.put("registrationNumber", regNum);
        dentist.put("firstName", "Dr");
        dentist.put("lastName", "Test");
        dentist.put("email", email);

        String response = mockMvc.perform(post("/dentists")
                        .with(csrf())
                        .with(adminRequestPostProcessor())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dentist)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private Long createPatient(int cardId, String email) throws Exception {
        Map<String, Object> patient = new HashMap<>();
        patient.put("cardIdentity", cardId);
        patient.put("firstName", "Test");
        patient.put("lastName", "Patient");
        patient.put("email", email);
        patient.put("admissionDate", LocalDate.now().toString());

        String response = mockMvc.perform(post("/patients")
                        .with(csrf())
                        .with(adminRequestPostProcessor())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patient)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private Long createAppointment(Long dentistId, Long patientId, String date, String time) throws Exception {
        AppointmentRequestDTO dto = new AppointmentRequestDTO(
                dentistId,
                patientId,
                date,
                time,
                "Regular checkup"
        );

        String response = mockMvc.perform(post("/appointments")
                        .with(csrf())
                        .with(adminRequestPostProcessor())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private void patchStatus(Long id, String targetStatus, int expectedStatusCode) throws Exception {
        Map<String, String> body = new HashMap<>();
        body.put("status", targetStatus);

        mockMvc.perform(patch("/appointments/" + id + "/status")
                        .with(csrf())
                        .with(adminRequestPostProcessor())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().is(expectedStatusCode));
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testLegalTransitionsAndSameStatusNoOps() throws Exception {
        Long dentistId = createDentist(12345, "dentist_tr1@test.com");
        Long patientId = createPatient(12345, "patient_tr1@test.com");
        Long appId = createAppointment(dentistId, patientId, LocalDate.now().plusDays(1).toString(), "10:00");

        // Initial status is SCHEDULED.
        // SCHEDULED -> SCHEDULED (no-op)
        patchStatus(appId, "SCHEDULED", 200);

        // SCHEDULED -> IN_PROGRESS
        patchStatus(appId, "IN_PROGRESS", 200);

        // IN_PROGRESS -> IN_PROGRESS (no-op)
        patchStatus(appId, "IN_PROGRESS", 200);

        // IN_PROGRESS -> COMPLETED
        patchStatus(appId, "COMPLETED", 200);

        // COMPLETED -> COMPLETED (no-op)
        patchStatus(appId, "COMPLETED", 200);
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testScheduledToCancelledLegalTransition() throws Exception {
        Long dentistId = createDentist(12346, "dentist_tr2@test.com");
        Long patientId = createPatient(12346, "patient_tr2@test.com");
        Long appId = createAppointment(dentistId, patientId, LocalDate.now().plusDays(1).toString(), "11:00");

        // SCHEDULED -> CANCELLED
        patchStatus(appId, "CANCELLED", 200);

        // CANCELLED -> CANCELLED (no-op)
        patchStatus(appId, "CANCELLED", 200);
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testInProgressToCancelledLegalTransition() throws Exception {
        Long dentistId = createDentist(12347, "dentist_tr3@test.com");
        Long patientId = createPatient(12347, "patient_tr3@test.com");
        Long appId = createAppointment(dentistId, patientId, LocalDate.now().plusDays(1).toString(), "12:00");

        // SCHEDULED -> IN_PROGRESS
        patchStatus(appId, "IN_PROGRESS", 200);

        // IN_PROGRESS -> CANCELLED
        patchStatus(appId, "CANCELLED", 200);
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testIllegalTransitionsFromInProgress() throws Exception {
        Long dentistId = createDentist(12348, "dentist_tr4@test.com");
        Long patientId = createPatient(12348, "patient_tr4@test.com");
        Long appId = createAppointment(dentistId, patientId, LocalDate.now().plusDays(1).toString(), "13:00");

        // SCHEDULED -> IN_PROGRESS
        patchStatus(appId, "IN_PROGRESS", 200);

        // IN_PROGRESS -> SCHEDULED (illegal) -> 409
        patchStatus(appId, "SCHEDULED", 409);
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testIllegalTransitionsFromCompleted() throws Exception {
        Long dentistId = createDentist(12349, "dentist_tr5@test.com");
        Long patientId = createPatient(12349, "patient_tr5@test.com");
        Long appId = createAppointment(dentistId, patientId, LocalDate.now().plusDays(1).toString(), "14:00");

        // SCHEDULED -> COMPLETED
        patchStatus(appId, "COMPLETED", 200);

        // COMPLETED -> SCHEDULED (illegal) -> 409
        patchStatus(appId, "SCHEDULED", 409);

        // COMPLETED -> IN_PROGRESS (illegal) -> 409
        patchStatus(appId, "IN_PROGRESS", 409);

        // COMPLETED -> CANCELLED (illegal) -> 409
        patchStatus(appId, "CANCELLED", 409);
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void testIllegalTransitionsFromCancelled() throws Exception {
        Long dentistId = createDentist(12350, "dentist_tr6@test.com");
        Long patientId = createPatient(12350, "patient_tr6@test.com");
        Long appId = createAppointment(dentistId, patientId, LocalDate.now().plusDays(1).toString(), "15:00");

        // SCHEDULED -> CANCELLED
        patchStatus(appId, "CANCELLED", 200);

        // CANCELLED -> SCHEDULED (illegal) -> 409
        patchStatus(appId, "SCHEDULED", 409);

        // CANCELLED -> IN_PROGRESS (illegal) -> 409
        patchStatus(appId, "IN_PROGRESS", 409);

        // CANCELLED -> COMPLETED (illegal) -> 409
        patchStatus(appId, "COMPLETED", 409);
    }
}
