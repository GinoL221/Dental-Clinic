package com.dh.dentalClinicMVC.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.ServletWebRequest;

class GlobalExceptionHandlerAppointmentSlotTest {
  private static final String APPOINTMENT_CONFLICT_MESSAGE =
      "El odontólogo ya tiene un turno en esa fecha y hora";

  private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

  private ServletWebRequest requestFor(String uri) {
    MockHttpServletRequest servletRequest = new MockHttpServletRequest("POST", uri);
    return new ServletWebRequest(servletRequest);
  }

  @Test
  void activeAppointmentSlotConstraintReturnsConflictContract() {
    ResponseEntity<ErrorResponse> response =
        handler.handleDataIntegrityViolation(
            new DataIntegrityViolationException(
                "Unique index violation: UK_APPOINTMENT_ACTIVE_DENTIST_SLOT"),
            requestFor("/api/appointments"));

    assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
    assertEquals("Recurso duplicado", response.getBody().getError());
    assertEquals(APPOINTMENT_CONFLICT_MESSAGE, response.getBody().getMessage());
    assertEquals(409, response.getBody().getStatus());
    assertEquals("/api/appointments", response.getBody().getPath());
  }

  @Test
  void uniquenessViolationsReturnConflictWithErrorResponse() {
    String[][] cases = {
      {"Duplicate entry 'a@b.com' for key 'uk_user_email'", "El email ya está registrado"},
      {
        "Duplicate entry '90123456' for key 'uk_patient_card_identity'",
        "El número de documento ya está registrado"
      },
      {
        "Duplicate entry '12345' for key 'uk_dentist_registration_number'",
        "La matrícula ya está registrada"
      }
    };
    for (String[] c : cases) {
      ResponseEntity<ErrorResponse> response =
          handler.handleDataIntegrityViolation(
              new DataIntegrityViolationException(c[0]), requestFor("/api/patients"));
      assertEquals(HttpStatus.CONFLICT, response.getStatusCode(), c[0]);
      assertEquals("Recurso duplicado", response.getBody().getError(), c[0]);
      assertEquals(c[1], response.getBody().getMessage(), c[0]);
    }
  }

  @Test
  void nonUniquenessIntegrityViolationsRemainBadRequestWithErrorResponse() {
    ResponseEntity<ErrorResponse> response =
        handler.handleDataIntegrityViolation(
            new DataIntegrityViolationException(
                "not-null property references a null value: appointment.date"),
            requestFor("/api/appointments"));

    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    assertEquals("Error de datos duplicados", response.getBody().getMessage());
    assertEquals(400, response.getBody().getStatus());
  }

  @Test
  void nullIntegrityMessageRemainsSafe() {
    ResponseEntity<ErrorResponse> response =
        handler.handleDataIntegrityViolation(
            new DataIntegrityViolationException((String) null), requestFor("/api/appointments"));

    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    assertEquals("Error de datos duplicados", response.getBody().getMessage());
    assertNull(response.getBody().getFieldErrors());
    assertTrue(response.getBody().getTimestamp() != null);
  }

  @Test
  void notNullViolationMentioningEmailStaysBadRequestNotConflict() {
    ResponseEntity<ErrorResponse> response =
        handler.handleDataIntegrityViolation(
            new DataIntegrityViolationException("NULL not allowed for column \"EMAIL\""),
            requestFor("/api/patients"));

    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    assertEquals("Error de datos duplicados", response.getBody().getMessage());
  }
}
