package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.service.IAppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AppointmentServiceImpl implements IAppointmentService {

    private IAppointmentRepository appointmentRepository;

    @Autowired
    public AppointmentServiceImpl(IAppointmentRepository appointmentRepository) {
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
        appointmentRepository.save(appointmentEntity);

        // Vamos a trabajar con el DTO que debemos devolver
        // Generar una instancia de turno DTO
        AppointmentDTO appointmentDTOToReturn = new AppointmentDTO();

        // Le seteamos los datos de la entidad que persistimos
        appointmentDTOToReturn.setId(appointmentEntity.getId());
        appointmentDTOToReturn.setDate(appointmentEntity.getDate().toString());
        appointmentDTOToReturn.setDentist_id(appointmentEntity.getDentist().getId());
        appointmentDTOToReturn.setPatient_id(appointmentEntity.getPatient().getId());

        return appointmentDTOToReturn;
    }

    @Override
    public Optional<AppointmentDTO> findById(Long id) {
        // Vamos a buscar la entidad por ID a la BD
        Optional<Appointment> appointmentToLookFor = appointmentRepository.findById(id);

        // Instanciamos el DTO
        Optional<AppointmentDTO> appointmentDTO = Optional.empty();

        if (appointmentToLookFor.isPresent()) {
            // Recuperar la entidad que se encontró y guardarla en la variable appointment
            Appointment appointment = appointmentToLookFor.get();

            // Trabajar en la información que tenemos que devolver: DTO
            // Vamos a crear una instancia de turno DTO para devolver
            AppointmentDTO appointmentDTOToReturn = new AppointmentDTO();
            appointmentDTOToReturn.setId(appointment.getId());
            appointmentDTOToReturn.setDentist_id(appointment.getDentist().getId());
            appointmentDTOToReturn.setPatient_id(appointment.getPatient().getId());
            appointmentDTOToReturn.setDate(appointment.getDate().toString());

            appointmentDTO = Optional.of(appointmentDTOToReturn);
        }
        return appointmentDTO;
    }

    @Override
    public AppointmentDTO update(AppointmentDTO appointmentDTO) throws Exception {
        // Chequeo que es tueno a actualizar exista
        if (appointmentRepository.findById(appointmentDTO.getId()).isPresent()) {
            // Buscar la entidad en la BD
            Optional<Appointment> appointmentEntity = appointmentRepository.findById(appointmentDTO.getId());

            // Instanciar un paciente
            Patient patientEntity = new Patient();
            patientEntity.setId(appointmentDTO.getPatient_id());

            // Instanciar un odontólogo
            Dentist dentistEntity = new Dentist();
            dentistEntity.setId(appointmentDTO.getDentist_id());

            // Seteamos el paciente y el odontólogo a nuestra entidad de turno
            appointmentEntity.get().setPatient(patientEntity);
            appointmentEntity.get().setDentist(dentistEntity);

            // Convertir el String de fecha a LocalDate
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate date = LocalDate.parse(appointmentDTO.getDate(), formatter);

            // Seteamos la fecha
            appointmentEntity.get().setDate(date);

            // Persistir en la BD
            appointmentRepository.save(appointmentEntity.get());

            // Vamos a trabajar sobre el DTO a devolver
            AppointmentDTO appointmentDTOToReturn = new AppointmentDTO();
            appointmentDTOToReturn.setId(appointmentEntity.get().getId());
            appointmentDTOToReturn.setDentist_id(appointmentEntity.get().getDentist().getId());
            appointmentDTOToReturn.setPatient_id(appointmentEntity.get().getPatient().getId());
            appointmentDTOToReturn.setDate(appointmentEntity.get().getDate().toString());

            return appointmentDTOToReturn;
        } else {
            throw new Exception("El ID no puede ser nulo");
        }
    }

    @Override
    public void delete(Long id) {
        if (appointmentRepository.existsById(id)) {
            appointmentRepository.deleteById(id);
        } else {
            throw new IllegalArgumentException("El turno con Id:" + id + " no existe");
        }
    }

    @Override
    public List<AppointmentDTO> findAll() {
        // Vamos a traernos las entidades de la BD y la vamos a guardar en una lista
        List<Appointment> appointments = appointmentRepository.findAll();

        // Vamos a crear una lista vacía de turnos DTO
        List<AppointmentDTO> appointmentDTOs = new ArrayList<>();

        // Recorremos la lista de entidades de turno para luego guardarlas en la lista de turnos DTO
        for (Appointment appointment : appointments) {
            appointmentDTOs.add(new AppointmentDTO(appointment.getId(), appointment.getPatient().getId(),
                    appointment.getDentist().getId(), appointment.getDate().toString()));
        }
        return appointmentDTOs;
    }
}
