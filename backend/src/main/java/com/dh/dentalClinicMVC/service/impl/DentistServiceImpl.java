package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.dto.DentistResponseDTO;
import com.dh.dentalClinicMVC.dto.SpecialtyResponseDTO;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.service.IDentistService;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class DentistServiceImpl implements IDentistService {

  private final IDentistRepository dentistRepository;
  private final UserPasswordPolicy passwordPolicy;

  public DentistServiceImpl(
      IDentistRepository dentistRepository, UserPasswordPolicy passwordPolicy) {
    this.dentistRepository = dentistRepository;
    this.passwordPolicy = passwordPolicy;
  }

  @Override
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
      throw new IllegalArgumentException("El email ya está registrado");
    }
    if (existsByRegistrationNumber(dentist.getRegistrationNumber())) {
      throw new IllegalArgumentException("La matrícula ya está registrada");
    }

    dentist.setPassword(
        passwordPolicy.resolveForCreate(
            dentist.getPassword(),
            dentist.getFirstName(),
            dentist.getLastName(),
            dentist.getRegistrationNumber()));

    // Asignar rol por defecto si no viene especificado
    if (dentist.getRole() == null) {
      dentist.setRole(Role.DENTIST);
    }

    return dentistRepository.save(dentist);
  }

  @Override
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
    existing.setPassword(
        passwordPolicy.resolveForUpdate(dentist.getPassword(), existing.getPassword()));

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
  public void delete(Long id) throws ResourceNotFoundException {
    Optional<Dentist> dentistToLookFor = findById(id);

    if (dentistToLookFor.isPresent()) {
      dentistRepository.deleteById(id);
    } else {
      throw new ResourceNotFoundException("No se pudo eliminar el odontólogo con el id: " + id);
    }
  }

  @Override
  public Optional<Dentist> findById(Long id) {
    return dentistRepository.findById(id);
  }

  @Override
  public List<Dentist> findAll() {
    return dentistRepository.findAll();
  }

  @Override
  public Optional<Dentist> findByRegistrationNumber(Integer registrationNumber) {
    return dentistRepository.findByRegistrationNumber(registrationNumber);
  }

  @Override
  public DentistResponseDTO findByIdAsDTO(Long id) {
    return dentistRepository.findById(id).map(this::convertToDTO).orElse(null);
  }

  @Override
  public List<DentistResponseDTO> findAllAsDTO() {
    return dentistRepository.findAll().stream()
        .map(this::convertToDTO)
        .collect(java.util.stream.Collectors.toList());
  }

  @Override
  public Optional<Dentist> findByEmail(String email) {
    return dentistRepository.findByEmail(email);
  }

  @Override
  public boolean existsByEmail(String email) {
    return dentistRepository.findByEmail(email).isPresent();
  }

  @Override
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
