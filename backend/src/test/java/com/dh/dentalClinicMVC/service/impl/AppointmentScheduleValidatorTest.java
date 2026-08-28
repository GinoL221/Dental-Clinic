package com.dh.dentalClinicMVC.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.dh.dentalClinicMVC.entity.Appointment;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import org.junit.jupiter.api.Test;

class AppointmentScheduleValidatorTest {

  private static final LocalTime OPENING_TIME = LocalTime.of(8, 0);
  private static final LocalTime CLOSING_TIME = LocalTime.of(18, 0);

  private final AppointmentScheduleValidator validator = new AppointmentScheduleValidator();

  @Test
  void acceptsWeekdayAtInclusiveBusinessHourBoundaries() {
    LocalDate date = nextWeekday(LocalDate.now().plusDays(1));

    assertEquals(OPENING_TIME, validator.validateSchedule(date.toString(), "08:00", null).time());
    assertEquals(CLOSING_TIME, validator.validateSchedule(date.toString(), "18:00", null).time());
  }

  @Test
  void rejectsInvalidDateWithExactMessage() {
    IllegalArgumentException exception =
        assertThrows(
            IllegalArgumentException.class,
            () -> validator.validateSchedule("invalid-date", "10:00", null));

    assertEquals("Fecha inválida: invalid-date", exception.getMessage());
  }

  @Test
  void rejectsInvalidTimeWithExactMessage() {
    LocalDate date = nextWeekday(LocalDate.now().plusDays(1));

    IllegalArgumentException exception =
        assertThrows(
            IllegalArgumentException.class,
            () -> validator.validateSchedule(date.toString(), "invalid-time", null));

    assertEquals("Hora inválida: invalid-time", exception.getMessage());
  }

  @Test
  void rejectsPastDate() {
    assertValidationError(
        LocalDate.now().minusDays(1).toString(),
        "10:00",
        null,
        "La fecha no puede ser anterior a hoy");
  }

  @Test
  void rejectsWeekend() {
    LocalDate weekend = nextWeekend(LocalDate.now().plusDays(1));

    assertValidationError(
        weekend.toString(), "10:00", null, "Solo se pueden programar citas de lunes a viernes");
  }

  @Test
  void rejectsTimesOutsideBusinessHours() {
    LocalDate date = nextWeekday(LocalDate.now().plusDays(1));

    assertValidationError(date.toString(), "07:59", null, "La hora debe estar entre 08:00 y 18:00");
    assertValidationError(date.toString(), "18:01", null, "La hora debe estar entre 08:00 y 18:00");
  }

  @Test
  void rejectsPastTimeTodayWhenCreatingAppointment() {
    LocalDate today = LocalDate.now();
    assumeWeekdayAfterOpening(today);

    assertValidationError(today.toString(), "08:00", null, "La hora seleccionada ya pasó");
  }

  @Test
  void allowsUpdateToRetainExactPastDateAndTime() {
    LocalDate today = LocalDate.now();
    assumeWeekdayAfterOpening(today);

    Appointment existing = appointmentAt(today, OPENING_TIME);
    AppointmentScheduleValidator.ValidatedSchedule schedule =
        validator.validateSchedule(today.toString(), "08:00", existing);

    assertEquals(today, schedule.date());
    assertEquals(OPENING_TIME, schedule.time());
  }

  @Test
  void rejectsUpdateWhenPastTimeDiffersFromExistingAppointment() {
    LocalDate today = LocalDate.now();
    assumeWeekdayAfterOpening(today);

    Appointment existing = appointmentAt(today, LocalTime.of(8, 1));

    assertValidationError(today.toString(), "08:00", existing, "La hora seleccionada ya pasó");
  }

  @Test
  void preservesNaturalNullDateFailure() {
    assertThrows(NullPointerException.class, () -> validator.validateSchedule(null, "10:00", null));
  }

  @Test
  void preservesNaturalNullTimeFailure() {
    LocalDate date = nextWeekday(LocalDate.now().plusDays(1));

    assertThrows(
        NullPointerException.class, () -> validator.validateSchedule(date.toString(), null, null));
  }

  private void assertValidationError(
      String date, String time, Appointment existing, String expectedMessage) {
    IllegalArgumentException exception =
        assertThrows(
            IllegalArgumentException.class, () -> validator.validateSchedule(date, time, existing));

    assertEquals(expectedMessage, exception.getMessage());
  }

  private static Appointment appointmentAt(LocalDate date, LocalTime time) {
    Appointment appointment = new Appointment();
    appointment.setDate(date);
    appointment.setTime(time);
    return appointment;
  }

  private static void assumeWeekdayAfterOpening(LocalDate date) {
    assumeTrue(!isWeekend(date));
    assumeTrue(LocalTime.now().isAfter(OPENING_TIME));
  }

  private static LocalDate nextWeekday(LocalDate date) {
    while (isWeekend(date)) {
      date = date.plusDays(1);
    }
    return date;
  }

  private static LocalDate nextWeekend(LocalDate date) {
    while (!isWeekend(date)) {
      date = date.plusDays(1);
    }
    return date;
  }

  private static boolean isWeekend(LocalDate date) {
    return date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY;
  }
}
