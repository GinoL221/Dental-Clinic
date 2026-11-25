package com.dh.dentalClinicMVC.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.configuration.JwtService;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Date;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class JwtRevocationLifecycleTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private IPatientRepository patientRepository;
  @Autowired private PasswordEncoder passwordEncoder;
  @Autowired private JwtService jwtService;
  @Autowired private ObjectMapper objectMapper;

  @Value("${app.jwt.secret}")
  private String jwtSecret;

  private Patient seedPatient(String email, String rawPassword, int cardIdentity) {
    Patient patient = new Patient();
    patient.setFirstName("Revoke");
    patient.setLastName("User");
    patient.setEmail(email);
    patient.setPassword(passwordEncoder.encode(rawPassword));
    patient.setRole(Role.PATIENT);
    patient.setCardIdentity(cardIdentity);
    patient.setAdmissionDate(LocalDate.now());
    return patientRepository.save(patient);
  }

  @Test
  void changePasswordRevokesPreviouslyIssuedJwtAndNewLoginTokenWorks() throws Exception {
    String email = "jwt.revoke.changepw@test.com";
    seedPatient(email, "BeforeChange123!", 92001001);

    String loginJson =
        mockMvc
            .perform(
                post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"" + email + "\",\"password\":\"BeforeChange123!\"}"))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    String oldJwt = objectMapper.readTree(loginJson).get("token").asString();

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + oldJwt))
        .andExpect(status().isOk());

    mockMvc
        .perform(
            post("/auth/change-password")
                .header("Authorization", "Bearer " + oldJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"currentPassword\":\"BeforeChange123!\",\"newPassword\":\"AfterChange456!\"}"))
        .andExpect(status().isNoContent());

    // Pre-change JWT must be rejected on both Bearer and authToken cookie paths
    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + oldJwt))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));

    mockMvc
        .perform(get("/appointments").cookie(new Cookie("authToken", oldJwt)))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));

    // Logging in with the new password issues a fresh valid token
    String newLoginJson =
        mockMvc
            .perform(
                post("/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"" + email + "\",\"password\":\"AfterChange456!\"}"))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    String newJwt = objectMapper.readTree(newLoginJson).get("token").asString();

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + newJwt))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value(email));
  }

  @Test
  void logoutRevokesActiveJwtAndRejectsUnauthenticatedLogout() throws Exception {
    mockMvc
        .perform(post("/auth/logout"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));

    String email = "jwt.revoke.logout@test.com";
    Patient patient = seedPatient(email, "LogoutPass123!", 92001002);
    String jwt = jwtService.generateToken(patient);

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + jwt))
        .andExpect(status().isOk());

    mockMvc
        .perform(post("/auth/logout").header("Authorization", "Bearer " + jwt))
        .andExpect(status().isNoContent());

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + jwt))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));

    mockMvc
        .perform(get("/appointments").cookie(new Cookie("authToken", jwt)))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));
  }

  @Test
  void jwtMissingTokenVersionClaimIsRejectedFailClosed() throws Exception {
    String email = "jwt.missing.tv@test.com";
    seedPatient(email, "LegacyPass123!", 92001003);

    Instant now = Instant.now();
    String legacyTokenWithoutTv =
        Jwts.builder()
            .subject(email)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(Duration.ofHours(1))))
            .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret)), Jwts.SIG.HS256)
            .compact();

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + legacyTokenWithoutTv))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));
  }

  @Test
  void adminPasswordUpdateViaPutRevokesUserPreviousJwt() throws Exception {
    String email = "jwt.admin.put.pw@test.com";
    Patient patient = seedPatient(email, "InitialPass123!", 92001004);
    String oldJwt = jwtService.generateToken(patient);

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + oldJwt))
        .andExpect(status().isOk());

    mockMvc
        .perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put(
                    "/patients/{id}", patient.getId())
                .with(
                    org.springframework.security.test.web.servlet.request
                        .SecurityMockMvcRequestPostProcessors.user("admin@test.com")
                        .roles("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"firstName\":\"Revoke\",\"lastName\":\"User\",\"email\":\""
                        + email
                        + "\",\"cardIdentity\":92001004,\"admissionDate\":\""
                        + LocalDate.now()
                        + "\",\"password\":\"AdminReset456!\"}"))
        .andExpect(status().isOk());

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + oldJwt))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401));
  }
}
