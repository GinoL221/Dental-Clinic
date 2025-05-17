package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;

import java.util.List;
import java.util.Optional;

public interface IPatientService {
    Patient save(Patient patient);

    Optional<Patient> findById(Long id);

    void update(Patient patient);

    void delete(Long id) throws ResourceNotFoundException;

    List<Patient> findAll();
}
