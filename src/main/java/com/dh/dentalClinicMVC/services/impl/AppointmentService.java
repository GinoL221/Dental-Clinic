package com.dh.dentalClinicMVC.services.impl;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.services.IAppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
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
    public AppointmentDTO save(AppointmentDTO appointmentDTO) {
        // Mapear nuestras entidades como DTO a mano
        // Instanciar una entidad de turno
        Appointment appointmentEntity = new Appointment();

        // Instanciar un paciente
        Patient patientEntity = new Patient();
        patientEntity.setId(appointmentDTO.getPatient_id());

        // Instanciar un odontólogo
        Dentist dentistEntity = new Dentist();
        dentistEntity.setId(appointmentDTO.getDentist_id());

        // Seteamos el paciente y el odontólogo a nuestra entidad de turno
        appointmentEntity.setPatient(patientEntity);
        appointmentEntity.setDentist(dentistEntity);

        // Convertir el String de fecha a LocalDate
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate date = LocalDate.parse(appointmentDTO.getDate(), formatter);

        // Seteamos la fecha
        appointmentEntity.setDate(date);

        // Persistir en la BD
        appointmentEntity.save()

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
