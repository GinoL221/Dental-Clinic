package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.exception.DuplicateResourceException;
import com.dh.dentalClinicMVC.exception.InvalidStatusTransitionException;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import com.dh.dentalClinicMVC.repository.IDentistRepository;
import com.dh.dentalClinicMVC.repository.IPatientRepository;
import com.dh.dentalClinicMVC.service.IAppointmentService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class AppointmentServiceImpl implements IAppointmentService {

  private final IAppointmentRepository appointmentRepository;
  private final IDentistRepository dentistRepository;
  private final IPatientRepository patientRepository;

  public AppointmentServiceImpl(
      IAppointmentRepository appointmentRepository,
      IDentistRepository dentistRepository,
      IPatientRepository patientRepository) {
    this.appointmentRepository = appointmentRepository;
    this.dentistRepository = dentistRepository;
    this.patientRepository = patientRepository;
  }

  @Override
  @CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)
  public AppointmentDTO save(AppointmentDTO appointmentDTO) {
    Patient patient =
        patientRepository
            .findById(appointmentDTO.getPatient_id())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Paciente no encontrado con ID: " + appointmentDTO.getPatient_id()));

    Dentist dentist =
        dentistRepository
            .findById(appointmentDTO.getDentist_id())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Dentista no encontrado con ID: " + appointmentDTO.getDentist_id()));

    Appointment appointment = new Appointment();
    appointment.setPatient(patient);
    appointment.setDentist(dentist);

    ValidatedSchedule schedule =
        validateSchedule(appointmentDTO.getDate(), appointmentDTO.getTime(), null);

    if (appointmentRepository.existsByDentist_IdAndDateAndTimeAndStatusNot(
        dentist.getId(), schedule.date(), schedule.time(), AppointmentStatus.CANCELLED)) {
      throw new DuplicateResourceException("El odontólogo ya tiene un turno en esa fecha y hora");
    }

    appointment.setDate(schedule.date());
    appointment.setTime(schedule.time());
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
  @CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)
  public AppointmentDTO update(AppointmentDTO appointmentDTO) throws ResourceNotFoundException {
    Appointment existing =
        appointmentRepository
            .findById(appointmentDTO.getId())
            .orElseThrow(() -> new ResourceNotFoundException("El ID no puede ser nulo"));

    Patient patient =
        patientRepository
            .findById(appointmentDTO.getPatient_id())
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        "Paciente no encontrado con ID: " + appointmentDTO.getPatient_id()));

    Dentist dentist =
        dentistRepository
            .findById(appointmentDTO.getDentist_id())
            .orElseThrow(
                () ->
                    new ResourceNotFoundException(
                        "Dentista no encontrado con ID: " + appointmentDTO.getDentist_id()));

    existing.setPatient(patient);
    existing.setDentist(dentist);

    ValidatedSchedule schedule =
        validateSchedule(appointmentDTO.getDate(), appointmentDTO.getTime(), existing);

    if (appointmentRepository.existsByDentist_IdAndDateAndTimeAndStatusNotAndIdNot(
        dentist.getId(),
        schedule.date(),
        schedule.time(),
        AppointmentStatus.CANCELLED,
        existing.getId())) {
      throw new DuplicateResourceException("El odontólogo ya tiene un turno en esa fecha y hora");
    }

    existing.setDate(schedule.date());
    existing.setTime(schedule.time());
    existing.setDescription(appointmentDTO.getDescription());

    if (appointmentDTO.getStatus() != null) {
      try {
        existing.setStatus(AppointmentStatus.valueOf(appointmentDTO.getStatus()));
      } catch (IllegalArgumentException e) {
        existing.setStatus(AppointmentStatus.SCHEDULED);
      }
    }

    appointmentRepository.save(existing);
    return convertToDTO(existing);
  }

  private record ValidatedSchedule(LocalDate date, LocalTime time) {}

  private ValidatedSchedule validateSchedule(String dateStr, String timeStr, Appointment existing) {
    DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    LocalDate date;
    try {
      date = LocalDate.parse(dateStr, dateFormatter);
    } catch (DateTimeParseException e) {
      throw new IllegalArgumentException("Fecha inválida: " + dateStr);
    }

    LocalDate today = LocalDate.now();
    if (date.isBefore(today)) {
      throw new IllegalArgumentException("La fecha no puede ser anterior a hoy");
    }

    if (date.getDayOfWeek() == java.time.DayOfWeek.SATURDAY
        || date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
      throw new IllegalArgumentException("Solo se pueden programar citas de lunes a viernes");
    }

    DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
    LocalTime time;
    try {
      time = LocalTime.parse(timeStr, timeFormatter);
    } catch (DateTimeParseException e) {
      throw new IllegalArgumentException("Hora inválida: " + timeStr);
    }

    if (time.isBefore(LocalTime.of(8, 0)) || time.isAfter(LocalTime.of(18, 0))) {
      throw new IllegalArgumentException("La hora debe estar entre 08:00 y 18:00");
    }

    if (date.equals(today) && time.isBefore(LocalTime.now())) {
      if (existing == null
          || !(existing.getDate().equals(date) && existing.getTime().equals(time))) {
        throw new IllegalArgumentException("La hora seleccionada ya pasó");
      }
    }

    return new ValidatedSchedule(date, time);
  }

  @Override
  @CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)
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
  @CacheEvict(cacheNames = "dashboardSnapshot", allEntries = true)
  public AppointmentDTO updateStatus(Long id, AppointmentStatus status)
      throws ResourceNotFoundException {
    Appointment appointment =
        appointmentRepository
            .findById(id)
            .orElseThrow(
                () -> new ResourceNotFoundException("No se encontró el turno con id: " + id));
    if (!appointment.getStatus().canTransitionTo(status)) {
      throw new InvalidStatusTransitionException(appointment.getStatus(), status);
    }
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
  public List<AppointmentDTO> findAllForCurrentUser(String email, Role role) {
    List<Appointment> appointments;

    if (role == Role.PATIENT) {
      Patient patient =
          patientRepository
              .findByEmail(email)
              .orElseThrow(
                  () ->
                      new IllegalArgumentException(
                          "Paciente no encontrado para el usuario: " + email));
      appointments = appointmentRepository.findByPatient_Id(patient.getId());
    } else if (role == Role.DENTIST) {
      Dentist dentist =
          dentistRepository
              .findByEmail(email)
              .orElseThrow(
                  () ->
                      new IllegalArgumentException(
                          "Dentista no encontrado para el usuario: " + email));
      appointments = appointmentRepository.findByDentist_Id(dentist.getId());
    } else {
      // ADMIN: devuelve todas
      appointments = appointmentRepository.findAll();
    }

    List<AppointmentDTO> result = new ArrayList<>();
    for (Appointment appointment : appointments) {
      result.add(convertToDTO(appointment));
    }
    return result;
  }

  @Override
  public Page<AppointmentDTO> searchAppointments(
      String patient,
      String dentist,
      AppointmentStatus status,
      LocalDate fromDate,
      LocalDate toDate,
      Pageable pageable) {

    Page<Appointment> appointments;

    // --- FILTRO POR PACIENTE ---
    if (patient != null && patient.matches("\\d+")) {
      Long patientId = Long.parseLong(patient);

      // --- FILTRO POR ODONTÓLOGO ---
      if (dentist != null && dentist.matches("\\d+")) {
        Long dentistId = Long.parseLong(dentist);
        appointments =
            appointmentRepository.searchAppointmentsByPatientIdAndDentistId(
                patientId, dentistId, status, fromDate, toDate, pageable);
      } else if (dentist != null && !dentist.isEmpty()) {
        appointments =
            appointmentRepository.searchAppointmentsByPatientIdAndDentistName(
                patientId, dentist, status, fromDate, toDate, pageable);
      } else {
        appointments =
            appointmentRepository.searchAppointmentsByPatientId(
                patientId, null, status, fromDate, toDate, pageable);
      }

    } else if (patient != null && !patient.isEmpty()) {
      if (dentist != null && dentist.matches("\\d+")) {
        Long dentistId = Long.parseLong(dentist);
        appointments =
            appointmentRepository.searchAppointmentsByPatientNameAndDentistId(
                patient, dentistId, status, fromDate, toDate, pageable);
      } else if (dentist != null && !dentist.isEmpty()) {
        appointments =
            appointmentRepository.searchAppointmentsByPatientNameAndDentistName(
                patient, dentist, status, fromDate, toDate, pageable);
      } else {
        appointments =
            appointmentRepository.searchAppointmentsByPatientName(
                patient, null, status, fromDate, toDate, pageable);
      }

    } else {
      if (dentist != null && dentist.matches("\\d+")) {
        Long dentistId = Long.parseLong(dentist);
        appointments =
            appointmentRepository.searchAppointmentsByDentistId(
                dentistId, null, status, fromDate, toDate, pageable);
      } else if (dentist != null && !dentist.isEmpty()) {
        appointments =
            appointmentRepository.searchAppointmentsByDentistName(
                dentist, null, status, fromDate, toDate, pageable);
      } else {
        appointments =
            appointmentRepository.searchAppointments(
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
