package com.dh.dentalClinicMVC.authentication;

import com.dh.dentalClinicMVC.configuration.JwtService;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.entity.User;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final IUserRepository userRepository;
    private final IPatientRepository patientRepository;
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
                .role(request.getRole() != null ? request.getRole() : Role.PATIENT)
                .build();

        // Guarda el usuario en la base de datos
        User savedUser = userRepository.save(user);

        // Si el rol es PATIENT, crear automáticamente el registro Patient
        if (savedUser.getRole() == Role.PATIENT) {
            Patient patient = new Patient();
            patient.setName(savedUser.getFirstName());
            patient.setLastName(savedUser.getLastName());
            patient.setEmail(savedUser.getEmail());
            patient.setCardIdentity(generateCardIdentity()); // Método para generar ID único
            patient.setAdmissionDate(java.time.LocalDate.now());
            patient.setUser(savedUser);
            
            patientRepository.save(patient);
        }

        // Genera un token JWT para el usuario registrado
        var jwt = jwtService.generateToken(savedUser);

        // Devuelve la respuesta con el token generado y los datos del usuario
        return AuthenticationResponse.builder()
                .token(jwt)
                .role(savedUser.getRole().name())
                .id(savedUser.getId())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .email(savedUser.getEmail())
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

        // Devuelve la respuesta con el token generado y los datos del usuario
        return AuthenticationResponse.builder()
                .token(jwt)
                .role(user.getRole().name())
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .build();
    }

    // Método auxiliar para generar un cardIdentity único
    private Integer generateCardIdentity() {
        // Genera un número aleatorio de 8 dígitos
        return (int) (Math.random() * 90000000) + 10000000;
    }
}