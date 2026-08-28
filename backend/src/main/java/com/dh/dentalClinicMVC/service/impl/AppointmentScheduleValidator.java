package com.dh.dentalClinicMVC.service.impl;

import com.dh.dentalClinicMVC.entity.Appointment;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import org.springframework.stereotype.Component;

@Component
public final class AppointmentScheduleValidator {

  public record ValidatedSchedule(LocalDate date, LocalTime time) {}

  public ValidatedSchedule validateSchedule(String dateStr, String timeStr, Appointment existing) {
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
}
