package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.dto.PatientResponseDTO;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.service.IPatientService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PatientServiceImpl implements IPatientService {

    private final IPatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;

    public PatientServiceImpl(IPatientRepository patientRepository, PasswordEncoder passwordEncoder) {
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    @Override
    public Patient save(Patient patient) {
        if (patient.getPassword() != null && !patient.getPassword().startsWith("$2a$")) {
            patient.setPassword(passwordEncoder.encode(patient.getPassword()));
        }
        return patientRepository.save(patient);
    }

    @Override
    public void update(Patient patient) {
        if (patient.getId() != null) {
            if (patient.getPassword() != null && !patient.getPassword().startsWith("$2a$")) {
                patient.setPassword(passwordEncoder.encode(patient.getPassword()));
            }
            patientRepository.save(patient);
        } else {
            throw new IllegalArgumentException("Patient ID cannot be null");
        }
    }

    @Override
    public Optional<Patient> findById(Long id) {
        return patientRepository.findById(id);
    }

    @Override
    public void delete(Long id) throws ResourceNotFoundException {
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

    @Override
    public Optional<Patient> findByCardIdentity(Integer cardIdentity) {
        return patientRepository.findByCardIdentity(cardIdentity);
    }

    @Override
    public Optional<Patient> findByEmail(String email) {
        return patientRepository.findByEmail(email);
    }

    @Override
    public boolean existsByEmail(String email) {
        return patientRepository.findByEmail(email).isPresent();
    }

    @Override
    public boolean existsByCardIdentity(Integer cardIdentity) {
        return patientRepository.findByCardIdentity(cardIdentity).isPresent();
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
        return new PatientResponseDTO(
                patient.getId(),
                patient.getFirstName(),
                patient.getLastName(),
                patient.getEmail(),
                patient.getCardIdentity(),
                patient.getAdmissionDate(),
                patient.getAddress());
    }
}
