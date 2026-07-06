package com.dh.dentalClinicMVC.entity;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class AppointmentStatusTest {

  @Test
  void testScheduledTransitions() {
    AppointmentStatus from = AppointmentStatus.SCHEDULED;
    assertTrue(
        from.canTransitionTo(AppointmentStatus.SCHEDULED),
        "SCHEDULED -> SCHEDULED should be allowed (no-op)");
    assertTrue(
        from.canTransitionTo(AppointmentStatus.IN_PROGRESS),
        "SCHEDULED -> IN_PROGRESS should be allowed");
    assertTrue(
        from.canTransitionTo(AppointmentStatus.COMPLETED),
        "SCHEDULED -> COMPLETED should be allowed");
    assertTrue(
        from.canTransitionTo(AppointmentStatus.CANCELLED),
        "SCHEDULED -> CANCELLED should be allowed");
  }

  @Test
  void testInProgressTransitions() {
    AppointmentStatus from = AppointmentStatus.IN_PROGRESS;
    assertFalse(
        from.canTransitionTo(AppointmentStatus.SCHEDULED),
        "IN_PROGRESS -> SCHEDULED should be forbidden");
    assertTrue(
        from.canTransitionTo(AppointmentStatus.IN_PROGRESS),
        "IN_PROGRESS -> IN_PROGRESS should be allowed (no-op)");
    assertTrue(
        from.canTransitionTo(AppointmentStatus.COMPLETED),
        "IN_PROGRESS -> COMPLETED should be allowed");
    assertTrue(
        from.canTransitionTo(AppointmentStatus.CANCELLED),
        "IN_PROGRESS -> CANCELLED should be allowed");
  }

  @Test
  void testCompletedTransitions() {
    AppointmentStatus from = AppointmentStatus.COMPLETED;
    assertFalse(
        from.canTransitionTo(AppointmentStatus.SCHEDULED),
        "COMPLETED -> SCHEDULED should be forbidden");
    assertFalse(
        from.canTransitionTo(AppointmentStatus.IN_PROGRESS),
        "COMPLETED -> IN_PROGRESS should be forbidden");
    assertTrue(
        from.canTransitionTo(AppointmentStatus.COMPLETED),
        "COMPLETED -> COMPLETED should be allowed (no-op)");
    assertFalse(
        from.canTransitionTo(AppointmentStatus.CANCELLED),
        "COMPLETED -> CANCELLED should be forbidden");
  }

  @Test
  void testCancelledTransitions() {
    AppointmentStatus from = AppointmentStatus.CANCELLED;
    assertFalse(
        from.canTransitionTo(AppointmentStatus.SCHEDULED),
        "CANCELLED -> SCHEDULED should be forbidden");
    assertFalse(
        from.canTransitionTo(AppointmentStatus.IN_PROGRESS),
        "CANCELLED -> IN_PROGRESS should be forbidden");
    assertFalse(
        from.canTransitionTo(AppointmentStatus.COMPLETED),
        "CANCELLED -> COMPLETED should be forbidden");
    assertTrue(
        from.canTransitionTo(AppointmentStatus.CANCELLED),
        "CANCELLED -> CANCELLED should be allowed (no-op)");
  }
}
