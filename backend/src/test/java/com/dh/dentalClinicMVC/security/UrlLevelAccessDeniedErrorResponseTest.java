package com.dh.dentalClinicMVC.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class UrlLevelAccessDeniedErrorResponseTest {

  @Autowired private MockMvc mockMvc;

  @Test
  @WithMockUser(roles = "DENTIST")
  @DisplayName("URL-level 403 must return the ErrorResponse JSON contract, not the default body")
  void whenAuthenticatedUserRoleIsDeniedAtUrlLevel_thenErrorResponseJson() throws Exception {
    mockMvc
        .perform(get("/admin/anything"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error").value("Acceso denegado"))
        .andExpect(jsonPath("$.status").value(403))
        .andExpect(jsonPath("$.path").value("/admin/anything"))
        .andExpect(jsonPath("$.message").value("No tienes permisos para realizar esta acción"));
  }
}
