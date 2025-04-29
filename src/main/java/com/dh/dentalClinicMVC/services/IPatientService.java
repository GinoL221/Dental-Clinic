package com.dh.dentalClinicMVC.services;

import com.dh.dentalClinicMVC.model.Patient;

import java.util.List;
import java.util.Optional;

public interface IPatientService {
    Patient save(Patient patient);

    Optional<Patient> findById(Long id);

    void update(Patient patient);

    void delete(Long id);

    List<Patient> findAll();
}
