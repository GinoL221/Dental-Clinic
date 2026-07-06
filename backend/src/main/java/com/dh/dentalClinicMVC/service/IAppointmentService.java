package com.dh.dentalClinicMVC.service;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IAppointmentService {
  AppointmentDTO save(AppointmentDTO appointmentDTO);

  Optional<AppointmentDTO> findById(Long id);

  AppointmentDTO update(AppointmentDTO appointmentDTO) throws ResourceNotFoundException;

  Optional<AppointmentDTO> delete(Long id) throws ResourceNotFoundException;

  List<AppointmentDTO> findAll();

  List<AppointmentDTO> findAllForCurrentUser(String email, Role role);

  Page<AppointmentDTO> searchAppointments(
      String patient,
      String dentist,
      AppointmentStatus status,
      LocalDate fromDate,
      LocalDate toDate,
      Pageable pageable);

  AppointmentDTO updateStatus(Long id, AppointmentStatus status) throws ResourceNotFoundException;
}
