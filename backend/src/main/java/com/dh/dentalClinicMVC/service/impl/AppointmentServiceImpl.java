package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.service.IAppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
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
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate date = LocalDate.parse(appointmentDTO.getDate(), dateFormatter);

        // Convertir el String de hora a LocalTime
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        LocalTime time = LocalTime.parse(appointmentDTO.getTime(), timeFormatter);

        // Seteamos la fecha y hora
        appointmentEntity.setDate(date);
        appointmentEntity.setTime(time);
        
        // Setear la descripción
        appointmentEntity.setDescription(appointmentDTO.getDescription());

        // Persistir en la BD
        appointmentRepository.save(appointmentEntity);

        // Vamos a trabajar con el DTO que debemos devolver
        // Generar una instancia de turno DTO
        AppointmentDTO appointmentDTOToReturn = new AppointmentDTO();

        // Le seteamos los datos de la entidad que persistimos
        appointmentDTOToReturn.setId(appointmentEntity.getId());
        appointmentDTOToReturn.setDate(appointmentEntity.getDate().toString());
        appointmentDTOToReturn.setTime(appointmentEntity.getTime().toString());
        appointmentDTOToReturn.setDentist_id(appointmentEntity.getDentist().getId());
        appointmentDTOToReturn.setPatient_id(appointmentEntity.getPatient().getId());
        appointmentDTOToReturn.setDescription(appointmentDTO.getDescription());

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
            appointmentDTOToReturn.setTime(appointment.getTime().toString());
            appointmentDTOToReturn.setDescription(appointment.getDescription());

            appointmentDTO = Optional.of(appointmentDTOToReturn);
        }
        return appointmentDTO;
    }

    @Override
    public AppointmentDTO update(AppointmentDTO appointmentDTO) throws ResourceNotFoundException {
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
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate date = LocalDate.parse(appointmentDTO.getDate(), dateFormatter);

            // Convertir el String de hora a LocalTime
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            LocalTime time = LocalTime.parse(appointmentDTO.getTime(), timeFormatter);

            // Seteamos la fecha, hora y descripción
            appointmentEntity.get().setDate(date);
            appointmentEntity.get().setTime(time);
            appointmentEntity.get().setDescription(appointmentDTO.getDescription());

            // Persistir en la BD
            appointmentRepository.save(appointmentEntity.get());

            // Trabajar sobre el DTO a devolver
            AppointmentDTO appointmentDTOToReturn = new AppointmentDTO();
            appointmentDTOToReturn.setId(appointmentEntity.get().getId());
            appointmentDTOToReturn.setDentist_id(appointmentEntity.get().getDentist().getId());
            appointmentDTOToReturn.setPatient_id(appointmentEntity.get().getPatient().getId());
            appointmentDTOToReturn.setDate(appointmentEntity.get().getDate().toString());
            appointmentDTOToReturn.setTime(appointmentEntity.get().getTime().toString());
            appointmentDTOToReturn.setDescription(appointmentEntity.get().getDescription());

            return appointmentDTOToReturn;
        } else {
            throw new ResourceNotFoundException("El ID no puede ser nulo");
        }
    }

    @Override
    public Optional<AppointmentDTO> delete(Long id) throws ResourceNotFoundException {
        Optional<Appointment> appointmentToLookFor = appointmentRepository.findById(id);

        Optional<AppointmentDTO> appointmentDTO;

        if (appointmentToLookFor.isPresent()) {
            Appointment appointment = appointmentToLookFor.get();

            AppointmentDTO appointmentDTOToReturn = new AppointmentDTO();
            appointmentDTOToReturn.setId(appointment.getId());
            appointmentDTOToReturn.setDentist_id(appointment.getDentist().getId());
            appointmentDTOToReturn.setPatient_id(appointment.getPatient().getId());
            appointmentDTOToReturn.setDate(appointment.getDate().toString());

            appointmentDTO = Optional.of(appointmentDTOToReturn);
            return appointmentDTO;
        } else {
            throw new ResourceNotFoundException("No se encontró el turno con id: " + id);
        }
    }

    @Override
    public List<AppointmentDTO> findAll() {
        List<Appointment> appointments = appointmentRepository.findAll();

        List<AppointmentDTO> appointmentDTOs = new ArrayList<>();

        for (Appointment appointment : appointments) {
            appointmentDTOs.add(new AppointmentDTO(appointment.getId(), appointment.getDentist().getId(),
                    appointment.getPatient().getId(), appointment.getDate().toString(), 
                    appointment.getTime().toString(), appointment.getDescription()));
        }
        return appointmentDTOs;
    }
}
