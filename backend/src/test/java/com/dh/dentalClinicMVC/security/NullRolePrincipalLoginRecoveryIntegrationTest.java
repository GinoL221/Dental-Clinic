package com.dh.dentalClinicMVC.security;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.authentication.AuthenticationRequest;
import com.dh.dentalClinicMVC.configuration.JwtService;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.entity.User;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

// sdd-verify remediation (appointment-role-null-hardening, R1 scenario "Null-role credential on
// the login recovery path is NOT blocked"). Sibling to StalePrincipalEntryPointIntegrationTest
// but for a DIFFERENT failure class: a `users` row that EXISTS but has role == null, not a
// missing row (see specs/principal-role-integrity/spec.md's explicit distinction from
// stale-principal-resolution, and design.md A6).
//
// Persisting a null-role `users` row is now structurally impossible under H2 create-drop
// (User.role carries @Column(nullable = false) as of this same change's Phase 6), so this test
// never calls patientRepository.save(...) for the null-role identity. Instead it overrides the
// UserDetailsService bean with a Mockito stub that returns an in-memory, never-persisted `User`
// with role == null for the stale credential's JWT/cookie subject — the exact same
// Mockito-stubbed-User technique JwtAuthenticationFilterTest already uses at the unit level,
// wired here through the full MockMvc + real security filter chain instead. The login body's
// identity is a REAL seeded Patient row (patientRepository.save), because
// AuthenticationService.login() reads/re-fetches it via the real IUserRepository, independent of
// the stubbed UserDetailsService bean.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class NullRolePrincipalLoginRecoveryIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private JwtService jwtService;
  @Autowired private IPatientRepository patientRepository;
  @Autowired private PasswordEncoder passwordEncoder;

  @MockBean private UserDetailsService userDetailsService;

  private Patient seedLoginablePatient(String email, String rawPassword, int cardIdentity) {
    Patient patient = new Patient();
    patient.setEmail(email);
    patient.setFirstName("Recovering");
    patient.setLastName("User");
    patient.setPassword(passwordEncoder.encode(rawPassword));
    patient.setRole(Role.PATIENT);
    patient.setCardIdentity(cardIdentity);
    patient.setAdmissionDate(LocalDate.now());
    return patientRepository.save(patient);
  }

  // Never persisted — exists only as the stubbed UserDetailsService's answer for the null-role
  // credential's subject email. Matches exactly the `instanceof User user && user.getRole() ==
  // null` shape JwtAuthenticationFilter checks for (User.java's base entity type, role left
  // null).
  private User nullRolePrincipal(String email) {
    return User.builder().email(email).password("irrelevant").role(null).build();
  }

  // LOCKOUT GUARD: a null-role credential alongside a DIFFERENT, real seeded user's valid
  // credentials must not block POST /auth/login. Only a 200 unambiguously proves the request
  // reached and was processed by the login handler: /auth/login is permitAll (the filter's
  // InvalidPrincipalRoleException catch never writes a response there), and a wrong-password
  // attempt also yields 401 via AuthenticationService.login()'s BadCredentialsException for an
  // unrelated reason.
  @Test
  void nullRoleTokenHeaderOnLoginRecoveryPathIsNotBlocked_realSeededUserLogsInSuccessfully()
      throws Exception {
    String rawPassword = "RecoveryPass789!";
    Patient seededPatient =
        seedLoginablePatient("null-role-recovery-header@dentalclinic.com", rawPassword, 90003);

    // Distinct identity: a null-role principal for an email that is never persisted.
    String nullRoleEmail = "null-role-subject-header@dentalclinic.com";
    User nullRoleUser = nullRolePrincipal(nullRoleEmail);
    when(userDetailsService.loadUserByUsername(nullRoleEmail)).thenReturn(nullRoleUser);
    when(userDetailsService.loadUserByUsername(seededPatient.getEmail())).thenReturn(seededPatient);
    String nullRoleToken = jwtService.generateToken(nullRoleUser);

    AuthenticationRequest loginBody =
        AuthenticationRequest.builder()
            .email(seededPatient.getEmail())
            .password(rawPassword)
            .build();

    mockMvc
        .perform(
            post("/auth/login")
                .with(csrf())
                .header("Authorization", "Bearer " + nullRoleToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginBody)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value(seededPatient.getEmail()));
  }

  @Test
  void nullRoleTokenCookieOnLoginRecoveryPathIsNotBlocked_realSeededUserLogsInSuccessfully()
      throws Exception {
    String rawPassword = "RecoveryPass012!";
    Patient seededPatient =
        seedLoginablePatient("null-role-recovery-cookie@dentalclinic.com", rawPassword, 90004);

    String nullRoleEmail = "null-role-subject-cookie@dentalclinic.com";
    User nullRoleUser = nullRolePrincipal(nullRoleEmail);
    when(userDetailsService.loadUserByUsername(nullRoleEmail)).thenReturn(nullRoleUser);
    when(userDetailsService.loadUserByUsername(seededPatient.getEmail())).thenReturn(seededPatient);
    String nullRoleToken = jwtService.generateToken(nullRoleUser);

    AuthenticationRequest loginBody =
        AuthenticationRequest.builder()
            .email(seededPatient.getEmail())
            .password(rawPassword)
            .build();

    mockMvc
        .perform(
            post("/auth/login")
                .with(csrf())
                .cookie(new Cookie("authToken", nullRoleToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginBody)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value(seededPatient.getEmail()));
  }
}
