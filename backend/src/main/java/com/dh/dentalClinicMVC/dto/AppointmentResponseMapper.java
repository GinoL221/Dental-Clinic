package com.dh.dentalClinicMVC.dto;

import com.dh.dentalClinicMVC.entity.Appointment;
import java.time.format.DateTimeFormatter;

public final class AppointmentResponseMapper {

  private AppointmentResponseMapper() {}

  public static AppointmentDTO toDTO(Appointment appointment) {
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
