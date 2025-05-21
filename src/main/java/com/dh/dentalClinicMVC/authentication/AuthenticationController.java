package com.dh.dentalClinicMVC.authentication;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    // Maneja la solicitud de registro de un nuevo usuario
    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) {
        // Llama al servicio de autenticación para registrar al usuario y devuelve la respuesta con el token generado
        return ResponseEntity.ok(authenticationService.register(request));
    }

    // Maneja la solicitud de inicio de sesión de un usuario existente
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody AuthenticationRequest request) {
        // Llama al servicio de autenticación para autenticar al usuario y devuelve la respuesta con el token generado
        return ResponseEntity.ok(authenticationService.login(request));
    }
}