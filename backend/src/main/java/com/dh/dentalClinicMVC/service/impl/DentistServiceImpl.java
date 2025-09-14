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
}
