package com.dh.dentalClinicMVC.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

// appointment-role-null-hardening, Phase 1: verifies GlobalExceptionHandler's new
// InvalidPrincipalRoleException -> 401 mapping. Mirrors GlobalExceptionHandlerStalePrincipalTest
// (byte-identical response body per design.md A5) but is a distinct exception type/handler.
class GlobalExceptionHandlerInvalidRoleTest {

  @Test
  void handleInvalidPrincipalRole_returns401WithUniformMessage() {
    GlobalExceptionHandler handler = new GlobalExceptionHandler();
    WebRequest request = new ServletWebRequest(new MockHttpServletRequest("GET", "/appointments"));

    ResponseEntity<ErrorResponse> response =
        handler.handleInvalidPrincipalRole(new InvalidPrincipalRoleException(), request);

    assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    ErrorResponse body = response.getBody();
    assertNotNull(body);
    assertEquals("No autenticado", body.getError());
    assertEquals("La sesión ya no es válida. Iniciá sesión nuevamente.", body.getMessage());
    assertEquals(401, body.getStatus());
    assertEquals("/appointments", body.getPath());
    assertNotNull(body.getTimestamp());
  }
}
