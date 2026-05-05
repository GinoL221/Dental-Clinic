package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.dto.SpecialtyDTO;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Specialty;
import com.dh.dentalClinicMVC.exception.DuplicateResourceException;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.ISpecialtyRepository;
import com.dh.dentalClinicMVC.service.ISpecialtyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SpecialtyServiceImpl implements ISpecialtyService {

    private final ISpecialtyRepository specialtyRepository;
    private final IDentistRepository dentistRepository;

    public SpecialtyServiceImpl(ISpecialtyRepository specialtyRepository, IDentistRepository dentistRepository) {
        this.specialtyRepository = specialtyRepository;
        this.dentistRepository = dentistRepository;
    }

    private SpecialtyDTO toDTO(Specialty specialty) {
        return new SpecialtyDTO(specialty.getId(), specialty.getName(), specialty.getDescription());
    }

    @Override
    public SpecialtyDTO save(Specialty specialty) {
        if (specialtyRepository.findByName(specialty.getName()).isPresent()) {
            throw new DuplicateResourceException("Ya existe una especialidad con el nombre: " + specialty.getName());
        }
        return toDTO(specialtyRepository.save(specialty));
    }

    @Override
    public Optional<SpecialtyDTO> findById(Long id) {
        return specialtyRepository.findById(id).map(this::toDTO);
    }

    @Override
    public List<SpecialtyDTO> findAll() {
        return specialtyRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public SpecialtyDTO update(Specialty specialty) throws ResourceNotFoundException {
        Specialty existing = specialtyRepository.findById(specialty.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad no encontrada con id: " + specialty.getId()));

        if (specialty.getName() != null) existing.setName(specialty.getName());
        if (specialty.getDescription() != null) existing.setDescription(specialty.getDescription());

        return toDTO(specialtyRepository.save(existing));
    }

    @Override
    public void delete(Long id) throws ResourceNotFoundException {
        specialtyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad no encontrada con id: " + id));
        specialtyRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void assignToDentist(Long dentistId, Long specialtyId) throws ResourceNotFoundException {
        Dentist dentist = dentistRepository.findById(dentistId)
                .orElseThrow(() -> new ResourceNotFoundException("Dentista no encontrado con id: " + dentistId));
        Specialty specialty = specialtyRepository.findById(specialtyId)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad no encontrada con id: " + specialtyId));

        dentist.getSpecialties().add(specialty);
        dentistRepository.save(dentist);
    }

    @Override
    @Transactional
    public void removeFromDentist(Long dentistId, Long specialtyId) throws ResourceNotFoundException {
        Dentist dentist = dentistRepository.findById(dentistId)
                .orElseThrow(() -> new ResourceNotFoundException("Dentista no encontrado con id: " + dentistId));
        Specialty specialty = specialtyRepository.findById(specialtyId)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidad no encontrada con id: " + specialtyId));

        dentist.getSpecialties().remove(specialty);
        dentistRepository.save(dentist);
    }
}
