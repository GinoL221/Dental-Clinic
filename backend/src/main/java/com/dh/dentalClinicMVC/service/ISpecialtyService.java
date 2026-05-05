package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.dto.SpecialtyDTO;
import com.dh.dentalClinicMVC.entity.Specialty;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;

import java.util.List;
import java.util.Optional;

public interface ISpecialtyService {
    SpecialtyDTO save(Specialty specialty);

    Optional<SpecialtyDTO> findById(Long id);

    List<SpecialtyDTO> findAll();

    SpecialtyDTO update(Specialty specialty) throws ResourceNotFoundException;

    void delete(Long id) throws ResourceNotFoundException;

    void assignToDentist(Long dentistId, Long specialtyId) throws ResourceNotFoundException;

    void removeFromDentist(Long dentistId, Long specialtyId) throws ResourceNotFoundException;
}
