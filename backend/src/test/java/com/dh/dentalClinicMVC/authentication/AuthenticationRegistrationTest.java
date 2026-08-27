package com.dh.dentalClinicMVC.authentication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@Transactional
@Rollback
class AuthenticationRegistrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Autowired private IUserRepository userRepository;

  @Autowired private PasswordEncoder passwordEncoder;

  @Test
  void whenRegisterWithRoleDentist_thenBadRequestAndNoAccountPersisted() throws Exception {
    String email = "public-dentist-registration@test.com";
    Map<String, Object> body = validRegistrationBody(email, "secret123");
    body.put("role", "DENTIST");

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(
            jsonPath("$.message")
                .value("El registro público solo permite crear cuentas de pacientes"));

    assertTrue(userRepository.findByEmail(email).isEmpty());
  }

  @ParameterizedTest
  @ValueSource(strings = {"", "   ", "\t"})
  void whenRegisterWithBlankPassword_thenBadRequestAndNoAccountPersisted(String password)
      throws Exception {
    String email = "blank-password-registration@test.com";
    Map<String, Object> body = validRegistrationBody(email, password);

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("La contraseña es requerida"));

    assertTrue(userRepository.findByEmail(email).isEmpty());
  }

  @Test
  void whenRegisterWithValidPatientPassword_thenPasswordIsEncoded() throws Exception {
    String email = "encoded-password-registration@test.com";
    String rawPassword = "secret123";
    Map<String, Object> body = validRegistrationBody(email, rawPassword);
    body.put("role", "PATIENT");

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.role").value("PATIENT"));

    var savedUser = userRepository.findByEmail(email).orElseThrow();
    assertEquals(Role.PATIENT, savedUser.getRole());
    assertNotEquals(rawPassword, savedUser.getPassword());
    assertTrue(passwordEncoder.matches(rawPassword, savedUser.getPassword()));
  }

  private Map<String, Object> validRegistrationBody(String email, String password) {
    Map<String, Object> body = new HashMap<>();
    body.put("firstName", "Public");
    body.put("lastName", "Patient");
    body.put("email", email);
    body.put("password", password);
    body.put("cardIdentity", 90123456);
    return body;
  }
}
