package com.dh.dentalClinicMVC.authentication;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@Transactional
@Rollback
class AuthenticationControllerTest {

  @Autowired private MockMvc mockMvc;

  @Autowired private ObjectMapper objectMapper;

  @Autowired private IUserRepository userRepository;

  // Item 6: PUT /auth/update-names/{email} must not exist as a route anymore.
  // Deliberately omit the (formerly) required firstName/lastName query params:
  // while the route existed, Spring would reject this with 400 (missing
  // required @RequestParam) before the method body ran. With the route gone,
  // the DispatcherServlet has no handler mapped at all and returns 404. This
  // distinguishes "route removed" from the old method's own "user not found"
  // 404, which would have produced the same status code as a false positive.
  @Test
  public void whenPutUpdateNames_thenRouteNotFound() throws Exception {
    mockMvc.perform(put("/auth/update-names/any@x.com")).andExpect(status().isNotFound());
  }

  // Item 1: public registration must reject role=ADMIN with 400, and must
  // not create any ADMIN account as a side effect (verified via repository,
  // not just the HTTP response).
  @Test
  public void whenRegisterWithRoleAdmin_thenBadRequestAndNoAdminPersisted() throws Exception {
    Map<String, Object> body = new HashMap<>();
    body.put("firstName", "Hacker");
    body.put("lastName", "Tries");
    body.put("email", "hacker-admin@test.com");
    body.put("password", "secret123");
    body.put("role", "ADMIN");
    body.put("cardIdentity", 90011000);

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest());

    assertTrue(
        userRepository.findByEmail("hacker-admin@test.com").isEmpty(),
        "No account should have been persisted for a rejected ADMIN self-registration");
  }

  // Item 1: role=PATIENT registration is unchanged by the new guard.
  @Test
  public void whenRegisterWithRolePatient_thenSucceedsAsPatient() throws Exception {
    Map<String, Object> body = new HashMap<>();
    body.put("firstName", "Pat");
    body.put("lastName", "Ient");
    body.put("email", "pat-role-patient@test.com");
    body.put("password", "secret123");
    body.put("role", "PATIENT");
    body.put("cardIdentity", 90011001);

    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk());

    Role persistedRole =
        userRepository
            .findByEmail("pat-role-patient@test.com")
            .orElseThrow(() -> new AssertionError("Expected a persisted PATIENT account"))
            .getRole();
    assertTrue(
        persistedRole == Role.PATIENT,
        "Expected persisted role to be PATIENT, was " + persistedRole);
  }

  @Test
  public void whenCheckEmailWithExistingAccount_thenReturnsTrue() throws Exception {
    registerPatient("Check", "Exists", "check-email-existing@test.com", "secret123", 90011003);

    mockMvc
        .perform(get("/auth/check-email").param("email", "check-email-existing@test.com"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").value(true));
  }

  @Test
  public void whenCheckEmailWithMissingAccount_thenReturnsFalse() throws Exception {
    mockMvc
        .perform(get("/auth/check-email").param("email", "check-email-missing@test.com"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").value(false));
  }

  @Test
  public void whenRegisterSucceeds_thenResponseShapeRemainsCompatible() throws Exception {
    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        patientRegistrationBody(
                            "Reg", "Compat", "register-compat@test.com", "secret123", 90011004))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").isNotEmpty())
        .andExpect(jsonPath("$.role").value("PATIENT"))
        .andExpect(jsonPath("$.id").isNumber())
        .andExpect(jsonPath("$.firstName").value("Reg"))
        .andExpect(jsonPath("$.lastName").value("Compat"))
        .andExpect(jsonPath("$.email").value("register-compat@test.com"));
  }

  @Test
  public void whenLoginSucceeds_thenResponseShapeRemainsCompatible() throws Exception {
    registerPatient("Login", "Compat", "login-compat@test.com", "secret123", 90011005);

    Map<String, Object> loginBody = new HashMap<>();
    loginBody.put("email", "login-compat@test.com");
    loginBody.put("password", "secret123");

    mockMvc
        .perform(
            post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginBody)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").isNotEmpty())
        .andExpect(jsonPath("$.role").value("PATIENT"))
        .andExpect(jsonPath("$.id").isNumber())
        .andExpect(jsonPath("$.firstName").value("Login"))
        .andExpect(jsonPath("$.lastName").value("Compat"))
        .andExpect(jsonPath("$.email").value("login-compat@test.com"));
  }

  @Test
  public void whenLoginWithMalformedInput_thenValidationBadRequestAndNoRegistrationSideEffect()
      throws Exception {
    String email = "malformed-login@test.com";
    Map<String, Object> loginBody = new HashMap<>();
    loginBody.put("email", email);
    loginBody.put("password", " ");

    mockMvc
        .perform(
            post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginBody)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("Datos inválidos"))
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(
            jsonPath("$.message").value(containsString("password: La contraseña es requerida")));

    assertTrue(userRepository.findByEmail(email).isEmpty());
  }

  // Item 1: a request with no role field at all must default to PATIENT,
  // not NPE. Pre-fix, request.getRole() == null fed directly into a switch
  // statement on the primitive-unboxing-free enum, which throws NPE on null.
  @Test
  public void whenRegisterWithNoRoleField_thenDefaultsToPatient() throws Exception {
    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        patientRegistrationBody(
                            "No", "Role", "no-role-field@test.com", "secret123", 90011002))))
        .andExpect(status().isOk());

    Role persistedRole =
        userRepository
            .findByEmail("no-role-field@test.com")
            .orElseThrow(() -> new AssertionError("Expected a persisted PATIENT account"))
            .getRole();
    assertTrue(
        persistedRole == Role.PATIENT,
        "Expected persisted role to be PATIENT, was " + persistedRole);
  }

  @Test
  @org.springframework.security.test.context.support.WithMockUser(username = "changepw@test.com")
  public void whenChangePasswordValid_thenSuccessAndClearsFlag() throws Exception {
    String email = "changepw@test.com";
    registerPatient("Carlos", "Gomez", email, "oldPass123!", 90055001);

    com.dh.dentalClinicMVC.entity.User user = userRepository.findByEmail(email).orElseThrow();
    user.setMustChangePassword(true);
    userRepository.save(user);

    // Verify login reports mustChangePassword: true
    mockMvc
        .perform(
            post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of("email", email, "password", "oldPass123!"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mustChangePassword").value(true));

    ChangePasswordRequest req =
        ChangePasswordRequest.builder()
            .currentPassword("oldPass123!")
            .newPassword("newPass456!")
            .build();

    mockMvc
        .perform(
            post("/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isNoContent());

    // Verify login with new password succeeds and mustChangePassword is now false
    mockMvc
        .perform(
            post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of("email", email, "password", "newPass456!"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mustChangePassword").value(false));
  }

  @Test
  @org.springframework.security.test.context.support.WithMockUser(
      username = "wrongcurrent@test.com")
  public void whenChangePasswordWrongCurrent_thenBadRequest() throws Exception {
    String email = "wrongcurrent@test.com";
    registerPatient("Ana", "Lopez", email, "oldPass123!", 90055002);

    ChangePasswordRequest req =
        ChangePasswordRequest.builder()
            .currentPassword("incorrectPassword")
            .newPassword("newPass456!")
            .build();

    mockMvc
        .perform(
            post("/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isBadRequest());
  }

  @Test
  @org.springframework.security.test.context.support.WithMockUser(username = "samepw@test.com")
  public void whenChangePasswordSamePassword_thenBadRequest() throws Exception {
    String email = "samepw@test.com";
    registerPatient("Pedro", "Sosa", email, "oldPass123!", 90055003);

    ChangePasswordRequest req =
        ChangePasswordRequest.builder()
            .currentPassword("oldPass123!")
            .newPassword("oldPass123!")
            .build();

    mockMvc
        .perform(
            post("/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isBadRequest());
  }

  private void registerPatient(
      String firstName, String lastName, String email, String password, Integer cardIdentity)
      throws Exception {
    mockMvc
        .perform(
            post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        patientRegistrationBody(
                            firstName, lastName, email, password, cardIdentity))))
        .andExpect(status().isOk());
  }

  private Map<String, Object> patientRegistrationBody(
      String firstName, String lastName, String email, String password, Integer cardIdentity) {
    Map<String, Object> body = new HashMap<>();
    body.put("firstName", firstName);
    body.put("lastName", lastName);
    body.put("email", email);
    body.put("password", password);
    body.put("cardIdentity", cardIdentity);
    return body;
  }
}
