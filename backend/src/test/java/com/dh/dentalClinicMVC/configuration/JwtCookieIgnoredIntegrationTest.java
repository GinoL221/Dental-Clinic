package com.dh.dentalClinicMVC.configuration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import jakarta.servlet.http.Cookie;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

// Exercises the REAL JwtAuthenticationFilter (full security filter chain,
// no addFilters=false, no securityContext() shortcut) to prove the backend
// is header-only since auth-security-hardening S2: a real, valid JWT sent
// ONLY as the SvelteKit session's authToken cookie must get the standard
// 401 error body on a protected route, while the very same JWT as
// Authorization: Bearer still authenticates. The cookie belongs to the
// frontend session store and is never read by the backend.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class JwtCookieIgnoredIntegrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private IPatientRepository patientRepository;

  @Autowired private JwtService jwtService;

  @Test
  void bearerHeaderAuthenticatesButAuthTokenCookieAloneIsIgnoredWithStandard401() throws Exception {
    Patient patient = new Patient();
    patient.setEmail("cookie-ignored@test.com");
    patient.setFirstName("Cookie");
    patient.setLastName("Ignored");
    patient.setPassword("irrelevant-hash");
    patient.setRole(Role.PATIENT);
    patient.setCardIdentity(80001);
    patient.setAdmissionDate(LocalDate.now());
    patientRepository.save(patient);

    String jwt = jwtService.generateToken(patient);

    // Same JWT as Authorization: Bearer must still authenticate (regression
    // guard: removing the fallback must not break the header path).
    mockMvc
        .perform(
            get("/patients/{id}", patient.getId())
                .header("Authorization", "Bearer " + jwt)
                .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk());

    // The identical JWT sent ONLY as the authToken cookie must be ignored:
    // standard StalePrincipalEntryPoint 401 error body, never a 200.
    mockMvc
        .perform(
            get("/auth/me").cookie(new Cookie("authToken", jwt)).accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("No autenticado"))
        .andExpect(jsonPath("$.status").value(401));
  }

  // Resilience guarantee kept from the former cookie-fallback coverage, now
  // proven on the header path: a malformed Bearer token must not 500 — filters
  // run before DispatcherServlet, so no @ControllerAdvice can catch an
  // unchecked JwtException that escapes the filter chain.
  @Test
  void malformedHeaderTokenRejectsWithoutServerError() throws Exception {
    mockMvc
        .perform(
            get("/patients")
                .header("Authorization", "Bearer not-a-real-jwt")
                .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().is4xxClientError());
  }
}
