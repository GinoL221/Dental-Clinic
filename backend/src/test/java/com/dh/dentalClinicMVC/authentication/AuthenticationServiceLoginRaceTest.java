package com.dh.dentalClinicMVC.authentication;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.dh.dentalClinicMVC.configuration.JwtService;
import com.dh.dentalClinicMVC.repository.IAddressRepository;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

// Covers the login() race-condition path: authenticationManager.authenticate() already
// confirmed the user exists and the password is correct; if the immediate findByEmail()
// re-fetch then finds nothing (row deleted mid-flight), this is a genuine server-side data
// race, not a client error. Was a bare .orElseThrow() (NoSuchElementException -> opaque 500
// with no diagnostic log); now an explicit IllegalStateException with an actionable log
// message, still surfacing as 500 via GlobalExceptionHandler's generic handler (unchanged
// client-facing behavior, deliberately no info-disclosure).
class AuthenticationServiceLoginRaceTest {

  @Test
  void login_whenUserRowVanishesAfterAuthenticate_thenThrowsIllegalStateException() {
    IUserRepository userRepository = mock(IUserRepository.class);
    AuthenticationManager authenticationManager = mock(AuthenticationManager.class);

    when(authenticationManager.authenticate(any())).thenReturn(mock(Authentication.class));
    when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

    AuthenticationService service =
        new AuthenticationService(
            userRepository,
            mock(IPatientRepository.class),
            mock(IDentistRepository.class),
            mock(IAddressRepository.class),
            mock(PasswordEncoder.class),
            mock(JwtService.class),
            authenticationManager);

    AuthenticationRequest request =
        AuthenticationRequest.builder().email("ghost@test.com").password("irrelevant").build();

    IllegalStateException ex =
        assertThrows(IllegalStateException.class, () -> service.login(request));
    assertTrue(ex.getMessage().contains("ghost@test.com"));
  }
}
