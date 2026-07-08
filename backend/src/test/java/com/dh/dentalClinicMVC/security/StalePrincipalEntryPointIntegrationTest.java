package com.dh.dentalClinicMVC.security;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dh.dentalClinicMVC.authentication.AuthenticationRequest;
import com.dh.dentalClinicMVC.configuration.JwtService;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

// Phase 4 (authz-cleanup-round-2, R3 wiring): end-to-end coverage of the custom
// StalePrincipalEntryPoint wired into SecurityConfiguration, on top of the real
// JwtAuthenticationFilter and full security filter chain. See design.md Decision 3 and
// specs/stale-principal-resolution/spec.md ("Authentication Filter Fails Open..." and
// "...Preserves Existing Invalid-Token Mechanism").
//
// GET /patients (findAll) is used as the generic protected route: it requires
// authentication at the HTTP layer (anyRequest().authenticated()) via the security filter
// chain BEFORE @PreAuthorize("hasAnyRole('ADMIN','DENTIST')") ever runs at the method-AOP
// layer, so an unauthenticated/invalid-token request never reaches the controller.
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Rollback
class StalePrincipalEntryPointIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private JwtService jwtService;
  @Autowired private IPatientRepository patientRepository;
  @Autowired private PasswordEncoder passwordEncoder;

  private static RequestPostProcessor authAs(String email, String role) {
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(
        new UsernamePasswordAuthenticationToken(
            email, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    return SecurityMockMvcRequestPostProcessors.securityContext(context);
  }

  // Real, signed JWT whose subject has no backing `users` row anywhere — the filter will
  // authenticate the token's signature/expiry fine, then loadUserByUsername() throws
  // UsernameNotFoundException.
  private String tokenForDeadPrincipal(String email) {
    UserDetails deadPrincipal =
        User.withUsername(email).password("irrelevant").authorities("ROLE_PATIENT").build();
    return jwtService.generateToken(deadPrincipal);
  }

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

  // --- Requirement: Authentication Filter Fails Open and a Custom Entry Point Yields 401 ---

  @Test
  void deadUsersRowJwtOnProtectedRouteReturns401ViaEntryPoint() throws Exception {
    String token = tokenForDeadPrincipal("ghost-patient@dentalclinic.com");

    mockMvc
        .perform(get("/patients").header("Authorization", "Bearer " + token))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("No autenticado"))
        .andExpect(jsonPath("$.status").value(401));
  }

  // LOCKOUT GUARD: a stale/dead JWT alongside a DIFFERENT, real seeded user's valid
  // credentials must not block POST /auth/login. Only a 200 unambiguously proves the
  // request reached and was processed by the login handler: /auth/login is permitAll (the
  // entry point can never fire there), and a wrong-password attempt also yields 401 via
  // AuthenticationService.login()'s BadCredentialsException for an unrelated reason.
  @Test
  void staleAuthTokenHeaderOnLoginRecoveryPathIsNotBlocked_realSeededUserLogsInSuccessfully()
      throws Exception {
    String rawPassword = "RecoveryPass123!";
    seedLoginablePatient("recovering-user@dentalclinic.com", rawPassword, 90001);

    // Distinct identity: a dead/stale JWT for an email that was never seeded.
    String staleToken = tokenForDeadPrincipal("deleted-account@dentalclinic.com");

    AuthenticationRequest loginBody =
        AuthenticationRequest.builder()
            .email("recovering-user@dentalclinic.com")
            .password(rawPassword)
            .build();

    mockMvc
        .perform(
            post("/auth/login")
                .with(csrf())
                .header("Authorization", "Bearer " + staleToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginBody)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("recovering-user@dentalclinic.com"));
  }

  @Test
  void staleAuthTokenCookieOnLoginRecoveryPathIsNotBlocked_realSeededUserLogsInSuccessfully()
      throws Exception {
    String rawPassword = "RecoveryPass456!";
    seedLoginablePatient("recovering-user-cookie@dentalclinic.com", rawPassword, 90002);

    String staleToken = tokenForDeadPrincipal("deleted-account-cookie@dentalclinic.com");

    AuthenticationRequest loginBody =
        AuthenticationRequest.builder()
            .email("recovering-user-cookie@dentalclinic.com")
            .password(rawPassword)
            .build();

    mockMvc
        .perform(
            post("/auth/login")
                .with(csrf())
                .cookie(new Cookie("authToken", staleToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginBody)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("recovering-user-cookie@dentalclinic.com"));
  }

  // --- Requirement: Authentication Filter Preserves Existing Invalid-Token Mechanism ---

  @Test
  void unauthenticatedAccessToProtectedRouteNowReturns401NotFormerly403() throws Exception {
    mockMvc
        .perform(get("/patients"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("No autenticado"));
  }

  @Test
  void malformedTokenOnProtectedRouteReturns401ViaEntryPoint() throws Exception {
    mockMvc
        .perform(get("/patients").header("Authorization", "Bearer not-a-real-jwt"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("No autenticado"));
  }

  @Test
  void authenticatedButWrongRoleStillReturns403ViaAccessDeniedHandlerUnchanged() throws Exception {
    // PATIENT lacks the ADMIN/DENTIST role required by @PreAuthorize on findAll(): this is
    // an authenticated-but-forbidden denial, must stay 403 via the default
    // accessDeniedHandler (untouched by this change), NOT the new entry point.
    mockMvc
        .perform(get("/patients").with(authAs("some-patient@dentalclinic.com", "PATIENT")))
        .andExpect(status().isForbidden());
  }
}
