package com.dh.dentalClinicMVC.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.dto.DashboardSnapshotDTO;
import com.dh.dentalClinicMVC.service.IDashboardSnapshotService;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "ADMIN")
class DashboardControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockBean private IDashboardSnapshotService dashboardSnapshotService;

  @BeforeEach
  void setUp() {
    when(dashboardSnapshotService.getDashboardSnapshot(any(), any(), any()))
        .thenReturn(DashboardSnapshotDTO.withDefaults());
  }

  @Test
  void shouldReturnSnapshotWithExpectedStructure() throws Exception {
    mockMvc
        .perform(get("/dashboard/snapshot"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalAppointments").isNumber())
        .andExpect(jsonPath("$.totalDentists").isNumber())
        .andExpect(jsonPath("$.totalPatients").isNumber())
        .andExpect(jsonPath("$.todayAppointments").isNumber())
        .andExpect(jsonPath("$.monthlyStats").isArray())
        .andExpect(jsonPath("$.upcomingAppointments").isArray());
  }

  @Test
  void shouldReturn400WhenFromIsAfterTo() throws Exception {
    mockMvc
        .perform(get("/dashboard/snapshot").param("from", "2026-06-01").param("to", "2026-01-01"))
        .andExpect(status().isBadRequest());

    verifyNoInteractions(dashboardSnapshotService);
  }

  @Test
  void shouldBindAndForwardFromToAndDentistIdParamsToTheService() throws Exception {
    mockMvc
        .perform(
            get("/dashboard/snapshot")
                .param("from", "2026-01-01")
                .param("to", "2026-06-01")
                .param("dentistId", "7"))
        .andExpect(status().isOk());

    verify(dashboardSnapshotService)
        .getDashboardSnapshot(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 6, 1), 7L);
  }
}
