package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.dto.DentistResponseDTO;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;

import java.util.List;
import java.util.Optional;

public interface IDentistService {
    Dentist save(Dentist dentist);

    Optional<Dentist> findById(Long id);

    void update(Dentist dentist);

    void delete(Long id) throws ResourceNotFoundException;

    List<Dentist> findAll();

    Optional<Dentist> findByRegistrationNumber(Integer registrationNumber);

    DentistResponseDTO findByIdAsDTO(Long id);

    List<DentistResponseDTO> findAllAsDTO();
}
