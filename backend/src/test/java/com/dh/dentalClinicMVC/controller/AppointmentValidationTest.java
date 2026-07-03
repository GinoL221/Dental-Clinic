package com.dh.dentalClinicMVC.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(roles = "ADMIN")
@Transactional
@Rollback
public class AppointmentValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void createAppointmentWithPastDateShouldReturnBadRequest() throws Exception {
        // Crear dentista
        String dentistJson = "{\"registrationNumber\":5555,\"firstName\":\"Al\",\"lastName\":\"Bo\",\"email\":\"v1dentist@example.com\"}";
        String dentistResponse = mockMvc.perform(post("/dentists").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(dentistJson))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int dentistId = objectMapper.readTree(dentistResponse).get("id").asInt();

        // Crear paciente
        String admissionDate = LocalDate.now().toString();
        String patientJson = String.format("{\"cardIdentity\":5555,\"firstName\":\"Pa\",\"lastName\":\"Qu\",\"email\":\"v1patient@example.com\",\"admissionDate\":\"%s\"}", admissionDate);
        String patientResponse = mockMvc.perform(post("/patients").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(patientJson))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int patientId = objectMapper.readTree(patientResponse).get("id").asInt();

        // Fecha anterior
        String date = LocalDate.now().minusDays(1).toString();
        String time = LocalTime.now().plusHours(1).withSecond(0).withNano(0).toString();

        String appointmentJson = objectMapper.writeValueAsString(
                new java.util.HashMap<String, Object>() {{
                    put("dentist_id", dentistId);
                    put("patient_id", patientId);
                    put("date", date);
                    put("time", time.substring(0,5));
                    put("description", "Past date appointment");
                }});

        mockMvc.perform(post("/appointments").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(appointmentJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La fecha no puede ser anterior a hoy"));
    }

    @Test
    public void createAppointmentWithPastTimeTodayShouldReturnBadRequest() throws Exception {
        // Crear dentista
        String dentistJson = "{\"registrationNumber\":5556,\"firstName\":\"Al\",\"lastName\":\"Bo\",\"email\":\"v2dentist@example.com\"}";
        String dentistResponse = mockMvc.perform(post("/dentists").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(dentistJson))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int dentistId = objectMapper.readTree(dentistResponse).get("id").asInt();

        // Crear paciente
        String admissionDate = LocalDate.now().toString();
        String patientJson = String.format("{\"cardIdentity\":5556,\"firstName\":\"Pa\",\"lastName\":\"Qu\",\"email\":\"v2patient@example.com\",\"admissionDate\":\"%s\"}", admissionDate);
        String patientResponse = mockMvc.perform(post("/patients").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(patientJson))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        int patientId = objectMapper.readTree(patientResponse).get("id").asInt();

        // Fecha hoy y hora pasada
        String date = LocalDate.now().toString();
        LocalTime now = LocalTime.now();
        LocalTime pastTime = now.getHour() >= 1
                ? now.minusHours(1).withSecond(0).withNano(0)
                : now.withSecond(0).withNano(0);
        String time = pastTime.toString();

        String appointmentJson = objectMapper.writeValueAsString(
                new java.util.HashMap<String, Object>() {{
                    put("dentist_id", dentistId);
                    put("patient_id", patientId);
                    put("date", date);
                    put("time", time.substring(0,5));
                    put("description", "Past time today appointment");
                }});

        mockMvc.perform(post("/appointments").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(appointmentJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La hora seleccionada ya pasó"));
    }
}
