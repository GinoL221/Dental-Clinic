package com.dh.dentalClinicMVC.authentication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertIterableEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.configuration.JwtService;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class AuthenticationSessionIntegrationTest {

  private static final List<String> PROFILE_FIELDS =
      List.of("id", "firstName", "lastName", "email", "role");

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private JwtService jwtService;
  @Autowired private IPatientRepository patientRepository;
  @Autowired private PasswordEncoder passwordEncoder;

  @Value("${app.jwt.secret}")
  private String secretKey;

  @Test
  void authenticatedProfileReturnsExactlyFivePublicFields() throws Exception {
    Patient patient = seedPatient("session-profile@test.com", 91001);

    String response =
        mockMvc
            .perform(
                get("/auth/me")
                    .header("Authorization", "Bearer " + jwtService.generateToken(patient)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(patient.getId()))
            .andExpect(jsonPath("$.firstName").value("Session"))
            .andExpect(jsonPath("$.lastName").value("Profile"))
            .andExpect(jsonPath("$.email").value(patient.getEmail()))
            .andExpect(jsonPath("$.role").value("PATIENT"))
            .andReturn()
            .getResponse()
            .getContentAsString();

    JsonNode body = objectMapper.readTree(response);
    List<String> actualFields = new ArrayList<>();
    body.fieldNames().forEachRemaining(actualFields::add);
    assertIterableEquals(PROFILE_FIELDS, actualFields);
    assertEquals(PROFILE_FIELDS.size(), body.size());
  }

  @Test
  void absentCredentialReturnsEstablishedUnauthorizedResponse() throws Exception {
    expectUnauthorized(null);
  }

  @Test
  void malformedCredentialReturnsEstablishedUnauthorizedResponse() throws Exception {
    expectUnauthorized("not-a-real-jwt");
  }

  @Test
  void expiredCredentialReturnsEstablishedUnauthorizedResponse() throws Exception {
    Patient patient = seedPatient("expired-session@test.com", 91002);
    String expiredToken = expiredTokenFor(patient);

    expectUnauthorized(expiredToken);
  }

  @Test
  void deletedUserCredentialReturnsEstablishedUnauthorizedResponse() throws Exception {
    UserDetails deletedUser =
        User.withUsername("deleted-session@test.com")
            .password("irrelevant")
            .authorities("ROLE_PATIENT")
            .build();

    expectUnauthorized(jwtService.generateToken(deletedUser));
  }

  private Patient seedPatient(String email, int cardIdentity) {
    Patient patient = new Patient();
    patient.setEmail(email);
    patient.setFirstName("Session");
    patient.setLastName("Profile");
    patient.setPassword(passwordEncoder.encode("password"));
    patient.setRole(Role.PATIENT);
    patient.setCardIdentity(cardIdentity);
    patient.setAdmissionDate(LocalDate.now());
    return patientRepository.save(patient);
  }

  private String expiredTokenFor(UserDetails userDetails) {
    Key signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
    Date expiredAt = new Date(System.currentTimeMillis() - 1_000);
    return Jwts.builder()
        .setSubject(userDetails.getUsername())
        .setIssuedAt(new Date(expiredAt.getTime() - 1_000))
        .setExpiration(expiredAt)
        .signWith(signingKey, SignatureAlgorithm.HS256)
        .compact();
  }

  private void expectUnauthorized(String token) throws Exception {
    MockHttpServletRequestBuilder request = get("/auth/me").contentType(MediaType.APPLICATION_JSON);
    if (token != null) {
      request = request.header("Authorization", "Bearer " + token);
    }

    mockMvc
        .perform(request)
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("No autenticado"))
        .andExpect(jsonPath("$.status").value(401));
  }
}
