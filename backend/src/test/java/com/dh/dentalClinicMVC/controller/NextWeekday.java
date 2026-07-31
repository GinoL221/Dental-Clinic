package com.dh.dentalClinicMVC.controller;

import java.time.DayOfWeek;
import java.time.LocalDate;

// Appointment creation rejects Saturday/Sunday (see AppointmentServiceImpl), so any test that
// books "tomorrow" must skip weekends or it fails whenever today is a Friday or Saturday.
final class NextWeekday {
  private NextWeekday() {}

  static LocalDate fromToday() {
    LocalDate date = LocalDate.now().plusDays(1);
    while (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
      date = date.plusDays(1);
    }
    return date;
  }
}
