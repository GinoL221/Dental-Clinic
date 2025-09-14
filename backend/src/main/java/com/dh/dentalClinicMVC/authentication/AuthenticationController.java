package com.dh.dentalClinicMVC.authentication;

import com.dh.dentalClinicMVC.entity.User;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthenticationController {
    private final AuthenticationService authenticationService;
    private final IUserRepository userRepository;

    // Maneja la solicitud de registro de un nuevo usuario
    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authenticationService.register(request));
    }

    // Maneja la solicitud de inicio de sesión de un usuario existente
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody AuthenticationRequest request) {
        return ResponseEntity.ok(authenticationService.login(request));
    }

    // Endpoint temporal para actualizar firstName y lastName de usuario existente
    @PutMapping("/update-names/{email}")
    public ResponseEntity<String> updateUserNames(@PathVariable String email,
            @RequestParam String firstName,
            @RequestParam String lastName) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            user.setFirstName(firstName);
            user.setLastName(lastName);
            userRepository.save(user);
            return ResponseEntity.ok("Usuario actualizado correctamente");
        }
        return ResponseEntity.notFound().build();
    }

    // Verifica si el email ya está registrado
    @GetMapping("/check-email")
    public ResponseEntity<Boolean> checkEmailExists(@RequestParam String email) {
        boolean exists = userRepository.findByEmail(email).isPresent();
        return ResponseEntity.ok(exists);
    }
}