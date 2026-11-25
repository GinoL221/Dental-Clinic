package com.dh.dentalClinicMVC.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.configuration.JwtService;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

// T5 (auth-security-hardening S1 + S7): self-PUT password must be an explicit 400
// ("Password changes must go through /auth/change-password") persisting nothing,
// and the ADMIN update path must bump tokenVersion only when the resolved hash
// actually differs from the stored one (re-sending the same password must not
// revoke live JWTs).
//
// Full security filter chain (not addFilters=false) + real persistence + real
// JWTs (JwtService.generateToken exercised on GET /auth/me), same style as
// PatientControllerAuthzTest and JwtRevocationLifecycleTest.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class SelfUpdatePasswordPolicyTest {

  private static final String PASSWORD_400_MESSAGE =
      "Password changes must go through /auth/change-password";

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private IPatientRepository patientRepository;
  @Autowired private IDentistRepository dentistRepository;
  @Autowired private PasswordEncoder passwordEncoder;
  @Autowired private JwtService jwtService;

  private Patient seedPatient(String email, String rawPassword, int cardIdentity) {
    Patient patient = new Patient();
    patient.setFirstName("Original");
    patient.setLastName("Self");
    patient.setEmail(email);
    patient.setPassword(passwordEncoder.encode(rawPassword));
    patient.setRole(Role.PATIENT);
    patient.setCardIdentity(cardIdentity);
    patient.setAdmissionDate(LocalDate.now());
    return patientRepository.save(patient);
  }

  private Dentist seedDentist(String email, String rawPassword, int registrationNumber) {
    Dentist dentist = new Dentist();
    dentist.setFirstName("Original");
    dentist.setLastName("Self");
    dentist.setEmail(email);
    dentist.setPassword(passwordEncoder.encode(rawPassword));
    dentist.setRole(Role.DENTIST);
    dentist.setRegistrationNumber(registrationNumber);
    return dentistRepository.save(dentist);
  }

  private static RequestPostProcessor authAs(String email, String role) {
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(
        com.dh.dentalClinicMVC.support.AppUserAuthentication.of(email, Role.valueOf(role)));
    return SecurityMockMvcRequestPostProcessors.securityContext(context);
  }

  private Map<String, Object> patientBody(String firstName, String email, int cardIdentity) {
    Map<String, Object> body = new HashMap<>();
    body.put("firstName", firstName);
    body.put("lastName", "Self");
    body.put("email", email);
    body.put("cardIdentity", cardIdentity);
    body.put("admissionDate", LocalDate.now().toString());
    return body;
  }

  private Map<String, Object> dentistBody(String firstName, String email, int registrationNumber) {
    Map<String, Object> body = new HashMap<>();
    body.put("firstName", firstName);
    body.put("lastName", "Self");
    body.put("email", email);
    body.put("registrationNumber", registrationNumber);
    return body;
  }

  // S1 case 1: patient self-PUT with password -> 400, stored record untouched, live JWT survives.
  @Test
  public void patientSelfPutWithPassword_then400NothingPersistedAndJwtSurvives() throws Exception {
    String email = "self-pw-patient-400@test.com";
    Patient own = seedPatient(email, "CurrentPass123!", 93001001);
    String originalHash = own.getPassword();
    int originalTokenVersion = own.getTokenVersion();
    String jwt = jwtService.generateToken(own);

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + jwt))
        .andExpect(status().isOk());

    Map<String, Object> body = patientBody("Changed", email, 93001001);
    body.put("password", "NewPass123!");

    mockMvc
        .perform(
            put("/patients/{id}", own.getId())
                .with(csrf())
                .with(authAs(email, "PATIENT"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.message").value(PASSWORD_400_MESSAGE));

    Patient reloaded = patientRepository.findById(own.getId()).orElseThrow();
    assertEquals("Original", reloaded.getFirstName(), "Nothing of the record may change");
    assertEquals(originalHash, reloaded.getPassword(), "Stored hash must be untouched");
    assertEquals(
        originalTokenVersion, reloaded.getTokenVersion(), "tokenVersion must be untouched");

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + jwt))
        .andExpect(status().isOk());
  }

  // S1 case 2: dentist self-PUT with password -> same rejection contract.
  @Test
  public void dentistSelfPutWithPassword_then400NothingPersistedAndJwtSurvives() throws Exception {
    String email = "self-pw-dentist-400@test.com";
    Dentist own = seedDentist(email, "CurrentPass123!", 93001002);
    String originalHash = own.getPassword();
    int originalTokenVersion = own.getTokenVersion();
    String jwt = jwtService.generateToken(own);

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + jwt))
        .andExpect(status().isOk());

    Map<String, Object> body = dentistBody("Changed", email, 93001002);
    body.put("password", "NewPass123!");

    mockMvc
        .perform(
            put("/dentists/{id}", own.getId())
                .with(csrf())
                .with(authAs(email, "DENTIST"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.message").value(PASSWORD_400_MESSAGE));

    Dentist reloaded = dentistRepository.findById(own.getId()).orElseThrow();
    assertEquals("Original", reloaded.getFirstName(), "Nothing of the record may change");
    assertEquals(originalHash, reloaded.getPassword(), "Stored hash must be untouched");
    assertEquals(
        originalTokenVersion, reloaded.getTokenVersion(), "tokenVersion must be untouched");

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + jwt))
        .andExpect(status().isOk());
  }

  // S1 regression guard: self-PUT without a password field keeps working exactly as today.
  @Test
  public void patientSelfPutWithoutPasswordField_thenStillUpdatesAndKeepsJwtValid()
      throws Exception {
    String email = "self-nopw-patient@test.com";
    Patient own = seedPatient(email, "CurrentPass123!", 93001003);
    int originalTokenVersion = own.getTokenVersion();
    String jwt = jwtService.generateToken(own);

    Map<String, Object> body = patientBody("Updated", email, 93001003);

    mockMvc
        .perform(
            put("/patients/{id}", own.getId())
                .with(csrf())
                .with(authAs(email, "PATIENT"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk());

    Patient reloaded = patientRepository.findById(own.getId()).orElseThrow();
    assertEquals("Updated", reloaded.getFirstName());
    assertEquals(originalTokenVersion, reloaded.getTokenVersion());

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + jwt))
        .andExpect(status().isOk());
  }

  // S1 regression guard: self-PUT with a blank password keeps working exactly as today.
  @Test
  public void patientSelfPutWithBlankPassword_thenStillUpdates() throws Exception {
    String email = "self-blank-pw-patient@test.com";
    Patient own = seedPatient(email, "CurrentPass123!", 93001004);
    String originalHash = own.getPassword();
    int originalTokenVersion = own.getTokenVersion();

    Map<String, Object> body = patientBody("Updated", email, 93001004);
    body.put("password", "");

    mockMvc
        .perform(
            put("/patients/{id}", own.getId())
                .with(csrf())
                .with(authAs(email, "PATIENT"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk());

    Patient reloaded = patientRepository.findById(own.getId()).orElseThrow();
    assertEquals("Updated", reloaded.getFirstName());
    assertEquals(originalHash, reloaded.getPassword(), "Blank password must not rotate the hash");
    assertEquals(originalTokenVersion, reloaded.getTokenVersion());
  }

  // S7: ADMIN PUT re-sending the same current password is a no-op: no tokenVersion bump.
  @Test
  public void adminPutResendingSameCustomerPassword_thenNoBumpAndJwtSurvives() throws Exception {
    String email = "admin-same-pw@test.com";
    Patient target = seedPatient(email, "SamePass123!", 93001005);
    String originalHash = target.getPassword();
    int originalTokenVersion = target.getTokenVersion();
    String patientJwt = jwtService.generateToken(target);

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + patientJwt))
        .andExpect(status().isOk());

    Map<String, Object> body = patientBody("Admin", email, 93001005);
    body.put("password", "SamePass123!");

    mockMvc
        .perform(
            put("/patients/{id}", target.getId())
                .with(csrf())
                .with(authAs("admin-same-pw@test.com", "ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk());

    Patient reloaded = patientRepository.findById(target.getId()).orElseThrow();
    assertEquals("Admin", reloaded.getFirstName());
    assertEquals(originalHash, reloaded.getPassword(), "Same password must keep the stored hash");
    assertEquals(
        originalTokenVersion,
        reloaded.getTokenVersion(),
        "Unchanged hash must not bump tokenVersion");

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + patientJwt))
        .andExpect(status().isOk()); // re-sending same password must not revoke the live JWT
  }

  // S7, dentist twin: ADMIN re-sending a dentist's current password is a no-op.
  @Test
  public void adminPutResendingSameDentistPassword_thenNoBumpAndJwtSurvives() throws Exception {
    String email = "admin-same-pw-dentist@test.com";
    Dentist target = seedDentist(email, "SamePass123!", 93001006);
    String originalHash = target.getPassword();
    int originalTokenVersion = target.getTokenVersion();
    String dentistJwt = jwtService.generateToken(target);

    Map<String, Object> body = dentistBody("Admin", email, 93001006);
    body.put("password", "SamePass123!");

    mockMvc
        .perform(
            put("/dentists/{id}", target.getId())
                .with(csrf())
                .with(authAs("admin-same-pw-dentist-admin@test.com", "ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk());

    Dentist reloaded = dentistRepository.findById(target.getId()).orElseThrow();
    assertEquals("Admin", reloaded.getFirstName());
    assertEquals(originalHash, reloaded.getPassword(), "Same password must keep the stored hash");
    assertEquals(
        originalTokenVersion,
        reloaded.getTokenVersion(),
        "Unchanged hash must not bump tokenVersion");

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + dentistJwt))
        .andExpect(status().isOk());
  }

  // S7: ADMIN PUT carrying no password never rotates the hash nor bumps tokenVersion.
  @Test
  public void adminPutWithoutPassword_thenHashAndTokenVersionUnchangedAndJwtSurvives()
      throws Exception {
    String email = "admin-nopw-patient@test.com";
    Patient target = seedPatient(email, "SamePass123!", 93001006);
    String originalHash = target.getPassword();
    int originalTokenVersion = target.getTokenVersion();
    String patientJwt = jwtService.generateToken(target);

    Map<String, Object> body = patientBody("Admin", email, 93001006);

    mockMvc
        .perform(
            put("/patients/{id}", target.getId())
                .with(csrf())
                .with(authAs("admin-same-pw@test.com", "ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isOk());

    Patient reloaded = patientRepository.findById(target.getId()).orElseThrow();
    assertEquals("Admin", reloaded.getFirstName());
    assertEquals(originalHash, reloaded.getPassword());
    assertEquals(originalTokenVersion, reloaded.getTokenVersion());

    mockMvc
        .perform(get("/auth/me").header("Authorization", "Bearer " + patientJwt))
        .andExpect(status().isOk());
  }
}
