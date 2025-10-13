package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.service.IAppointmentService;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

@Service
public class AppointmentServiceImpl implements IAppointmentService {

    private final IAppointmentRepository appointmentRepository;
    private final IDentistRepository dentistRepository;
    private final IPatientRepository patientRepository;

    @Autowired
    public AppointmentServiceImpl(IAppointmentRepository appointmentRepository, IDentistRepository dentistRepository,
            IPatientRepository patientRepository) {
        this.appointmentRepository = appointmentRepository;
        this.dentistRepository = dentistRepository;
        this.patientRepository = patientRepository;
    }

    @Override
    public AppointmentDTO save(AppointmentDTO appointmentDTO) {
    Patient patient = patientRepository.findById(appointmentDTO.getPatient_id())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
            "Paciente no encontrado con ID: " + appointmentDTO.getPatient_id()));

    Dentist dentist = dentistRepository.findById(appointmentDTO.getDentist_id())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
            "Dentista no encontrado con ID: " + appointmentDTO.getDentist_id()));

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDentist(dentist);

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate date;
        try {
            date = LocalDate.parse(appointmentDTO.getDate(), dateFormatter);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fecha inválida: " + appointmentDTO.getDate());
        }

        // Validación: al crear permitimos hoy
        LocalDate today = LocalDate.now();
        if (date.isBefore(today)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha no puede ser anterior a hoy");
        }

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        LocalTime time;
        try {
            time = LocalTime.parse(appointmentDTO.getTime(), timeFormatter);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hora inválida: " + appointmentDTO.getTime());
        }

        appointment.setDate(date);
        appointment.setTime(time);
        appointment.setDescription(appointmentDTO.getDescription());

        if (appointmentDTO.getStatus() != null) {
            try {
                appointment.setStatus(AppointmentStatus.valueOf(appointmentDTO.getStatus()));
            } catch (IllegalArgumentException e) {
                appointment.setStatus(AppointmentStatus.SCHEDULED);
            }
        } else {
            appointment.setStatus(AppointmentStatus.SCHEDULED); // Default
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);
        return convertToDTO(savedAppointment);
    }

    @Override
    public Optional<AppointmentDTO> findById(Long id) {
        Optional<Appointment> appointment = appointmentRepository.findById(id);

        if (appointment.isPresent()) {
            return Optional.of(convertToDTO(appointment.get()));
        }
        return Optional.empty();
    }

    @Override
    public AppointmentDTO update(AppointmentDTO appointmentDTO) throws ResourceNotFoundException {
        if (appointmentRepository.findById(appointmentDTO.getId()).isPresent()) {
            Optional<Appointment> appointmentEntity = appointmentRepository.findById(appointmentDTO.getId());

            Optional<Patient> patientOptional = patientRepository.findById(appointmentDTO.getPatient_id());
            if (!patientOptional.isPresent()) {
                throw new ResourceNotFoundException("Paciente no encontrado con ID: " + appointmentDTO.getPatient_id());
            }
            Patient patient = patientOptional.get();

            Optional<Dentist> dentistOptional = dentistRepository.findById(appointmentDTO.getDentist_id());
            if (!dentistOptional.isPresent()) {
                throw new ResourceNotFoundException("Dentista no encontrado con ID: " + appointmentDTO.getDentist_id());
            }
            Dentist dentist = dentistOptional.get();

            // Setear las entidades
            appointmentEntity.get().setPatient(patient);
            appointmentEntity.get().setDentist(dentist);

            // Convertir fecha y hora
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate date;
            try {
                date = LocalDate.parse(appointmentDTO.getDate(), dateFormatter);
            } catch (DateTimeParseException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fecha inválida: " + appointmentDTO.getDate());
            }

            // Validación: al editar permitimos "hoy", pero no fechas anteriores
            LocalDate today = LocalDate.now();
            if (date.isBefore(today)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha no puede ser anterior a hoy");
            }

            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            LocalTime time;
            try {
                time = LocalTime.parse(appointmentDTO.getTime(), timeFormatter);
            } catch (DateTimeParseException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hora inválida: " + appointmentDTO.getTime());
            }

            appointmentEntity.get().setDate(date);
            appointmentEntity.get().setTime(time);
            appointmentEntity.get().setDescription(appointmentDTO.getDescription());

            if (appointmentDTO.getStatus() != null) {
                try {
                    appointmentEntity.get().setStatus(AppointmentStatus.valueOf(appointmentDTO.getStatus()));
                } catch (IllegalArgumentException e) {
                    appointmentEntity.get().setStatus(AppointmentStatus.SCHEDULED);
                }
            }

            appointmentRepository.save(appointmentEntity.get());

            // Usar el método convertToDTO que ya tienes
            return convertToDTO(appointmentEntity.get());
        } else {
            throw new ResourceNotFoundException("El ID no puede ser nulo");
        }
    }

    @Override
    public Optional<AppointmentDTO> delete(Long id) throws ResourceNotFoundException {
        Optional<Appointment> appointment = appointmentRepository.findById(id);

        if (appointment.isPresent()) {
            AppointmentDTO appointmentDTO = convertToDTO(appointment.get());
            appointmentRepository.deleteById(id);
            return Optional.of(appointmentDTO);
        } else {
            throw new ResourceNotFoundException("No se encontró el turno con id: " + id);
        }
    }

    @Override
    public AppointmentDTO updateStatus(Long id, AppointmentStatus status) throws ResourceNotFoundException {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró el turno con id: " + id));
        appointment.setStatus(status);
        Appointment saved = appointmentRepository.save(appointment);
        return convertToDTO(saved);
    }

    @Override
    public List<AppointmentDTO> findAll() {
        List<Appointment> appointments = appointmentRepository.findAll();
        List<AppointmentDTO> appointmentDTOs = new ArrayList<>();

        for (Appointment appointment : appointments) {
            appointmentDTOs.add(convertToDTO(appointment));
        }
        return appointmentDTOs;
    }

    @Override
    public Page<AppointmentDTO> searchAppointments(String patient, String dentist, AppointmentStatus status,
            LocalDate fromDate, LocalDate toDate, Pageable pageable) {

        Page<Appointment> appointments;

        // --- FILTRO POR PACIENTE ---
        if (patient != null && patient.matches("\\d+")) {
            Long patientId = Long.parseLong(patient);

            // --- FILTRO POR ODONTÓLOGO ---
            if (dentist != null && dentist.matches("\\d+")) {
                Long dentistId = Long.parseLong(dentist);
                appointments = appointmentRepository.searchAppointmentsByPatientIdAndDentistId(
                        patientId, dentistId, status, fromDate, toDate, pageable);
            } else if (dentist != null && !dentist.isEmpty()) {
                appointments = appointmentRepository.searchAppointmentsByPatientIdAndDentistName(
                        patientId, dentist, status, fromDate, toDate, pageable);
            } else {
                appointments = appointmentRepository.searchAppointmentsByPatientId(
                        patientId, null, status, fromDate, toDate, pageable);
            }

        } else if (patient != null && !patient.isEmpty()) {
            if (dentist != null && dentist.matches("\\d+")) {
                Long dentistId = Long.parseLong(dentist);
                appointments = appointmentRepository.searchAppointmentsByPatientNameAndDentistId(
                        patient, dentistId, status, fromDate, toDate, pageable);
            } else if (dentist != null && !dentist.isEmpty()) {
                appointments = appointmentRepository.searchAppointmentsByPatientNameAndDentistName(
                        patient, dentist, status, fromDate, toDate, pageable);
            } else {
                appointments = appointmentRepository.searchAppointmentsByPatientName(
                        patient, null, status, fromDate, toDate, pageable);
            }

        } else {
            if (dentist != null && dentist.matches("\\d+")) {
                Long dentistId = Long.parseLong(dentist);
                appointments = appointmentRepository.searchAppointmentsByDentistId(
                        dentistId, null, status, fromDate, toDate, pageable);
            } else if (dentist != null && !dentist.isEmpty()) {
                appointments = appointmentRepository.searchAppointmentsByDentistName(
                        dentist, null, status, fromDate, toDate, pageable);
            } else {
                appointments = appointmentRepository.searchAppointments(
                        null, null, status, fromDate, toDate, pageable);
            }
        }

        return appointments.map(this::convertToDTO);
    }

    // Método para convertir a DTO
    private AppointmentDTO convertToDTO(Appointment appointment) {
        return AppointmentDTO.builder()
                .id(appointment.getId())
                .patient_id(appointment.getPatient().getId())
                .dentist_id(appointment.getDentist().getId())
                .date(appointment.getDate().toString())
                .time(appointment.getTime().format(DateTimeFormatter.ofPattern("HH:mm")))
                .description(appointment.getDescription())
                .status(appointment.getStatus().name())
                .build();
    }
}
