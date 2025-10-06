package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.entity.Dentist;
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
        // Validaciones: nombre, apellido y matrícula no pueden estar vacíos
        if (isBlank(dentist.getFirstName())) {
            throw new IllegalArgumentException("El nombre es requerido");
        }
        if (isBlank(dentist.getLastName())) {
            throw new IllegalArgumentException("El apellido es requerido");
        }
        if (dentist.getRegistrationNumber() == null) {
            throw new IllegalArgumentException("Número de matrícula es requerido");
        }

        // Si no viene contraseña, generar por defecto: firstName + lastName + últimos 3 dígitos de registrationNumber
        if (dentist.getPassword() == null || dentist.getPassword().trim().isEmpty()) {
            String defaultPwd = buildDefaultPassword(dentist.getFirstName(), dentist.getLastName(), dentist.getRegistrationNumber());
            dentist.setPassword(defaultPwd);
        }

        if (dentist.getPassword() != null && !dentist.getPassword().startsWith("$2a$")) {
            dentist.setPassword(passwordEncoder.encode(dentist.getPassword()));
        }
        return dentistRepository.save(dentist);
    }

    @Override
    public void update(Dentist dentist) {
        if (dentist.getPassword() != null && !dentist.getPassword().startsWith("$2a$")) {
            dentist.setPassword(passwordEncoder.encode(dentist.getPassword()));
        }
        dentistRepository.save(dentist);
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

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
