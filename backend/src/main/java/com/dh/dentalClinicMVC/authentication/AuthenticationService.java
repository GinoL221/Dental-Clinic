package com.dh.dentalClinicMVC.authentication;

import com.dh.dentalClinicMVC.configuration.JwtService;
import com.dh.dentalClinicMVC.entity.*;
import com.dh.dentalClinicMVC.repository.IAddressRepository;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.repository.IUserRepository;
import java.time.LocalDate;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

  private static final Pattern BCRYPT_PATTERN = Pattern.compile("^\\$2[aby]\\$.*");
  private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);

  // Registra un nuevo usuario en el sistema
  public AuthenticationResponse register(RegisterRequest request) {
    // Verificar si el email ya existe
    if (userRepository.findByEmail(request.getEmail()).isPresent()) {
      throw new IllegalArgumentException("El email ya está registrado");
    }

    // El registro público no admite crear cuentas ADMIN; un rol ausente
    // se asume PATIENT (compatibilidad con clientes que no envían el campo).
    Role requested = request.getRole() == null ? Role.PATIENT : request.getRole();
    if (requested == Role.ADMIN) {
      log.warn(
          "Privilege escalation attempt: public registration requested role=ADMIN for email {}",
          request.getEmail());
      throw new IllegalArgumentException(
          "El registro público no permite crear cuentas de administrador");
    }

    User savedUser;
    switch (requested) {
      case PATIENT:
        savedUser = createPatient(request);
        break;
      case DENTIST:
        savedUser = createDentist(request);
        break;
      default:
        throw new IllegalArgumentException("Rol no válido: " + requested);
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

  private User createPatient(RegisterRequest request) {
    // Validar que se proporcione DNI para pacientes y nombre/apellido
    if (isBlank(request.getFirstName())) {
      throw new IllegalArgumentException("El nombre es requerido");
    }
    if (isBlank(request.getLastName())) {
      throw new IllegalArgumentException("El apellido es requerido");
    }
    if (request.getCardIdentity() == null) {
      throw new IllegalArgumentException("DNI es requerido para pacientes");
    }

    Patient patient = new Patient();

    // Setear campos heredados de User
    patient.setFirstName(request.getFirstName());
    patient.setLastName(request.getLastName());
    patient.setEmail(request.getEmail());
    String raw = request.getPassword();
    if (isBlank(raw))
      raw =
          buildDefaultPassword(
              request.getFirstName(), request.getLastName(), request.getCardIdentity());
    patient.setPassword(ensureEncoded(raw));
    patient.setRole(Role.PATIENT);

    // Setear campos específicos de Patient
    patient.setCardIdentity(request.getCardIdentity());
    patient.setAdmissionDate(
        request.getAdmissionDate() != null ? request.getAdmissionDate() : LocalDate.now());

    // Manejar dirección si existe
    if (request.getAddress() != null) {
      Address address =
          Address.builder()
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
    // Validar que se proporcione matrícula para dentistas y nombre/apellido
    if (isBlank(request.getFirstName())) {
      throw new IllegalArgumentException("El nombre es requerido");
    }
    if (isBlank(request.getLastName())) {
      throw new IllegalArgumentException("El apellido es requerido");
    }
    if (request.getRegistrationNumber() == null) {
      throw new IllegalArgumentException("Número de matrícula es requerido para dentistas");
    }

    Dentist dentist = new Dentist();

    // Setear campos heredados de User
    dentist.setFirstName(request.getFirstName());
    dentist.setLastName(request.getLastName());
    dentist.setEmail(request.getEmail());
    String raw = request.getPassword();
    if (isBlank(raw))
      raw =
          buildDefaultPassword(
              request.getFirstName(), request.getLastName(), request.getRegistrationNumber());
    dentist.setPassword(ensureEncoded(raw));
    dentist.setRole(Role.DENTIST);

    // Setear campo específico de Dentist
    dentist.setRegistrationNumber(request.getRegistrationNumber());

    return dentistRepository.save(dentist);
  }

  public boolean emailExists(String email) {
    return userRepository.findByEmail(email).isPresent();
  }

  // Login de usuario existente
  public AuthenticationResponse login(AuthenticationRequest request) {
    // Auténtica al usuario utilizando el email y la contraseña proporcionados
    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

    // Busca al usuario en la base de datos por su email
    var user =
        userRepository
            .findByEmail(request.getEmail())
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

  private String buildDefaultPassword(String firstName, String lastName, Integer number) {
    String fn = firstName != null ? firstName.trim() : "";
    String ln = lastName != null ? lastName.trim() : "";
    String lastThree = "000";
    if (number != null) {
      int num = Math.abs(number % 1000);
      lastThree = String.format("%03d", num);
    }
    return fn + ln + lastThree;
  }

  private boolean isBlank(String s) {
    return s == null || s.trim().isEmpty();
  }

  private String ensureEncoded(String passwordOrEncoded) {
    if (passwordOrEncoded == null) return null;
    if (BCRYPT_PATTERN.matcher(passwordOrEncoded).matches()) return passwordOrEncoded;
    return passwordEncoder.encode(passwordOrEncoded);
  }
}
