package com.dh.dentalClinicMVC.authentication;

import static org.junit.jupiter.api.Assertions.assertThrows;

import com.dh.dentalClinicMVC.exception.InvalidPrincipalRoleException;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

// appointment-role-null-hardening, Phase 2: CHARACTERIZATION test, exempt from RED (design.md
// Implementation Order step 2). Settles design.md Claim A empirically against the real
// spring-security-core 6.2.1 jar: does DaoAuthenticationProvider.authenticate() wrap a foreign
// RuntimeException thrown from UserDetailsService.loadUserByUsername() into an
// AuthenticationServiceException? This test PINS the observed behavior; the design does NOT
// depend on the answer (A1 stands on Claim B alone) — see design.md Open Questions.
class DaoAuthenticationProviderWrappingCharacterizationTest {

  @Test
  void wrapsForeignExceptionFromUserDetailsServiceIntoInternalAuthenticationServiceException() {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(
        username -> {
          throw new InvalidPrincipalRoleException();
        });
    provider.setPasswordEncoder(new BCryptPasswordEncoder());

    UsernamePasswordAuthenticationToken token =
        new UsernamePasswordAuthenticationToken("someone@dentalclinic.com", "irrelevant");

    assertThrows(AuthenticationServiceException.class, () -> provider.authenticate(token));
  }
}
