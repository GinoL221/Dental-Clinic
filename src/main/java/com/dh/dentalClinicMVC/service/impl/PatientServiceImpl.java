package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.service.IPatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PatientServiceImpl implements IPatientService {

    private IPatientRepository patientRepository;

    @Autowired
    public PatientServiceImpl(IPatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Override
    public Patient save(Patient patient) {
        return patientRepository.save(patient);
    }

    @Override
    public Optional<Patient> findById(Long id) {
        return patientRepository.findById(id);
    }

    @Override
    public void update(Patient patient) {
        if (patient.getId() != null) {
            patientRepository.save(patient);
        } else {
            throw new IllegalArgumentException("Patient ID cannot be null");
        }
    }

    @Override
    public void delete(Long id) throws ResourceNotFoundException {
        // Vamos a buscar por ID el paciente y si no existe vamos a lanzar la excepción

        //  Vamos a buscar primero el paciente por ID
        Optional<Patient> patientToLooFor = findById(id);

        if (patientToLooFor.isPresent()) {
            patientRepository.deleteById(id);
        } else {
            throw new ResourceNotFoundException("No se pudo eliminar el paciente con el id: " + id);
        }
    }

    @Override
    public List<Patient> findAll() {
        return patientRepository.findAll();
    }
}
