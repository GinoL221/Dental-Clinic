package com.dh.dentalClinicMVC.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

// Phase 3 (authz-cleanup-round-2, R3 foundation): verifies GlobalExceptionHandler's new
// StalePrincipalException -> 401 mapping. GlobalExceptionHandler has no dependencies
// (no constructor, no fields), so this is a plain unit test — no Spring context needed.
class GlobalExceptionHandlerStalePrincipalTest {

  @Test
  void handleStalePrincipal_returns401WithUniformMessage() {
    GlobalExceptionHandler handler = new GlobalExceptionHandler();
    WebRequest request = new ServletWebRequest(new MockHttpServletRequest("GET", "/patients/1"));

    ResponseEntity<ErrorResponse> response =
        handler.handleStalePrincipal(new StalePrincipalException(), request);

    assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    ErrorResponse body = response.getBody();
    assertNotNull(body);
    assertEquals("No autenticado", body.getError());
    assertEquals("La sesión ya no es válida. Iniciá sesión nuevamente.", body.getMessage());
    assertEquals(401, body.getStatus());
    assertEquals("/patients/1", body.getPath());
    assertNotNull(body.getTimestamp());
  }
}
