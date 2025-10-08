package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IAppointmentService {
    AppointmentDTO save(AppointmentDTO appointmentDTO);

    Optional<AppointmentDTO> findById(Long id);

    AppointmentDTO update(AppointmentDTO appointmentDTO) throws ResourceNotFoundException;

    Optional<AppointmentDTO> delete(Long id) throws ResourceNotFoundException;

    List<AppointmentDTO> findAll();

    Page<AppointmentDTO> searchAppointments(
            String patient,
            String dentist,
            AppointmentStatus status,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable);

    AppointmentDTO updateStatus(Long id, AppointmentStatus status) throws ResourceNotFoundException;
}
