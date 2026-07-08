package com.dh.dentalClinicMVC.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.dh.dentalClinicMVC.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.InsufficientAuthenticationException;

// Phase 4 (authz-cleanup-round-2, R3 wiring): StalePrincipalEntryPoint is the single
// writer of security-layer 401 bodies (design.md Decision 3). It constructor-injects the
// Spring-managed ObjectMapper (not `new ObjectMapper()`) so LocalDateTime serialization
// (JavaTimeModule) behaves identically to the controller-layer 401s. `findAndRegisterModules()`
// mirrors Spring Boot's auto-configured ObjectMapper module discovery without needing a full
// Spring context for this pure-write-logic unit test.
class StalePrincipalEntryPointTest {

  private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
  private final StalePrincipalEntryPoint entryPoint = new StalePrincipalEntryPoint(objectMapper);

  @Test
  void commenceWrites401JsonUtf8ErrorResponseBody() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/patients/1");
    MockHttpServletResponse response = new MockHttpServletResponse();

    entryPoint.commence(
        request,
        response,
        new InsufficientAuthenticationException("Full authentication is required"));

    assertEquals(401, response.getStatus());
    assertTrue(
        response.getContentType() != null
            && response.getContentType().startsWith(MediaType.APPLICATION_JSON_VALUE),
        "Content-Type must be application/json, was " + response.getContentType());
    assertEquals("UTF-8", response.getCharacterEncoding());

    ErrorResponse body = objectMapper.readValue(response.getContentAsString(), ErrorResponse.class);
    assertEquals("No autenticado", body.getError());
    assertEquals("La sesión ya no es válida. Iniciá sesión nuevamente.", body.getMessage());
    assertEquals(401, body.getStatus());
    assertEquals("/patients/1", body.getPath());
    assertNotNull(body.getTimestamp());
  }

  @Test
  void commenceUsesTheActualRequestUriForThePathFieldNotAHardcodedValue() throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/appointments/99");
    MockHttpServletResponse response = new MockHttpServletResponse();

    entryPoint.commence(
        request,
        response,
        new InsufficientAuthenticationException("Full authentication is required"));

    ErrorResponse body = objectMapper.readValue(response.getContentAsString(), ErrorResponse.class);
    assertEquals("/appointments/99", body.getPath());
  }
}
