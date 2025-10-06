package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.dto.DentistResponseDTO;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.service.IDentistService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DentistServiceImpl implements IDentistService {

    private final IDentistRepository dentistRepository;
    private final PasswordEncoder passwordEncoder;

    public DentistServiceImpl(IDentistRepository dentistRepository, PasswordEncoder passwordEncoder) {
        this.dentistRepository = dentistRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Dentist save(Dentist dentist) {
        if (isBlank(dentist.getFirstName())) {
            throw new IllegalArgumentException("El nombre es requerido");
        }
        if (isBlank(dentist.getLastName())) {
            throw new IllegalArgumentException("El apellido es requerido");
        }
        if (dentist.getRegistrationNumber() == null) {
            throw new IllegalArgumentException("Número de matrícula es requerido");
        }
        if (dentist.getEmail() != null && existsByEmail(dentist.getEmail())) {
            throw new IllegalArgumentException("El email ya está registrado");
        }
        if (existsByRegistrationNumber(dentist.getRegistrationNumber())) {
            throw new IllegalArgumentException("La matrícula ya está registrada");
        }

        // Si no viene contraseña, generar por defecto: firstName + lastName + últimos 3 dígitos de registrationNumber
        if (dentist.getPassword() == null || dentist.getPassword().trim().isEmpty()) {
            String defaultPwd = buildDefaultPassword(dentist.getFirstName(), dentist.getLastName(), dentist.getRegistrationNumber());
            dentist.setPassword(defaultPwd);
        }

        if (dentist.getPassword() != null && !dentist.getPassword().startsWith("$2a$")) {
            dentist.setPassword(passwordEncoder.encode(dentist.getPassword()));
        }

        // Asignar rol por defecto si no viene especificado
        if (dentist.getRole() == null) {
            dentist.setRole(Role.DENTIST);
        }

        return dentistRepository.save(dentist);
    }

    @Override
    public void update(Dentist dentist) {
        if (dentist.getId() == null) {
            throw new IllegalArgumentException("El ID no puede ser nulo para una actualización");
        }

        Dentist existing = dentistRepository.findById(dentist.getId()).orElseThrow(() -> new IllegalArgumentException("Dentista no encontrado con id: " + dentist.getId()));

        // Actualizar campos solo si vienen en el request (no nulos)
        if (dentist.getFirstName() != null) existing.setFirstName(dentist.getFirstName());
        if (dentist.getLastName() != null) existing.setLastName(dentist.getLastName());
        if (dentist.getEmail() != null) existing.setEmail(dentist.getEmail());
        if (dentist.getRegistrationNumber() != null) existing.setRegistrationNumber(dentist.getRegistrationNumber());

        // Password: si viene vacía/null -> conservar; si viene -> codificar si no parece bcrypt
        if (dentist.getPassword() != null && !dentist.getPassword().trim().isEmpty()) {
            if (!dentist.getPassword().startsWith("$2a$")) {
                existing.setPassword(passwordEncoder.encode(dentist.getPassword()));
            } else {
                existing.setPassword(dentist.getPassword());
            }
        }

        // Role: si viene en request usarla, si no conservar la existente o asignar DENTIST por defecto
        if (dentist.getRole() != null) {
            existing.setRole(dentist.getRole());
        } else if (existing.getRole() == null) {
            existing.setRole(Role.DENTIST);
        }

        dentistRepository.save(existing);
    }

    @Override
    public void delete(Long id) throws ResourceNotFoundException {
        Optional<Dentist> dentistToLookFor = findById(id);

        if (dentistToLookFor.isPresent()) {
            dentistRepository.deleteById(id);
        } else {
            throw new ResourceNotFoundException("No se pudo eliminar el odontólogo con el id: " + id);
        }
    }

    @Override
    public Optional<Dentist> findById(Long id) {
        return dentistRepository.findById(id);
    }

    @Override
    public List<Dentist> findAll() {
        return dentistRepository.findAll();
    }

    @Override
    public Optional<Dentist> findByRegistrationNumber(Integer registrationNumber) {
        return dentistRepository.findByRegistrationNumber(registrationNumber);
    }

    @Override
    public DentistResponseDTO findByIdAsDTO(Long id) {
        return dentistRepository.findById(id).map(this::convertToDTO).orElse(null);
    }

    @Override
    public List<DentistResponseDTO> findAllAsDTO() {
        return dentistRepository.findAll().stream().map(this::convertToDTO).collect(java.util.stream.Collectors.toList());
    }

    public Optional<Dentist> findByEmail(String email) {
        return dentistRepository.findByEmail(email);
    }

    public boolean existsByEmail(String email) {
        return dentistRepository.findByEmail(email).isPresent();
    }

    public boolean existsByRegistrationNumber(Integer registrationNumber) {
        return dentistRepository.findByRegistrationNumber(registrationNumber).isPresent();
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private String buildDefaultPassword(String firstName, String lastName, Integer number) {
        String fn = firstName != null ? firstName.trim() : "";
        String ln = lastName != null ? lastName.trim() : "";
        String lastThree = "000";
        if (number != null) {
            int num = Math.abs(number % 1000);
            lastThree = String.format("%03d", num);
        }
        return fn + ln + lastThree;
    }

    private DentistResponseDTO convertToDTO(Dentist dentist) {
        if (dentist == null) return null;
        return new DentistResponseDTO(dentist.getId(), dentist.getFirstName(), dentist.getLastName(), dentist.getEmail(), dentist.getRegistrationNumber());
    }
}
