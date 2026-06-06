package com.dh.dentalClinicMVC.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
public class AppointmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String createDentistAsAdmin(int regNum, String email) throws Exception {
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

        return objectMapper.readTree(response).get("id").asText();
    }

    private String createPatientAsAdmin(int cardId, String email) throws Exception {
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

        return objectMapper.readTree(response).get("id").asText();
    }

    private void createAppointmentAsAdmin(String dentistId, String patientId, String description) throws Exception {
        Map<String, Object> appointment = new HashMap<>();
        appointment.put("dentist_id", Integer.parseInt(dentistId));
        appointment.put("patient_id", Integer.parseInt(patientId));
        appointment.put("date", LocalDate.now().plusDays(1).toString());
        String time = LocalTime.now().plusHours(2).withSecond(0).withNano(0).toString();
        appointment.put("time", time.substring(0, 5));
        appointment.put("description", description);

        mockMvc.perform(post("/appointments")
                        .with(csrf())
                        .with(adminRequestPostProcessor())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(appointment)))
                .andExpect(status().isOk());
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor adminRequestPostProcessor() {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(
                "admin@test.com",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        ));
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

        mockMvc.perform(get("/appointments").accept(MediaType.APPLICATION_JSON))
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

        mockMvc.perform(get("/appointments").accept(MediaType.APPLICATION_JSON))
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

        mockMvc.perform(get("/appointments").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].description").value("My dentist appointment"));
    }
}