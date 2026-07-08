package com.dh.dentalClinicMVC.security;

import com.dh.dentalClinicMVC.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

// Single writer of security-layer 401 bodies (design.md Decision 3). Fires for ANY
// unauthenticated request that reaches a protected (authenticated()) route — replacing
// Spring's default Http403ForbiddenEntryPoint. This covers both the stale-principal path
// (JwtAuthenticationFilter caught UsernameNotFoundException and left the request
// unauthenticated) and the pre-existing malformed/expired/absent-token path. Uniform
// message, same ErrorResponse shape as GlobalExceptionHandler.handleStalePrincipal, so the
// body never drifts between the filter layer and the controller layer.
//
// Constructor-injects the Spring-managed ObjectMapper bean (never `new ObjectMapper()`) so
// serialization of the LocalDateTime `timestamp` field behaves identically to the
// controller-layer 401s, which get JavaTimeModule support for free via HttpMessageConverter.
@Component
@RequiredArgsConstructor
public class StalePrincipalEntryPoint implements AuthenticationEntryPoint {

  private final ObjectMapper objectMapper;

  @Override
  public void commence(
      HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException authException)
      throws java.io.IOException {
    response.setStatus(HttpStatus.UNAUTHORIZED.value());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setCharacterEncoding("UTF-8");

    ErrorResponse error =
        ErrorResponse.builder()
            .error("No autenticado")
            .message("La sesión ya no es válida. Iniciá sesión nuevamente.")
            .path(request.getRequestURI())
            .status(HttpStatus.UNAUTHORIZED.value())
            .timestamp(LocalDateTime.now())
            .build();

    objectMapper.writeValue(response.getWriter(), error);
  }
}
