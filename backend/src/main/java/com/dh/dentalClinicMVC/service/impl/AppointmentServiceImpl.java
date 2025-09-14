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
                .orElseThrow(
                        () -> new RuntimeException("Paciente no encontrado con ID: " + appointmentDTO.getPatient_id()));

        Dentist dentist = dentistRepository.findById(appointmentDTO.getDentist_id())
                .orElseThrow(
                        () -> new RuntimeException("Dentista no encontrado con ID: " + appointmentDTO.getDentist_id()));

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDentist(dentist);

        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate date = LocalDate.parse(appointmentDTO.getDate(), dateFormatter);

        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        LocalTime time = LocalTime.parse(appointmentDTO.getTime(), timeFormatter);

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

            Patient patient = patientRepository.findById(appointmentDTO.getPatient_id())
                    .orElseThrow(() -> new RuntimeException(
                            "Paciente no encontrado con ID: " + appointmentDTO.getPatient_id()));

            Dentist dentist = dentistRepository.findById(appointmentDTO.getDentist_id())
                    .orElseThrow(() -> new RuntimeException(
                            "Dentista no encontrado con ID: " + appointmentDTO.getDentist_id()));

            // Setear las entidades
            appointmentEntity.get().setPatient(patient);
            appointmentEntity.get().setDentist(dentist);

            // Convertir fecha y hora
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate date = LocalDate.parse(appointmentDTO.getDate(), dateFormatter);

            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            LocalTime time = LocalTime.parse(appointmentDTO.getTime(), timeFormatter);

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
                .time(appointment.getTime().toString())
                .description(appointment.getDescription())
                .status(appointment.getStatus().name())
                .build();
    }
}
