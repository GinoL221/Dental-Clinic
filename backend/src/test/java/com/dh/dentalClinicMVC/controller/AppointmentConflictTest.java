package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.AppointmentRequestDTO;
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
import java.util.HashMap;
import java.util.Map;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(roles = "ADMIN")
@Transactional
@Rollback
public class AppointmentConflictTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private Long createDentist(int regNum, String email) throws Exception {
        Map<String, Object> dentist = new HashMap<>();
        dentist.put("registrationNumber", regNum);
        dentist.put("firstName", "Dr");
        dentist.put("lastName", "ConflictTest");
        dentist.put("email", email);

        String response = mockMvc.perform(post("/dentists")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dentist)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private Long createPatient(int cardId, String email) throws Exception {
        Map<String, Object> patient = new HashMap<>();
        patient.put("cardIdentity", cardId);
        patient.put("firstName", "Patient");
        patient.put("lastName", "ConflictTest");
        patient.put("email", email);
        patient.put("admissionDate", LocalDate.now().toString());

        String response = mockMvc.perform(post("/patients")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patient)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("id").asLong();
    }

    private String getNextWeekday() {
        LocalDate date = LocalDate.now().plusDays(1);
        while (date.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            date = date.plusDays(1);
        }
        return date.toString();
    }

    @Test
    public void sameDentistSameSlotCreateShouldConflict() throws Exception {
        Long dentistId = createDentist(20001, "dentist1@conflict.com");
        Long patientId1 = createPatient(30001, "patient1@conflict.com");
        Long patientId2 = createPatient(30002, "patient2@conflict.com");
        String dateStr = getNextWeekday();

        // Create first appointment -> 200
        AppointmentRequestDTO app1 = new AppointmentRequestDTO(dentistId, patientId1, dateStr, "10:00", "First");
        mockMvc.perform(post("/appointments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(app1)))
                .andExpect(status().isOk());

        // Create duplicate appointment -> 409
        AppointmentRequestDTO app2 = new AppointmentRequestDTO(dentistId, patientId2, dateStr, "10:00", "Duplicate");
        mockMvc.perform(post("/appointments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(app2)))
                .andExpect(status().isConflict());
    }

    @Test
    public void differentSlotOrDifferentDentistShouldSucceed() throws Exception {
        Long dentistId1 = createDentist(20101, "dentist1@conflict.com");
        Long dentistId2 = createDentist(20102, "dentist2@conflict.com");
        Long patientId1 = createPatient(30101, "patient1@conflict.com");
        Long patientId2 = createPatient(30102, "patient2@conflict.com");
        String dateStr = getNextWeekday();

        // Create first appointment -> 200
        AppointmentRequestDTO app1 = new AppointmentRequestDTO(dentistId1, patientId1, dateStr, "10:00", "First");
        mockMvc.perform(post("/appointments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(app1)))
                .andExpect(status().isOk());

        // Different slot, same dentist -> 200
        AppointmentRequestDTO app2 = new AppointmentRequestDTO(dentistId1, patientId2, dateStr, "11:00", "Different slot");
        mockMvc.perform(post("/appointments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(app2)))
                .andExpect(status().isOk());

        // Same slot, different dentist -> 200
        AppointmentRequestDTO app3 = new AppointmentRequestDTO(dentistId2, patientId2, dateStr, "10:00", "Different dentist");
        mockMvc.perform(post("/appointments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(app3)))
                .andExpect(status().isOk());
    }

    @Test
    public void cancelledAppointmentFreesSlot() throws Exception {
        Long dentistId = createDentist(20201, "dentist1@conflict.com");
        Long patientId1 = createPatient(30201, "patient1@conflict.com");
        Long patientId2 = createPatient(30202, "patient2@conflict.com");
        String dateStr = getNextWeekday();

        // Create first appointment -> 200
        AppointmentRequestDTO app1 = new AppointmentRequestDTO(dentistId, patientId1, dateStr, "10:00", "First");
        String response = mockMvc.perform(post("/appointments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(app1)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Long app1Id = objectMapper.readTree(response).get("id").asLong();

        // Cancel the appointment
        Map<String, String> statusBody = new HashMap<>();
        statusBody.put("status", "CANCELLED");
        mockMvc.perform(patch("/appointments/" + app1Id + "/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusBody)))
                .andExpect(status().isOk());

        // Recreate at same slot -> 200
        AppointmentRequestDTO app2 = new AppointmentRequestDTO(dentistId, patientId2, dateStr, "10:00", "Recreated");
        mockMvc.perform(post("/appointments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(app2)))
                .andExpect(status().isOk());
    }

    @Test
    public void updateOwnSlotShouldSucceed() throws Exception {
        Long dentistId = createDentist(20301, "dentist1@conflict.com");
        Long patientId = createPatient(30301, "patient1@conflict.com");
        String dateStr = getNextWeekday();

        // Create appointment -> 200
        AppointmentRequestDTO app1 = new AppointmentRequestDTO(dentistId, patientId, dateStr, "10:00", "First");
        String response = mockMvc.perform(post("/appointments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(app1)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Long app1Id = objectMapper.readTree(response).get("id").asLong();

        // Update keeping own slot -> 200
        AppointmentRequestDTO app1Update = new AppointmentRequestDTO(dentistId, patientId, dateStr, "10:00", "Updated desc");
        mockMvc.perform(put("/appointments/" + app1Id)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(app1Update)))
                .andExpect(status().isOk());
    }

    @Test
    public void updateCollisionShouldConflict() throws Exception {
        Long dentistId1 = createDentist(20401, "dentist1@conflict.com");
        Long dentistId2 = createDentist(20402, "dentist2@conflict.com");
        Long patientId1 = createPatient(30401, "patient1@conflict.com");
        Long patientId2 = createPatient(30402, "patient2@conflict.com");
        String dateStr = getNextWeekday();

        // Create App 1 for Dentist 1 at 10:00
        AppointmentRequestDTO app1 = new AppointmentRequestDTO(dentistId1, patientId1, dateStr, "10:00", "App 1");
        String response1 = mockMvc.perform(post("/appointments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(app1)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        Long app1Id = objectMapper.readTree(response1).get("id").asLong();

        // Create App 2 for Dentist 2 at 10:00
        AppointmentRequestDTO app2 = new AppointmentRequestDTO(dentistId2, patientId2, dateStr, "10:00", "App 2");
        mockMvc.perform(post("/appointments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(app2)))
                .andExpect(status().isOk());

        // Update App 1 to target Dentist 2 at 10:00 -> 409
        AppointmentRequestDTO app1Update = new AppointmentRequestDTO(dentistId2, patientId1, dateStr, "10:00", "App 1 colliding");
        mockMvc.perform(put("/appointments/" + app1Id)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(app1Update)))
                .andExpect(status().isConflict());
    }
}
