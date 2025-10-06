package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.dto.PatientResponseDTO;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.service.IPatientService;
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
        if (isBlank(patient.getFirstName())) {
            throw new IllegalArgumentException("El nombre es requerido");
        }
        if (isBlank(patient.getLastName())) {
            throw new IllegalArgumentException("El apellido es requerido");
        }
        if (patient.getCardIdentity() == null) {
            throw new IllegalArgumentException("DNI (cardIdentity) es requerido");
        }
        if (patient.getAdmissionDate() == null) {
            throw new IllegalArgumentException("La fecha de ingreso es requerida");
        }
        if (patient.getEmail() != null && existsByEmail(patient.getEmail())) {
            throw new IllegalArgumentException("El email ya está registrado");
        }
        if (existsByCardIdentity(patient.getCardIdentity())) {
            throw new IllegalArgumentException("El DNI ya está registrado");
        }

        // Si no viene contraseña, generar por defecto: firstName + lastName + últimos 3 dígitos de cardIdentity
        if (patient.getPassword() == null || patient.getPassword().trim().isEmpty()) {
            String defaultPwd = buildDefaultPassword(patient.getFirstName(), patient.getLastName(), patient.getCardIdentity());
            patient.setPassword(defaultPwd);
        }

        if (patient.getPassword() != null && !patient.getPassword().startsWith("$2a$")) {
            patient.setPassword(passwordEncoder.encode(patient.getPassword()));
        }

        // Asignar rol por defecto si no viene
        if (patient.getRole() == null) {
            patient.setRole(Role.PATIENT);
        }

        return patientRepository.save(patient);
    }

    @Override
    public void update(Patient patient) {
        if (patient.getId() == null) {
            throw new IllegalArgumentException("Patient ID cannot be null");
        }

        Patient existing = patientRepository.findById(patient.getId()).orElseThrow(() -> new IllegalArgumentException("Paciente no encontrado con id: " + patient.getId()));

        // Actualizar solo campos no nulos
        if (patient.getFirstName() != null) existing.setFirstName(patient.getFirstName());
        if (patient.getLastName() != null) existing.setLastName(patient.getLastName());
        if (patient.getEmail() != null) existing.setEmail(patient.getEmail());
        if (patient.getCardIdentity() != null) existing.setCardIdentity(patient.getCardIdentity());
        if (patient.getAdmissionDate() != null) existing.setAdmissionDate(patient.getAdmissionDate());
        if (patient.getAddress() != null) existing.setAddress(patient.getAddress());

        // Password: conservar si no viene, codificar si viene y no parece bcrypt
        if (patient.getPassword() != null && !patient.getPassword().trim().isEmpty()) {
            if (!patient.getPassword().startsWith("$2a$")) {
                existing.setPassword(passwordEncoder.encode(patient.getPassword()));
            } else {
                existing.setPassword(patient.getPassword());
            }
        }

        // Role: si viene en request usarla, si no conservar la existente o asignar PATIENT por defecto
        if (patient.getRole() != null) {
            existing.setRole(patient.getRole());
        } else if (existing.getRole() == null) {
            existing.setRole(Role.PATIENT);
        }

        patientRepository.save(existing);
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
    public Optional<Patient> findById(Long id) {
        return patientRepository.findById(id);
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

    private String buildDefaultPassword(String firstName, String lastName, Integer cardIdentity) {
        String fn = firstName != null ? firstName.trim() : "";
        String ln = lastName != null ? lastName.trim() : "";
        String lastThree = "000";
        if (cardIdentity != null) {
            int num = Math.abs(cardIdentity % 1000);
            lastThree = String.format("%03d", num);
        }
        return fn + ln + lastThree;
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    public List<PatientResponseDTO> findAllAsDTO() {
        return patientRepository.findAll().stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public PatientResponseDTO findByIdAsDTO(Long id) {
        Optional<Patient> patient = patientRepository.findById(id);
        return patient.map(this::convertToDTO).orElse(null);
    }

    private PatientResponseDTO convertToDTO(Patient patient) {
        return new PatientResponseDTO(patient.getId(), patient.getFirstName(), patient.getLastName(), patient.getEmail(), patient.getCardIdentity(), patient.getAdmissionDate(), patient.getAddress());
    }
}
