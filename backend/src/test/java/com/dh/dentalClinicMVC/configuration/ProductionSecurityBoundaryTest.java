package com.dh.dentalClinicMVC.configuration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("prod")
@TestPropertySource(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:prod-sec-boundary;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
      "spring.datasource.username=sa",
      "spring.datasource.password=sa",
      "spring.datasource.driver-class-name=org.h2.Driver",
      "spring.flyway.enabled=false",
      "spring.jpa.hibernate.ddl-auto=create-drop",
      "spring.sql.init.mode=never",
      "app.jwt.secret=dGVzdFNlY3JldEtleUZvclRlc3RpbmdPbmx5MTIzNDU2Nzg="
    })
class ProductionSecurityBoundaryTest {

  @Autowired private MockMvc mockMvc;

  @Test
  @DisplayName("Legacy static HTML/asset routes require authentication (no permitAll)")
  void legacyStaticRoutesShouldRequireAuthentication() throws Exception {
    mockMvc.perform(get("/index.html")).andExpect(status().isUnauthorized());
    mockMvc.perform(get("/login.html")).andExpect(status().isUnauthorized());
    mockMvc.perform(get("/register.html")).andExpect(status().isUnauthorized());
    mockMvc.perform(get("/dentistList.html")).andExpect(status().isUnauthorized());
    mockMvc.perform(get("/dentistAdd.html")).andExpect(status().isUnauthorized());
    mockMvc.perform(get("/js/app.js")).andExpect(status().isUnauthorized());
    mockMvc.perform(get("/css/style.css")).andExpect(status().isUnauthorized());
    mockMvc.perform(get("/images/logo.png")).andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName("H2 console route requires authentication even in prod")
  void h2ConsoleShouldRequireAuthentication() throws Exception {
    mockMvc.perform(get("/h2-console/")).andExpect(status().isUnauthorized());
  }

  @Test
  @DisplayName(
      "Actuator health endpoint is public without internals while other actuator paths stay protected")
  void actuatorHealthIsPublicWithoutDetailsAndOtherActuatorPathsRequireAuth() throws Exception {
    mockMvc
        .perform(get("/actuator/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"))
        .andExpect(jsonPath("$.components").doesNotExist());

    mockMvc.perform(get("/actuator/env")).andExpect(status().isUnauthorized());
    mockMvc.perform(get("/actuator/beans")).andExpect(status().isUnauthorized());
  }
}
