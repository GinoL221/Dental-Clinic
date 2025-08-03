package com.dh.dentalClinicMVC.authentication;

import com.dh.dentalClinicMVC.configuration.JwtService;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.entity.User;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final IUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    // Registra un nuevo usuario en el sistema
    public AuthenticationResponse register(RegisterRequest request) {
        // Crea un nuevo usuario con los datos proporcionados en la solicitud
        var user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword())) // Codifica la contraseña
                .role(request.getRole() != null ? request.getRole() : Role.USER)
                .build();

        // Guarda el usuario en la base de datos
        userRepository.save(user);

        // Genera un token JWT para el usuario registrado
        var jwt = jwtService.generateToken(user);

        // Devuelve la respuesta con el token generado
        return AuthenticationResponse.builder()
                .token(jwt)
                .role(user.getRole().name())
                .build();
    }

    // Autentica a un usuario existente
    public AuthenticationResponse login(AuthenticationRequest request) {
        // Auténtica al usuario utilizando el email y la contraseña proporcionados
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // Busca al usuario en la base de datos por su email
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(); // Lanza una excepción si no se encuentra

        // Genera un token JWT para el usuario autenticado
        var jwt = jwtService.generateToken(user);

        // Devuelve la respuesta con el token generado
        return AuthenticationResponse.builder()
                .token(jwt)
                .role(user.getRole().name())
                .build();
    }
}