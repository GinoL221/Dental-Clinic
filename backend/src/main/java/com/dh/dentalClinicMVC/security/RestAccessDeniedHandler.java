package com.dh.dentalClinicMVC.security;

import com.dh.dentalClinicMVC.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/**
 * Writes the {@link ErrorResponse} JSON contract for URL-level authorization denials
 * (authorizeHttpRequests rules). Method-level denials (@PreAuthorize) surface as
 * AccessDeniedException inside the DispatcherServlet and are handled by GlobalExceptionHandler with
 * the same body shape.
 */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

  private final ObjectMapper objectMapper;

  public RestAccessDeniedHandler(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void handle(
      HttpServletRequest request, HttpServletResponse response, AccessDeniedException e)
      throws IOException {
    ErrorResponse error =
        ErrorResponse.builder()
            .error("Acceso denegado")
            .message("No tienes permisos para realizar esta acción")
            .path(request.getRequestURI())
            .status(HttpStatus.FORBIDDEN.value())
            .timestamp(LocalDateTime.now())
            .build();

    response.setStatus(HttpStatus.FORBIDDEN.value());
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    objectMapper.writeValue(response.getWriter(), error);
  }
}
