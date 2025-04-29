package com.dh.dentalClinicMVC.services.impl;

import com.dh.dentalClinicMVC.model.Appointment;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.services.IAppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AppointmentService implements IAppointmentService {

    private IAppointmentRepository appointmentRepository;

    @Autowired
    public AppointmentService(IAppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    public Appointment save(Appointment appointment) {
        return appointmentRepository.save(appointment);
    }

    @Override
    public Optional<Appointment> findById(Long id) {
        return appointmentRepository.findById(id);
    }

    @Override
    public void update(Appointment appointment) {
        if (appointment.getId() != null) {
            appointmentRepository.save(appointment);
        } else {
            throw new IllegalArgumentException("Appointment ID cannot be null");
        }
    }

    @Override
    public void delete(Long id) {
        if (appointmentRepository.existsById(id)) {
            appointmentRepository.deleteById(id);
        } else {
            throw new IllegalArgumentException("Appointment with ID " + id + " does not exist");
        }
    }

    @Override
    public List<Appointment> findAll() {
        return appointmentRepository.findAll();
    }
}
