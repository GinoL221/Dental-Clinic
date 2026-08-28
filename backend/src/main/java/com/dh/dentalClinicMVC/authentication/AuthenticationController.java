package com.dh.dentalClinicMVC.authentication;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthenticationController {
  private final AuthenticationService authenticationService;

  // Maneja la solicitud de registro de un nuevo usuario
  @PostMapping("/register")
  public ResponseEntity<AuthenticationResponse> register(
      @Valid @RequestBody RegisterRequest request) {
    return ResponseEntity.ok(authenticationService.register(request));
  }

  // Maneja la solicitud de inicio de sesión de un usuario existente
  @PostMapping("/login")
  public ResponseEntity<AuthenticationResponse> login(
      @Valid @RequestBody AuthenticationRequest request) {
    return ResponseEntity.ok(authenticationService.login(request));
  }

  // Verifica si el email ya está registrado
  @GetMapping("/check-email")
  public ResponseEntity<Boolean> checkEmailExists(@RequestParam String email) {
    return ResponseEntity.ok(authenticationService.emailExists(email));
  }

  @GetMapping("/me")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<SessionProfileResponse> me(Authentication authentication) {
    return ResponseEntity.ok(authenticationService.getSessionProfile(authentication.getName()));
  }
}
