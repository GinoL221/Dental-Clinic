package com.dh.dentalClinicMVC.authentication;

import com.dh.dentalClinicMVC.configuration.JwtService;
import com.dh.dentalClinicMVC.entity.*;
import com.dh.dentalClinicMVC.exception.InvalidPrincipalRoleException;
import com.dh.dentalClinicMVC.exception.StalePrincipalException;
import com.dh.dentalClinicMVC.repository.IAddressRepository;
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
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

  private final IUserRepository userRepository;
  private final IPatientRepository patientRepository;
  private final IAddressRepository addressRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final AuthenticationManager authenticationManager;

  private static final Pattern BCRYPT_PATTERN = Pattern.compile("^\\$2[aby]\\$.*");
  private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);

  // Registra un nuevo usuario en el sistema
  @Transactional
  public AuthenticationResponse register(RegisterRequest request) {
    // Verificar si el email ya existe
    if (userRepository.findByEmail(request.getEmail()).isPresent()) {
      throw new IllegalArgumentException("El email ya está registrado");
    }

    // El registro público solo permite crear cuentas PATIENT; un rol ausente
    // se asume PATIENT (compatibilidad con clientes que no envían el campo).
    Role requested = request.getRole() == null ? Role.PATIENT : request.getRole();
    if (requested != Role.PATIENT) {
      log.warn(
          "Public registration rejected requested role={} for email {}",
          requested,
          request.getEmail());
      throw new IllegalArgumentException(
          "El registro público solo permite crear cuentas de pacientes");
    }

    if (isBlank(request.getPassword())) {
      throw new IllegalArgumentException("La contraseña es requerida");
    }

    User savedUser = createPatient(request);

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
    patient.setPassword(ensureEncoded(request.getPassword()));
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

  public boolean emailExists(String email) {
    return userRepository.findByEmail(email).isPresent();
  }

  public SessionProfileResponse getSessionProfile(String email) {
    User user = userRepository.findByEmail(email).orElseThrow(StalePrincipalException::new);
    return new SessionProfileResponse(
        user.getId(),
        user.getFirstName(),
        user.getLastName(),
        user.getEmail(),
        user.getRole().name());
  }

  // Login de usuario existente
  public AuthenticationResponse login(AuthenticationRequest request) {
    // Guarda de integridad de datos. DEBE correr ANTES de authenticate(): un
    // authenticate() exitoso construye la Authentication a partir de
    // UserDetails.getAuthorities(), que desreferencia role.name() y haría NPE (500
    // crudo) antes de cualquier guarda posterior. Ver design.md, Claim B.
    // Una fila ausente NO se rechaza acá: cae al flujo normal de credenciales.
    userRepository
        .findByEmail(request.getEmail())
        .ifPresent(
            candidate -> {
              if (candidate.getRole() == null) {
                log.error("Login rejected: users row for {} has a null role", request.getEmail());
                throw new InvalidPrincipalRoleException();
              }
            });

    // Auténtica al usuario utilizando el email y la contraseña proporcionados
    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

    // Busca al usuario en la base de datos por su email. En circunstancias normales esto
    // siempre encuentra la fila: authenticationManager.authenticate() ya validó que el
    // usuario existe y la contraseña es correcta unas líneas antes. Si no aparece acá, es
    // una condición de carrera genuina (la fila se borró entre el authenticate() y este
    // re-fetch), no un error del cliente — se deja como 500 (vía el handler genérico) pero
    // con un mensaje de log accionable en vez de la NoSuchElementException muda de antes.
    var user =
        userRepository
            .findByEmail(request.getEmail())
            .orElseThrow(
                () -> {
                  log.error(
                      "Race condition on login: user row for {} vanished between"
                          + " authenticationManager.authenticate() and the immediate"
                          + " findByEmail() re-fetch",
                      request.getEmail());
                  return new IllegalStateException(
                      "User row disappeared between authentication and lookup for email: "
                          + request.getEmail());
                });

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

  private boolean isBlank(String s) {
    return s == null || s.isBlank();
  }

  private String ensureEncoded(String passwordOrEncoded) {
    if (passwordOrEncoded == null) return null;
    if (BCRYPT_PATTERN.matcher(passwordOrEncoded).matches()) return passwordOrEncoded;
    return passwordEncoder.encode(passwordOrEncoded);
  }
}
