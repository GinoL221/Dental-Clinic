package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.configuration.DemoModePolicy;
import com.dh.dentalClinicMVC.dto.PatientRequestDTO;
import com.dh.dentalClinicMVC.dto.PatientRequestMapper;
import com.dh.dentalClinicMVC.dto.PatientResponseDTO;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.exception.DuplicateResourceException;
import com.dh.dentalClinicMVC.exception.ResourceInUseException;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.service.IPatientService;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientServiceImpl implements IPatientService {

  private final IPatientRepository patientRepository;
  private final IAppointmentRepository appointmentRepository;
  private final UserPasswordPolicy passwordPolicy;
  private final DemoModePolicy demoModePolicy;

  public PatientServiceImpl(
      IPatientRepository patientRepository,
      IAppointmentRepository appointmentRepository,
      UserPasswordPolicy passwordPolicy) {
    this(patientRepository, appointmentRepository, passwordPolicy, DemoModePolicy.disabled());
  }

  @Autowired
  public PatientServiceImpl(
      IPatientRepository patientRepository,
      IAppointmentRepository appointmentRepository,
      UserPasswordPolicy passwordPolicy,
      DemoModePolicy demoModePolicy) {
    this.patientRepository = patientRepository;
    this.appointmentRepository = appointmentRepository;
    this.passwordPolicy = passwordPolicy;
    this.demoModePolicy = demoModePolicy;
  }

  @Override
  @Transactional
  @CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)
  public Patient save(Patient patient) {
    if (isBlank(patient.getFirstName())) {
      throw new IllegalArgumentException("El nombre es requerido");
    }
    if (isBlank(patient.getLastName())) {
      throw new IllegalArgumentException("El apellido es requerido");
    }
    if (patient.getCardIdentity() == null) {
      throw new IllegalArgumentException("DNI (cardIdentity) es requerido");
    }
    if (patient.getAdmissionDate() == null) {
      throw new IllegalArgumentException("La fecha de ingreso es requerida");
    }
    if (patient.getEmail() != null && existsByEmail(patient.getEmail())) {
      throw new DuplicateResourceException("El email ya está registrado");
    }
    if (existsByCardIdentity(patient.getCardIdentity())) {
      throw new DuplicateResourceException("El DNI ya está registrado");
    }

    UserPasswordPolicy.PasswordResolution pwRes =
        passwordPolicy.resolveForCreate(
            patient.getPassword(),
            patient.getFirstName(),
            patient.getLastName(),
            patient.getCardIdentity());
    patient.setPassword(pwRes.encodedPassword());
    patient.setMustChangePassword(pwRes.mustChangePassword());
    patient.setTemporaryPassword(pwRes.rawPassword());

    // Asignar rol por defecto si no viene
    if (patient.getRole() == null) {
      patient.setRole(Role.PATIENT);
    }

    Patient saved = patientRepository.save(patient);
    saved.setTemporaryPassword(pwRes.rawPassword());
    return saved;
  }

  @Override
  @Transactional
  @CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)
  public PatientResponseDTO save(PatientRequestDTO requestDTO) {
    if (requestDTO.getEmail() != null && existsByEmail(requestDTO.getEmail())) {
      throw new DuplicateResourceException("El email ya está registrado");
    }
    if (requestDTO.getCardIdentity() != null
        && existsByCardIdentity(requestDTO.getCardIdentity())) {
      throw new DuplicateResourceException("El DNI ya está registrado");
    }
    Patient patient = PatientRequestMapper.toEntity(requestDTO);
    Patient saved = save(patient);
    PatientResponseDTO dto = findByIdAsDTO(saved.getId());
    if (dto != null) {
      dto.setTemporaryPassword(saved.getTemporaryPassword());
      dto.setMustChangePassword(saved.isMustChangePassword());
    }
    return dto;
  }

  @Override
  @Transactional
  @CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)
  public PatientResponseDTO update(Long id, PatientRequestDTO requestDTO)
      throws ResourceNotFoundException {
    Patient patient =
        patientRepository
            .findById(id)
            .orElseThrow(
                () -> new ResourceNotFoundException("Paciente no encontrado con id: " + id));

    if (requestDTO.getEmail() != null
        && !requestDTO.getEmail().equalsIgnoreCase(patient.getEmail())
        && existsByEmail(requestDTO.getEmail())) {
      throw new DuplicateResourceException("El email ya está registrado");
    }
    if (requestDTO.getCardIdentity() != null
        && !requestDTO.getCardIdentity().equals(patient.getCardIdentity())
        && existsByCardIdentity(requestDTO.getCardIdentity())) {
      throw new DuplicateResourceException("El DNI ya está registrado");
    }

    Patient updatedEntity = PatientRequestMapper.toEntity(requestDTO);
    updatedEntity.setId(id);
    update(updatedEntity);

    return findByIdAsDTO(id);
  }

  @Override
  @Transactional
  @CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)
  public void update(Patient patient) {
    if (patient.getId() == null) {
      throw new IllegalArgumentException("Patient ID cannot be null");
    }

    Patient existing =
        patientRepository
            .findById(patient.getId())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Paciente no encontrado con id: " + patient.getId()));

    boolean emailChanged =
        patient.getEmail() != null && !patient.getEmail().trim().equals(existing.getEmail());
    boolean passwordProvided = !isBlank(patient.getPassword());

    if (demoModePolicy.isProtectedDemoAccount(existing.getEmail())
        && (emailChanged || passwordProvided)) {
      throw new ResourceInUseException(
          "No se pueden modificar las credenciales de una cuenta demo");
    }

    if (passwordProvided && patient.getPassword().trim().length() < 6) {
      throw new IllegalArgumentException("La contraseña debe tener al menos 6 caracteres");
    }

    // Actualizar solo campos no nulos
    if (patient.getFirstName() != null) existing.setFirstName(patient.getFirstName());
    if (patient.getLastName() != null) existing.setLastName(patient.getLastName());
    if (patient.getEmail() != null) existing.setEmail(patient.getEmail());
    if (patient.getCardIdentity() != null) existing.setCardIdentity(patient.getCardIdentity());
    if (patient.getAdmissionDate() != null) existing.setAdmissionDate(patient.getAdmissionDate());
    if (patient.getAddress() != null) existing.setAddress(patient.getAddress());

    // Password: conservar si no viene; si viene, solo rotar el hash y bump-ear tokenVersion
    // cuando el hash resuelto difiere del almacenado (T5, S7): re-enviar la misma contraseña
    // es un no-op y no debe revocar JWTs vivos.
    if (!isBlank(patient.getPassword())) {
      String resolved =
          passwordPolicy.resolveForUpdate(patient.getPassword(), existing.getPassword());
      if (!resolved.equals(existing.getPassword())) {
        existing.setPassword(resolved);
        existing.setTokenVersion(existing.getTokenVersion() + 1);
      }
    }

    // Role: si viene en request usarla, si no conservar la existente o asignar PATIENT por defecto.
    // Defensa en profundidad: ADMIN nunca se acepta por esta vía, incluso si un futuro caller
    // se saltea el strip que hace el controller (mismo criterio que el registro público).
    if (patient.getRole() != null && patient.getRole() != Role.ADMIN) {
      existing.setRole(patient.getRole());
    } else if (existing.getRole() == null) {
      existing.setRole(Role.PATIENT);
    }

    patientRepository.save(existing);
  }

  @Override
  @Transactional
  @CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)
  public void delete(Long id) throws ResourceNotFoundException {
    Optional<Patient> patientToLookFor = findById(id);

    if (patientToLookFor.isPresent()) {
      if (demoModePolicy.isProtectedDemoAccount(patientToLookFor.get().getEmail())) {
        throw new ResourceInUseException("No se puede eliminar una cuenta demo");
      }
      // S3 (frontend-debt-and-cascade): un paciente con turnos asociados no se elimina
      // (misma política de bloqueo que el odontólogo). Los turnos nunca se borran en cascada.
      if (appointmentRepository.existsByPatientId(id)) {
        throw new ResourceInUseException(
            "El paciente tiene turnos asociados y no puede eliminarse");
      }
      patientRepository.deleteById(id);
    } else {
      throw new ResourceNotFoundException("No se pudo eliminar el paciente con el id: " + id);
    }
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<Patient> findById(Long id) {
    return patientRepository.findById(id);
  }

  @Override
  @Transactional(readOnly = true)
  public List<Patient> findAll() {
    return patientRepository.findAll();
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<Patient> findByCardIdentity(Integer cardIdentity) {
    return patientRepository.findByCardIdentity(cardIdentity);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<Patient> findByEmail(String email) {
    return patientRepository.findByEmail(email);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<PatientResponseDTO> findByEmailAsDTO(String email) {
    return patientRepository.findByEmail(email).map(this::convertToDTO);
  }

  @Override
  @Transactional(readOnly = true)
  public boolean existsByEmail(String email) {
    return patientRepository.findByEmail(email).isPresent();
  }

  @Override
  @Transactional(readOnly = true)
  public boolean existsByCardIdentity(Integer cardIdentity) {
    return patientRepository.findByCardIdentity(cardIdentity).isPresent();
  }

  private boolean isBlank(String s) {
    return s == null || s.trim().isEmpty();
  }

  @Override
  @Transactional(readOnly = true)
  public List<PatientResponseDTO> findAllAsDTO() {
    return patientRepository.findAll().stream()
        .map(this::convertToDTO)
        .collect(Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public PatientResponseDTO findByIdAsDTO(Long id) {
    Optional<Patient> patient = patientRepository.findById(id);
    return patient.map(this::convertToDTO).orElse(null);
  }

  private PatientResponseDTO convertToDTO(Patient patient) {
    return new PatientResponseDTO(
        patient.getId(),
        patient.getFirstName(),
        patient.getLastName(),
        patient.getEmail(),
        patient.getCardIdentity(),
        patient.getAdmissionDate(),
        patient.getAddress());
  }
}
