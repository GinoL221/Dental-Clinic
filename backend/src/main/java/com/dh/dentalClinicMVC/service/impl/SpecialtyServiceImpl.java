package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.dto.SpecialtyDTO;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Specialty;
import com.dh.dentalClinicMVC.exception.DuplicateResourceException;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.ISpecialtyRepository;
import com.dh.dentalClinicMVC.service.ISpecialtyService;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SpecialtyServiceImpl implements ISpecialtyService {

  private final ISpecialtyRepository specialtyRepository;
  private final IDentistRepository dentistRepository;

  public SpecialtyServiceImpl(
      ISpecialtyRepository specialtyRepository, IDentistRepository dentistRepository) {
    this.specialtyRepository = specialtyRepository;
    this.dentistRepository = dentistRepository;
  }

  private SpecialtyDTO toDTO(Specialty specialty) {
    return new SpecialtyDTO(specialty.getId(), specialty.getName(), specialty.getDescription());
  }

  @Override
  public List<SpecialtyDTO> findAll() {
    return specialtyRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
  }

  @Override
  public SpecialtyDTO findById(Long id) throws ResourceNotFoundException {
    return specialtyRepository
        .findById(id)
        .map(this::toDTO)
        .orElseThrow(
            () -> new ResourceNotFoundException("Especialidad no encontrada con id: " + id));
  }

  @Override
  public SpecialtyDTO save(SpecialtyDTO specialty) throws DuplicateResourceException {
    if (specialtyRepository.findByName(specialty.getName()).isPresent()) {
      throw new DuplicateResourceException(
          "Ya existe una especialidad con el nombre: " + specialty.getName());
    }
    Specialty entity = new Specialty();
    entity.setName(specialty.getName());
    entity.setDescription(specialty.getDescription());
    return toDTO(specialtyRepository.save(entity));
  }

  @Override
  public SpecialtyDTO update(Long id, SpecialtyDTO specialty) throws ResourceNotFoundException {
    Specialty existing =
        specialtyRepository
            .findById(id)
            .orElseThrow(
                () -> new ResourceNotFoundException("Especialidad no encontrada con id: " + id));

    if (specialty.getName() != null && !specialty.getName().equals(existing.getName())) {
      if (specialtyRepository.findByName(specialty.getName()).isPresent()) {
        throw new DuplicateResourceException(
            "Ya existe una especialidad con el nombre: " + specialty.getName());
      }
      existing.setName(specialty.getName());
    }
    if (specialty.getDescription() != null) {
      existing.setDescription(specialty.getDescription());
    }

    return toDTO(specialtyRepository.save(existing));
  }

  @Override
  @Transactional
  public void deleteById(Long id) throws ResourceNotFoundException, DuplicateResourceException {
    Specialty specialty =
        specialtyRepository
            .findById(id)
            .orElseThrow(
                () -> new ResourceNotFoundException("Especialidad no encontrada con id: " + id));

    if (specialty.getDentists() != null && !specialty.getDentists().isEmpty()) {
      throw new DuplicateResourceException(
          "No se puede eliminar la especialidad porque está asignada a "
              + specialty.getDentists().size()
              + " dentista(s)");
    }

    specialtyRepository.deleteById(id);
  }

  @Override
  @Transactional
  public void assignSpecialtyToDentist(Long dentistId, Long specialtyId)
      throws ResourceNotFoundException, DuplicateResourceException {
    Dentist dentist =
        dentistRepository
            .findById(dentistId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Dentista no encontrado con id: " + dentistId));
    Specialty specialty =
        specialtyRepository
            .findById(specialtyId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        "Especialidad no encontrada con id: " + specialtyId));

    if (dentist.getSpecialties() != null && dentist.getSpecialties().contains(specialty)) {
      throw new DuplicateResourceException("El dentista ya tiene asignada esta especialidad");
    }

    dentist.getSpecialties().add(specialty);
    dentistRepository.save(dentist);
  }

  @Override
  @Transactional
  public void removeSpecialtyFromDentist(Long dentistId, Long specialtyId)
      throws ResourceNotFoundException {
    Dentist dentist =
        dentistRepository
            .findById(dentistId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Dentista no encontrado con id: " + dentistId));
    Specialty specialty =
        specialtyRepository
            .findById(specialtyId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        "Especialidad no encontrada con id: " + specialtyId));

    dentist.getSpecialties().remove(specialty);
    dentistRepository.save(dentist);
  }

  @Override
  public List<SpecialtyDTO> findByDentistId(Long dentistId) throws ResourceNotFoundException {
    Dentist dentist =
        dentistRepository
            .findById(dentistId)
            .orElseThrow(
                () -> new ResourceNotFoundException("Dentista no encontrado con id: " + dentistId));

    return dentist.getSpecialties().stream().map(this::toDTO).collect(Collectors.toList());
  }
}
