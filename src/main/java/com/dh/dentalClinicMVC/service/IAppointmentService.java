package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;

import java.util.List;
import java.util.Optional;

public interface IAppointmentService {
    AppointmentDTO save(AppointmentDTO appointmentDTO);

    Optional<AppointmentDTO> findById(Long id);

    AppointmentDTO update(AppointmentDTO appointmentDTO) throws Exception;

    void delete(Long id);

    List<AppointmentDTO> findAll();
}
