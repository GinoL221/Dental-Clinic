package com.dh.dentalClinicMVC.services;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.entity.Appointment;

import java.util.List;
import java.util.Optional;

public interface IAppointmentService {
    AppointmentDTO save(AppointmentDTO appointmentDTO);

    Optional<Appointment> findById(Long id);

    void update(Appointment appointment);

    void delete(Long id);

    List<Appointment> findAll();
}
