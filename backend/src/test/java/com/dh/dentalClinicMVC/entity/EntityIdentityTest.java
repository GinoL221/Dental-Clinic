package com.dh.dentalClinicMVC.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

/**
 * Pins the id-based identity contract on JPA entities: equality depends only on the database id,
 * never on mutable/lazy field contents, and null-id (transient) entities are never equal.
 */
class EntityIdentityTest {

  @Test
  void patientsWithSameIdAreEqualRegardlessOfCollectionContents() {
    Patient a = new Patient();
    a.setId(7L);
    a.setAdmissionDate(LocalDate.of(2024, 1, 1));
    a.getAppointments().add(new Appointment());

    Patient b = new Patient();
    b.setId(7L);
    b.setAdmissionDate(LocalDate.of(2025, 6, 30));
    b.getAppointments().add(new Appointment());
    b.getAppointments().add(new Appointment());

    assertEquals(a, b, "same id must be equal even with different collection contents");
    assertEquals(a.hashCode(), b.hashCode(), "equal entities must have equal hash codes");
    assertEquals(b, a, "equality must be symmetric");
  }

  @Test
  void patientsWithNullIdsAreNeverEqual() {
    Patient a = new Patient();
    Patient b = new Patient();

    assertNotEquals(a, b, "two transient entities without ids must not be equal");
  }

  @Test
  void dentistAndPatientWithSameIdAreNotEqual() {
    Dentist dentist = new Dentist();
    dentist.setId(7L);

    Patient patient = new Patient();
    patient.setId(7L);

    assertNotEquals(dentist, patient, "same id but different concrete classes must not be equal");
  }
}
