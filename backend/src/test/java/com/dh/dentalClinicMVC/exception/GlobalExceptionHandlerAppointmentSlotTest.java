package com.dh.dentalClinicMVC.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class GlobalExceptionHandlerAppointmentSlotTest {
  private static final String APPOINTMENT_CONFLICT_MESSAGE =
      "El odontólogo ya tiene un turno en esa fecha y hora";

  private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

  @Test
  void activeAppointmentSlotConstraintReturnsConflictContract() {
    ResponseEntity<String> response =
        handler.handleDataIntegrityViolation(
            new DataIntegrityViolationException(
                "Unique index violation: UK_APPOINTMENT_ACTIVE_DENTIST_SLOT"));

    assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
    assertEquals(APPOINTMENT_CONFLICT_MESSAGE, response.getBody());
  }

  @Test
  void identityIntegrityViolationsRemainBadRequest() {
    ResponseEntity<String> emailResponse =
        handler.handleDataIntegrityViolation(
            new DataIntegrityViolationException("Duplicate key for email"));
    ResponseEntity<String> cardResponse =
        handler.handleDataIntegrityViolation(
            new DataIntegrityViolationException("Duplicate key for card_identity"));

    assertEquals(HttpStatus.BAD_REQUEST, emailResponse.getStatusCode());
    assertEquals("El email ya está registrado", emailResponse.getBody());
    assertEquals(HttpStatus.BAD_REQUEST, cardResponse.getStatusCode());
    assertEquals("El número de documento ya está registrado", cardResponse.getBody());
  }

  @Test
  void nullIntegrityMessageRemainsSafe() {
    ResponseEntity<String> response =
        handler.handleDataIntegrityViolation(new DataIntegrityViolationException((String) null));

    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    assertEquals("Error de datos duplicados", response.getBody());
  }
}
