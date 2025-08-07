package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.dto.PatientResponseDTO;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.service.IPatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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

    public List<PatientResponseDTO> findAllAsDTO() {
        return patientRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PatientResponseDTO findByIdAsDTO(Long id) {
        Optional<Patient> patient = patientRepository.findById(id);
        return patient.map(this::convertToDTO).orElse(null);
    }

    private PatientResponseDTO convertToDTO(Patient patient) {
        String addressString = patient.getAddress() != null ? 
            patient.getAddress().getStreet() + ", " + patient.getAddress().getNumber() + ", " + patient.getAddress().getLocation() 
            : null;
        
        return new PatientResponseDTO(
            patient.getId(),
            patient.getName(),
            patient.getLastName(),
            patient.getEmail(),
            patient.getCardIdentity(),
            patient.getAdmissionDate(),
            addressString
        );
    }
}
