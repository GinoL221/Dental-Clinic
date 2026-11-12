package com.dh.dentalClinicMVC.authentication;

import com.dh.dentalClinicMVC.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@Tag(name = "Autenticación", description = "Registro, inicio de sesión y sesión del usuario")
@RequiredArgsConstructor
public class AuthenticationController {
  private final AuthenticationService authenticationService;

  // Maneja la solicitud de registro de un nuevo usuario
  @Operation(summary = "Registra una nueva cuenta de paciente")
  @ApiResponse(
      responseCode = "409",
      description = "El email ya está registrado",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @PostMapping("/register")
  public ResponseEntity<AuthenticationResponse> register(
      @Valid @RequestBody RegisterRequest request) {
    return ResponseEntity.ok(authenticationService.register(request));
  }

  // Maneja la solicitud de inicio de sesión de un usuario existente
  @Operation(summary = "Inicia sesión y devuelve el token JWT")
  @PostMapping("/login")
  public ResponseEntity<AuthenticationResponse> login(
      @Valid @RequestBody AuthenticationRequest request) {
    return ResponseEntity.ok(authenticationService.login(request));
  }

  // Verifica si el email ya está registrado
  @Operation(summary = "Verifica si un email ya está registrado")
  @GetMapping("/check-email")
  public ResponseEntity<Boolean> checkEmailExists(@RequestParam String email) {
    return ResponseEntity.ok(authenticationService.emailExists(email));
  }

  @Operation(summary = "Devuelve el perfil de la sesión autenticada")
  @GetMapping("/me")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<SessionProfileResponse> me(Authentication authentication) {
    return ResponseEntity.ok(authenticationService.getSessionProfile(authentication.getName()));
  }

  @Operation(summary = "Cambia la contraseña del usuario autenticado")
  @PostMapping("/change-password")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> changePassword(
      @Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
    String username =
        authentication != null
            ? authentication.getName()
            : (org.springframework.security.core.context.SecurityContextHolder.getContext()
                        .getAuthentication()
                    != null
                ? org.springframework.security.core.context.SecurityContextHolder.getContext()
                    .getAuthentication()
                    .getName()
                : null);
    if (username == null) {
      throw new com.dh.dentalClinicMVC.exception.StalePrincipalException();
    }
    authenticationService.changePassword(username, request);
    return ResponseEntity.noContent().build();
  }
}
