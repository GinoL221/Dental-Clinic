package com.dh.dentalClinicMVC.authentication;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@Transactional
@Rollback
class AuthenticationRegistrationTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Autowired private IUserRepository userRepository;

  @Autowired private IPatientRepository patientRepository;

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
        .andExpect(jsonPath("$.error").value("Datos inválidos"))
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(
            jsonPath("$.message").value(containsString("password: La contraseña es requerida")));

    assertTrue(userRepository.findByEmail(email).isEmpty());
  }

  @Test
  void whenRegisterWithMalformedInput_thenValidationBadRequestAndNoAccountPersisted()
      throws Exception {
    String email = "not-an-email";
    Map<String, Object> body = validRegistrationBody(email, "short");
    body.put("firstName", "A");
    body.put("cardIdentity", 0);

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("Datos inválidos"))
        .andExpect(jsonPath("$.status").value(400));

    assertTrue(userRepository.findByEmail(email).isEmpty());
  }

  @Test
  void whenRegisterWithExistingEmail_thenConflictWithErrorResponse() throws Exception {
    String email = "duplicate-registration@test.com";
    Map<String, Object> body = validRegistrationBody(email, "secret123");

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk());

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.error").value("Recurso duplicado"))
        .andExpect(jsonPath("$.status").value(409))
        .andExpect(jsonPath("$.message").value("El email ya está registrado"));
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

  @Test
  void whenRegisterWithBcryptShapedPassword_thenPasswordIsReencodedNotStoredVerbatim()
      throws Exception {
    // A bcrypt-shaped value must be treated as a raw password: storing it verbatim would
    // let the caller plant a hash whose preimage they know. import.sql-shaped literal.
    String submitted = "$2a$10$CwTycUXWue0Thq9StjUM0uBUcpkmhBr.4NQJZ6lq3ZUklA.J5eOzq";
    String email = "shaped-password-registration@test.com";
    Map<String, Object> body = validRegistrationBody(email, submitted);
    body.put("role", "PATIENT");

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.role").value("PATIENT"));

    var savedUser = userRepository.findByEmail(email).orElseThrow();
    assertNotEquals(submitted, savedUser.getPassword());
    assertTrue(passwordEncoder.matches(submitted, savedUser.getPassword()));
  }

  @Test
  public void whenRegisterWithPasswordLongerThan72_thenBadRequestAndNoAccountPersisted()
      throws Exception {
    String email = "long-password-registration@test.com";
    Map<String, Object> body = validRegistrationBody(email, "a".repeat(73));

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("Datos inválidos"))
        .andExpect(
            jsonPath("$.message")
                .value(
                    containsString("password: La contraseña no puede superar los 72 caracteres")));

    assertTrue(userRepository.findByEmail(email).isEmpty());
  }

  @Test
  public void whenRegisterWithPasswordOfExactly72_thenSuccess() throws Exception {
    // The 72-byte boundary must stay accepted: bcrypt only uses the first 72 bytes.
    String email = "max-password-registration@test.com";
    String password = "b".repeat(72);
    Map<String, Object> body = validRegistrationBody(email, password);

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.role").value("PATIENT"));

    var savedUser = userRepository.findByEmail(email).orElseThrow();
    assertTrue(passwordEncoder.matches(password, savedUser.getPassword()));
  }

  @Test
  public void whenRegisterWithPartialAddress_thenSuccessAndStreetPersisted() throws Exception {
    // The register form sends partial addresses: empty strings for location/province and
    // 0 for number when those fields are left blank (frontend +page.server.js).
    String email = "partial-address-registration@test.com";
    Map<String, Object> body = validRegistrationBody(email, "secret123");
    body.put(
        "address", Map.of("street", "Calle Falsa", "number", 0, "location", "", "province", ""));

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.role").value("PATIENT"));

    var savedPatient = patientRepository.findByEmail(email).orElseThrow();
    assertEquals("Calle Falsa", savedPatient.getAddress().getStreet());
    assertEquals(0, savedPatient.getAddress().getNumber());
  }

  @Test
  public void whenRegisterWithTooLongStreet_thenBadRequestAndNoAccountPersisted() throws Exception {
    String email = "long-street-registration@test.com";
    Map<String, Object> body = validRegistrationBody(email, "secret123");
    body.put(
        "address", Map.of("street", "x".repeat(256), "number", 0, "location", "", "province", ""));

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("Datos inválidos"));

    assertTrue(userRepository.findByEmail(email).isEmpty());
  }

  @Test
  public void whenRegisterWithNegativeAddressNumber_thenBadRequestAndNoAccountPersisted()
      throws Exception {
    String email = "negative-number-registration@test.com";
    Map<String, Object> body = validRegistrationBody(email, "secret123");
    body.put(
        "address", Map.of("street", "Calle Falsa", "number", -1, "location", "", "province", ""));

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("Datos inválidos"));

    assertTrue(userRepository.findByEmail(email).isEmpty());
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
