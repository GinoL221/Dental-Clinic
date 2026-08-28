package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.entity.Appointment;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.repository.IAppointmentRepository;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

@Component
public final class AppointmentSearchQuery {

  private final IAppointmentRepository appointmentRepository;

  public AppointmentSearchQuery(IAppointmentRepository appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  public Page<Appointment> find(
      String patient,
      String dentist,
      AppointmentStatus status,
      LocalDate fromDate,
      LocalDate toDate,
      Pageable pageable) {
    if (patient != null && patient.matches("\\d+")) {
      Long patientId = Long.parseLong(patient);
      if (dentist != null && dentist.matches("\\d+")) {
        Long dentistId = Long.parseLong(dentist);
        return appointmentRepository.searchAppointmentsByPatientIdAndDentistId(
            patientId, dentistId, status, fromDate, toDate, pageable);
      } else if (dentist != null && !dentist.isEmpty()) {
        return appointmentRepository.searchAppointmentsByPatientIdAndDentistName(
            patientId, dentist, status, fromDate, toDate, pageable);
      } else {
        return appointmentRepository.searchAppointmentsByPatientId(
            patientId, null, status, fromDate, toDate, pageable);
      }
    } else if (patient != null && !patient.isEmpty()) {
      if (dentist != null && dentist.matches("\\d+")) {
        Long dentistId = Long.parseLong(dentist);
        return appointmentRepository.searchAppointmentsByPatientNameAndDentistId(
            patient, dentistId, status, fromDate, toDate, pageable);
      } else if (dentist != null && !dentist.isEmpty()) {
        return appointmentRepository.searchAppointmentsByPatientNameAndDentistName(
            patient, dentist, status, fromDate, toDate, pageable);
      } else {
        return appointmentRepository.searchAppointmentsByPatientName(
            patient, null, status, fromDate, toDate, pageable);
      }
    } else {
      if (dentist != null && dentist.matches("\\d+")) {
        Long dentistId = Long.parseLong(dentist);
        return appointmentRepository.searchAppointmentsByDentistId(
            dentistId, null, status, fromDate, toDate, pageable);
      } else if (dentist != null && !dentist.isEmpty()) {
        return appointmentRepository.searchAppointmentsByDentistName(
            dentist, null, status, fromDate, toDate, pageable);
      } else {
        return appointmentRepository.searchAppointments(
            null, null, status, fromDate, toDate, pageable);
      }
    }
  }
}
