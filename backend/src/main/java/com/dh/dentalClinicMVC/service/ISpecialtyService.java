package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.entity.Specialty;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;

import java.util.List;
import java.util.Optional;

public interface ISpecialtyService {
    Specialty save(Specialty specialty);

    Optional<Specialty> findById(Long id);

    List<Specialty> findAll();

    Specialty update(Specialty specialty) throws ResourceNotFoundException;

    void delete(Long id) throws ResourceNotFoundException;

    void assignToDentist(Long dentistId, Long specialtyId) throws ResourceNotFoundException;

    void removeFromDentist(Long dentistId, Long specialtyId) throws ResourceNotFoundException;
}
