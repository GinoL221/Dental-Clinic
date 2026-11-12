package com.dh.dentalClinicMVC.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.ServletWebRequest;

class GlobalExceptionHandlerValidationErrorsTest {
  private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

  private ServletWebRequest requestFor(String uri) {
    MockHttpServletRequest servletRequest = new MockHttpServletRequest("POST", uri);
    return new ServletWebRequest(servletRequest);
  }

  @SuppressWarnings("unused")
  private void stubMethod(String body) {}

  private MethodParameter stubParameter() throws NoSuchMethodException {
    return new MethodParameter(getClass().getDeclaredMethod("stubMethod", String.class), 0);
  }

  @Test
  void validationErrorsExposeFieldErrorsMapWhileMessageTextStaysUnchanged() throws Exception {
    BeanPropertyBindingResult bindingResult =
        new BeanPropertyBindingResult(new Object(), "request");
    bindingResult.addError(new FieldError("request", "email", "El email es requerido"));
    bindingResult.addError(new FieldError("request", "password", "La contraseña es requerida"));
    MethodArgumentNotValidException exception =
        new MethodArgumentNotValidException(stubParameter(), bindingResult);

    ResponseEntity<ErrorResponse> response =
        handler.handleMethodArgumentNotValid(exception, requestFor("/api/patients"));

    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    assertEquals("Datos inválidos", response.getBody().getError());
    assertEquals(
        "email: El email es requerido; password: La contraseña es requerida",
        response.getBody().getMessage());
    assertEquals(
        java.util.Map.of(
            "email", "El email es requerido", "password", "La contraseña es requerida"),
        response.getBody().getFieldErrors());
    assertEquals("/api/patients", response.getBody().getPath());
  }

  @Test
  void handlersWithoutFieldErrorsLeaveFieldErrorsNull() {
    ResponseEntity<ErrorResponse> response =
        handler.handleIllegalArgument(
            new IllegalArgumentException("bad"), requestFor("/api/patients"));

    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    assertNull(response.getBody().getFieldErrors());
  }

  @Test
  void constraintViolationReturnsStructuredBadRequestNotServerError() {
    ResponseEntity<ErrorResponse> response =
        handler.handleConstraintViolation(
            new ConstraintViolationException(
                "getDashboardSnapshot.from: must be a past date",
                java.util.Set.<jakarta.validation.ConstraintViolation<Object>>of()),
            requestFor("/api/dashboard/snapshot"));

    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    assertEquals("Datos inválidos", response.getBody().getError());
    assertEquals(400, response.getBody().getStatus());
    assertEquals("getDashboardSnapshot.from: must be a past date", response.getBody().getMessage());
    assertNull(response.getBody().getFieldErrors());
  }
}
