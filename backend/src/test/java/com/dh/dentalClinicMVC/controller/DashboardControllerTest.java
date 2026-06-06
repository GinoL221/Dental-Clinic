package com.dh.dentalClinicMVC.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "ADMIN")
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReturnSnapshotWithExpectedStructure() throws Exception {
        mockMvc.perform(get("/dashboard/snapshot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAppointments").isNumber())
                .andExpect(jsonPath("$.totalDentists").isNumber())
                .andExpect(jsonPath("$.totalPatients").isNumber())
                .andExpect(jsonPath("$.todayAppointments").isNumber())
                .andExpect(jsonPath("$.monthlyStats").isArray())
                .andExpect(jsonPath("$.upcomingAppointments").isArray());
    }
}
