package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.dto.SpecialtyDTO;
import com.dh.dentalClinicMVC.exception.DuplicateResourceException;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;

import java.util.List;

public interface ISpecialtyService {
    List<SpecialtyDTO> findAll();

    SpecialtyDTO findById(Long id) throws ResourceNotFoundException;

    SpecialtyDTO save(SpecialtyDTO specialty) throws DuplicateResourceException;

    SpecialtyDTO update(Long id, SpecialtyDTO specialty) throws ResourceNotFoundException;

    void deleteById(Long id) throws ResourceNotFoundException, DuplicateResourceException;

    void assignSpecialtyToDentist(Long dentistId, Long specialtyId) throws ResourceNotFoundException, DuplicateResourceException;

    void removeSpecialtyFromDentist(Long dentistId, Long specialtyId) throws ResourceNotFoundException;

    List<SpecialtyDTO> findByDentistId(Long dentistId) throws ResourceNotFoundException;
}
