package com.dh.dentalClinicMVC.authentication;

import com.dh.dentalClinicMVC.configuration.JwtService;
import com.dh.dentalClinicMVC.entity.*;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.repository.IAddressRepository;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final IUserRepository userRepository;
    private final IPatientRepository patientRepository;
    private final IDentistRepository dentistRepository;
    private final IAddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    // Registra un nuevo usuario en el sistema
    public AuthenticationResponse register(RegisterRequest request) {
        // Verificar si el email ya existe
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("El email ya está registrado");
        }

        User savedUser;

        switch (request.getRole()) {
            case ADMIN:
                savedUser = createAdmin(request);
                break;
            case PATIENT:
                savedUser = createPatient(request);
                break;
            case DENTIST:
                savedUser = createDentist(request);
                break;
            default:
                throw new IllegalArgumentException("Rol no válido: " + request.getRole());
        }

        // Generar token JWT
        var jwtToken = jwtService.generateToken(savedUser);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .role(savedUser.getRole().name())
                .id(savedUser.getId())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .email(savedUser.getEmail())
                .build();
    }

    private User createAdmin(RegisterRequest request) {
        // Para ADMIN, crear solo User base (sin Patient ni Dentist)
        User admin = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ADMIN)
                .build();

        return userRepository.save(admin);
    }

    private User createPatient(RegisterRequest request) {
        // Validar que se proporcione DNI para pacientes
        if (request.getCardIdentity() == null) {
            throw new IllegalArgumentException("DNI es requerido para pacientes");
        }

        Patient patient = new Patient();

        // Setear campos heredados de User
        patient.setFirstName(request.getFirstName());
        patient.setLastName(request.getLastName());
        patient.setEmail(request.getEmail());
        patient.setPassword(passwordEncoder.encode(request.getPassword()));
        patient.setRole(Role.PATIENT);

        // Setear campos específicos de Patient
        patient.setCardIdentity(request.getCardIdentity());
        patient.setAdmissionDate(request.getAdmissionDate() != null ?
                request.getAdmissionDate() : LocalDate.now());

        // Manejar dirección si existe
        if (request.getAddress() != null) {
            Address address = Address.builder()
                    .street(request.getAddress().getStreet())
                    .number(request.getAddress().getNumber())
                    .location(request.getAddress().getLocation())
                    .province(request.getAddress().getProvince())
                    .build();

            Address savedAddress = addressRepository.save(address);
            patient.setAddress(savedAddress);
        }

        return patientRepository.save(patient);
    }

    private User createDentist(RegisterRequest request) {
        // Validar que se proporcione matrícula para dentistas
        if (request.getRegistrationNumber() == null) {
            throw new IllegalArgumentException("Número de matrícula es requerido para dentistas");
        }

        Dentist dentist = new Dentist();

        // Setear campos heredados de User
        dentist.setFirstName(request.getFirstName());
        dentist.setLastName(request.getLastName());
        dentist.setEmail(request.getEmail());
        dentist.setPassword(passwordEncoder.encode(request.getPassword()));
        dentist.setRole(Role.DENTIST);

        // Setear campo específico de Dentist
        dentist.setRegistrationNumber(request.getRegistrationNumber());

        return dentistRepository.save(dentist);
    }

    // Login de usuario existente
    public AuthenticationResponse login(AuthenticationRequest request) {
        // Auténtica al usuario utilizando el email y la contraseña proporcionados
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()));

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
}