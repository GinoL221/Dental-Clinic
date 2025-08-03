package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;

import java.util.List;
import java.util.Optional;

public interface IAppointmentService {
    AppointmentDTO save(AppointmentDTO appointmentDTO);

    Optional<AppointmentDTO> findById(Long id);

    AppointmentDTO update(AppointmentDTO appointmentDTO) throws ResourceNotFoundException;

    Optional<AppointmentDTO> delete(Long id) throws ResourceNotFoundException;

    List<AppointmentDTO> findAll();
}
