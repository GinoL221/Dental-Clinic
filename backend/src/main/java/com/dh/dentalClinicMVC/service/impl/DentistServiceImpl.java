package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.configuration.DemoModePolicy;
import com.dh.dentalClinicMVC.dto.DentistRequestDTO;
import com.dh.dentalClinicMVC.dto.DentistRequestMapper;
import com.dh.dentalClinicMVC.dto.DentistResponseDTO;
import com.dh.dentalClinicMVC.dto.SpecialtyResponseDTO;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.exception.DuplicateResourceException;
import com.dh.dentalClinicMVC.exception.ResourceInUseException;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.service.IDentistService;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DentistServiceImpl implements IDentistService {

  private final IDentistRepository dentistRepository;
  private final IAppointmentRepository appointmentRepository;
  private final UserPasswordPolicy passwordPolicy;
  private final DemoModePolicy demoModePolicy;

  public DentistServiceImpl(
      IDentistRepository dentistRepository, UserPasswordPolicy passwordPolicy) {
    this(dentistRepository, null, passwordPolicy, DemoModePolicy.disabled());
  }

  @Autowired
  public DentistServiceImpl(
      IDentistRepository dentistRepository,
      IAppointmentRepository appointmentRepository,
      UserPasswordPolicy passwordPolicy,
      DemoModePolicy demoModePolicy) {
    this.dentistRepository = dentistRepository;
    this.appointmentRepository = appointmentRepository;
    this.passwordPolicy = passwordPolicy;
    this.demoModePolicy = demoModePolicy;
  }

  @Override
  @Transactional
  @CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)
  public Dentist save(Dentist dentist) {
    if (isBlank(dentist.getFirstName())) {
      throw new IllegalArgumentException("El nombre es requerido");
    }
    if (isBlank(dentist.getLastName())) {
      throw new IllegalArgumentException("El apellido es requerido");
    }
    if (dentist.getRegistrationNumber() == null) {
      throw new IllegalArgumentException("Número de matrícula es requerido");
    }
    if (dentist.getEmail() != null && existsByEmail(dentist.getEmail())) {
      throw new DuplicateResourceException("El email ya está registrado");
    }
    if (existsByRegistrationNumber(dentist.getRegistrationNumber())) {
      throw new DuplicateResourceException("La matrícula ya está registrada");
    }

    UserPasswordPolicy.PasswordResolution pwRes =
        passwordPolicy.resolveForCreate(
            dentist.getPassword(),
            dentist.getFirstName(),
            dentist.getLastName(),
            dentist.getRegistrationNumber());
    dentist.setPassword(pwRes.encodedPassword());
    dentist.setMustChangePassword(pwRes.mustChangePassword());
    dentist.setTemporaryPassword(pwRes.rawPassword());

    // Asignar rol por defecto si no viene especificado
    if (dentist.getRole() == null) {
      dentist.setRole(Role.DENTIST);
    }

    Dentist saved = dentistRepository.save(dentist);
    saved.setTemporaryPassword(pwRes.rawPassword());
    return saved;
  }

  @Override
  @Transactional
  @CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)
  public DentistResponseDTO save(DentistRequestDTO requestDTO) {
    if (requestDTO.getEmail() != null && existsByEmail(requestDTO.getEmail())) {
      throw new DuplicateResourceException("El email ya está registrado");
    }
    if (requestDTO.getRegistrationNumber() != null
        && existsByRegistrationNumber(requestDTO.getRegistrationNumber())) {
      throw new DuplicateResourceException("La matrícula ya está registrada");
    }
    Dentist dentist = DentistRequestMapper.toEntity(requestDTO);
    Dentist saved = save(dentist);
    DentistResponseDTO dto = findByIdAsDTO(saved.getId());
    if (dto != null) {
      dto.setTemporaryPassword(saved.getTemporaryPassword());
      dto.setMustChangePassword(saved.isMustChangePassword());
    }
    return dto;
  }

  @Override
  @Transactional
  @CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)
  public DentistResponseDTO update(Long id, DentistRequestDTO requestDTO)
      throws ResourceNotFoundException {
    Dentist dentist =
        dentistRepository
            .findById(id)
            .orElseThrow(
                () -> new ResourceNotFoundException("Dentista no encontrado con id: " + id));

    if (requestDTO.getEmail() != null
        && !requestDTO.getEmail().equalsIgnoreCase(dentist.getEmail())
        && existsByEmail(requestDTO.getEmail())) {
      throw new DuplicateResourceException("El email ya está registrado");
    }
    if (requestDTO.getRegistrationNumber() != null
        && !requestDTO.getRegistrationNumber().equals(dentist.getRegistrationNumber())
        && existsByRegistrationNumber(requestDTO.getRegistrationNumber())) {
      throw new DuplicateResourceException("La matrícula ya está registrada");
    }

    Dentist updatedEntity = DentistRequestMapper.toEntity(requestDTO);
    updatedEntity.setId(id);
    update(updatedEntity);

    return findByIdAsDTO(id);
  }

  @Override
  @Transactional
  @CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)
  public void update(Dentist dentist) {
    if (dentist.getId() == null) {
      throw new IllegalArgumentException("El ID no puede ser nulo para una actualización");
    }

    Dentist existing =
        dentistRepository
            .findById(dentist.getId())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Dentista no encontrado con id: " + dentist.getId()));

    // Actualizar campos solo si vienen en el request (no nulos)
    if (dentist.getFirstName() != null) existing.setFirstName(dentist.getFirstName());
    if (dentist.getLastName() != null) existing.setLastName(dentist.getLastName());
    if (dentist.getEmail() != null) existing.setEmail(dentist.getEmail());
    if (dentist.getRegistrationNumber() != null)
      existing.setRegistrationNumber(dentist.getRegistrationNumber());

    // Password: si viene vacía/null -> conservar; si viene -> codificar si no parece bcrypt
    if (!isBlank(dentist.getPassword())) {
      existing.setPassword(
          passwordPolicy.resolveForUpdate(dentist.getPassword(), existing.getPassword()));
      existing.setTokenVersion(existing.getTokenVersion() + 1);
    }

    // Role: si viene en request usarla, si no conservar la existente o asignar DENTIST por defecto.
    // Defensa en profundidad: ADMIN nunca se acepta por esta vía, incluso si un futuro caller
    // se saltea el strip que hace el controller (mismo criterio que el registro público).
    if (dentist.getRole() != null && dentist.getRole() != Role.ADMIN) {
      existing.setRole(dentist.getRole());
    } else if (existing.getRole() == null) {
      existing.setRole(Role.DENTIST);
    }

    dentistRepository.save(existing);
  }

  @Override
  @Transactional
  @CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)
  public void delete(Long id) throws ResourceNotFoundException {
    Optional<Dentist> dentistToLookFor = findById(id);

    if (dentistToLookFor.isPresent()) {
      if (demoModePolicy.isProtectedDemoAccount(dentistToLookFor.get().getEmail())) {
        throw new ResourceInUseException("No se puede eliminar una cuenta demo");
      }
      if (appointmentRepository != null && appointmentRepository.existsByDentistId(id)) {
        throw new ResourceInUseException(
            "El odontólogo tiene turnos asociados y no puede eliminarse");
      }
      dentistRepository.deleteById(id);
    } else {
      throw new ResourceNotFoundException("No se pudo eliminar el odontólogo con el id: " + id);
    }
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<Dentist> findById(Long id) {
    return dentistRepository.findById(id);
  }

  @Override
  @Transactional(readOnly = true)
  public List<Dentist> findAll() {
    return dentistRepository.findAll();
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<Dentist> findByRegistrationNumber(Integer registrationNumber) {
    return dentistRepository.findByRegistrationNumber(registrationNumber);
  }

  @Override
  @Transactional(readOnly = true)
  public DentistResponseDTO findByIdAsDTO(Long id) {
    return dentistRepository.findById(id).map(this::convertToDTO).orElse(null);
  }

  @Override
  @Transactional(readOnly = true)
  public List<DentistResponseDTO> findAllAsDTO() {
    return dentistRepository.findAll().stream()
        .map(this::convertToDTO)
        .collect(java.util.stream.Collectors.toList());
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<Dentist> findByEmail(String email) {
    return dentistRepository.findByEmail(email);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<DentistResponseDTO> findByEmailAsDTO(String email) {
    return dentistRepository.findByEmail(email).map(this::convertToDTO);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<DentistResponseDTO> findByRegistrationNumberAsDTO(Integer registrationNumber) {
    return dentistRepository.findByRegistrationNumber(registrationNumber).map(this::convertToDTO);
  }

  @Override
  @Transactional(readOnly = true)
  public boolean existsByEmail(String email) {
    return dentistRepository.findByEmail(email).isPresent();
  }

  @Override
  @Transactional(readOnly = true)
  public boolean existsByRegistrationNumber(Integer registrationNumber) {
    return dentistRepository.findByRegistrationNumber(registrationNumber).isPresent();
  }

  private boolean isBlank(String s) {
    return s == null || s.trim().isEmpty();
  }

  private DentistResponseDTO convertToDTO(Dentist dentist) {
    if (dentist == null) return null;
    java.util.List<SpecialtyResponseDTO> specialtyDTOs =
        dentist.getSpecialties() == null
            ? java.util.Collections.emptyList()
            : dentist.getSpecialties().stream()
                .map(s -> new SpecialtyResponseDTO(s.getId(), s.getName(), s.getDescription()))
                .collect(java.util.stream.Collectors.toList());
    return new DentistResponseDTO(
        dentist.getId(),
        dentist.getFirstName(),
        dentist.getLastName(),
        dentist.getEmail(),
        dentist.getRegistrationNumber(),
        specialtyDTOs);
  }
}
