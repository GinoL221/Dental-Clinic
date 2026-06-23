package com.dh.dentalClinicMVC.configuration;

import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Exercises the REAL JwtAuthenticationFilter (full security filter chain,
// no addFilters=false, no securityContext() shortcut) to prove a request
// authenticates from the httpOnly authToken cookie alone, with no
// Authorization header at all. This is the cookie-fallback path added in
// Phase 1 of frontend-xss-token-hardening.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class JwtCookieAuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private IPatientRepository patientRepository;

    @Autowired
    private JwtService jwtService;

    @Test
    void authenticatedGetSucceedsViaCookieAloneWithNoAuthorizationHeader() throws Exception {
        Patient patient = new Patient();
        patient.setEmail("cookie-auth@test.com");
        patient.setFirstName("Cookie");
        patient.setLastName("Auth");
        patient.setPassword("irrelevant-hash");
        patient.setRole(Role.ADMIN);
        patient.setCardIdentity(80001);
        patient.setAdmissionDate(LocalDate.now());
        patientRepository.save(patient);

        String jwt = jwtService.generateToken(patient);

        mockMvc.perform(get("/patients")
                        .cookie(new Cookie("authToken", jwt))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
