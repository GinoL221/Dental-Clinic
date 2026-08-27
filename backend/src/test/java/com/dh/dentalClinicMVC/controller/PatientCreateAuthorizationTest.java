package com.dh.dentalClinicMVC.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class PatientCreateAuthorizationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  private static RequestPostProcessor authAs(String email, String role) {
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(
        new UsernamePasswordAuthenticationToken(
            email, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    return SecurityMockMvcRequestPostProcessors.securityContext(context);
  }

  private static Map<String, Object> validPatientBody(String email, int cardIdentity) {
    Map<String, Object> body = new HashMap<>();
    body.put("firstName", "Authorization");
    body.put("lastName", "Boundary");
    body.put("email", email);
    body.put("cardIdentity", cardIdentity);
    body.put("admissionDate", LocalDate.now().toString());
    return body;
  }

  @Test
  void whenUnauthenticatedUserPostsPatient_thenUnauthorized() throws Exception {
    mockMvc
        .perform(
            post("/patients")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        validPatientBody("unauthenticated-create@test.com", 91001))))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void whenNonAdminPostsPatient_thenForbidden() throws Exception {
    mockMvc
        .perform(
            post("/patients")
                .with(csrf())
                .with(authAs("patient-create@test.com", "PATIENT"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        validPatientBody("patient-create@test.com", 91002))))
        .andExpect(status().isForbidden());
  }

  @Test
  void whenAdminPostsPatient_thenCreated() throws Exception {
    mockMvc
        .perform(
            post("/patients")
                .with(csrf())
                .with(authAs("admin-create@test.com", "ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        validPatientBody("admin-create@test.com", 91003))))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.email").value("admin-create@test.com"));
  }
}
