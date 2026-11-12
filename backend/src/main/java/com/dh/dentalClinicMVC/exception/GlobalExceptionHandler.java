package com.dh.dentalClinicMVC.exception;

import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  private static final String ACTIVE_APPOINTMENT_SLOT_CONSTRAINT =
      "uk_appointment_active_dentist_slot";
  private static final String APPOINTMENT_CONFLICT_MESSAGE =
      "El odontólogo ya tiene un turno en esa fecha y hora";

  // 404 - Ruta inexistente (ningún @RequestMapping coincide con el path solicitado).
  // Sin este handler, NoResourceFoundException/NoHandlerFoundException caían en el
  // catch-all de Exception.class y se reportaban como 500, ocultando que la ruta
  // simplemente no existe.
  @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
  public ResponseEntity<ErrorResponse> handleNoHandlerFound(Exception e, WebRequest request) {
    ErrorResponse error =
        ErrorResponse.builder()
            .error("Recurso no encontrado")
            .message("La ruta solicitada no existe")
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.NOT_FOUND.value())
            .timestamp(LocalDateTime.now())
            .build();

    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
  }

  // 404 - Recurso no encontrado
  @ExceptionHandler(EntityNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleEntityNotFound(
      EntityNotFoundException e, WebRequest request) {
    ErrorResponse error =
        ErrorResponse.builder()
            .error("Recurso no encontrado")
            .message(e.getMessage())
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.NOT_FOUND.value())
            .timestamp(LocalDateTime.now())
            .build();

    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
  }

  // 409 - Violación de unicidad (turno activo, email, DNI, matrícula u otra clave única);
  // 400 - resto de las violaciones de integridad. Ambas devuelven el contrato ErrorResponse.
  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
      DataIntegrityViolationException e, WebRequest request) {
    String databaseMessage = e.getMessage() == null ? "" : e.getMessage().toLowerCase(Locale.ROOT);

    String message = "Error de datos duplicados";
    boolean uniquenessViolation = false;
    if (databaseMessage.contains(ACTIVE_APPOINTMENT_SLOT_CONSTRAINT)) {
      uniquenessViolation = true;
      message = APPOINTMENT_CONFLICT_MESSAGE;
    } else if (databaseMessage.contains("uk_user_email") || databaseMessage.contains("email")) {
      uniquenessViolation = true;
      message = "El email ya está registrado";
    } else if (databaseMessage.contains("uk_patient_card_identity")
        || databaseMessage.contains("card_identity")) {
      uniquenessViolation = true;
      message = "El número de documento ya está registrado";
    } else if (databaseMessage.contains("uk_dentist_registration_number")
        || databaseMessage.contains("registration_number")) {
      uniquenessViolation = true;
      message = "La matrícula ya está registrada";
    } else if (databaseMessage.contains("unique") || databaseMessage.contains("duplicate")) {
      uniquenessViolation = true;
    }

    HttpStatus status = uniquenessViolation ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
    ErrorResponse error =
        ErrorResponse.builder()
            .error(uniquenessViolation ? "Recurso duplicado" : "Error de integridad de datos")
            .message(message)
            .path(request.getDescription(false).replace("uri=", ""))
            .status(status.value())
            .timestamp(LocalDateTime.now())
            .build();

    return ResponseEntity.status(status).body(error);
  }

  // 401 - Credenciales incorrectas
  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ErrorResponse> handleBadCredentials(
      BadCredentialsException e, WebRequest request) {
    ErrorResponse error =
        ErrorResponse.builder()
            .error("Credenciales inválidas")
            .message("Email o contraseña incorrectos")
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.UNAUTHORIZED.value())
            .timestamp(LocalDateTime.now())
            .build();

    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
  }

  // 400 - Argumentos inválidos
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ErrorResponse> handleIllegalArgument(
      IllegalArgumentException e, WebRequest request) {
    ErrorResponse error =
        ErrorResponse.builder()
            .error("Argumento inválido")
            .message(e.getMessage())
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.BAD_REQUEST.value())
            .timestamp(LocalDateTime.now())
            .build();

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
  }

  // 400 - Bean Validation (@Valid) falla en el @RequestBody
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
      MethodArgumentNotValidException e, WebRequest request) {
    String message =
        e.getBindingResult().getFieldErrors().stream()
            .map(fieldError -> fieldError.getField() + ": " + fieldError.getDefaultMessage())
            .collect(Collectors.joining("; "));
    Map<String, String> fieldErrors = new LinkedHashMap<>();
    e.getBindingResult()
        .getFieldErrors()
        .forEach(
            fieldError -> fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage()));
    ErrorResponse error =
        ErrorResponse.builder()
            .error("Datos inválidos")
            .message(message)
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.BAD_REQUEST.value())
            .timestamp(LocalDateTime.now())
            .fieldErrors(fieldErrors)
            .build();

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
  }

  // 400 - Violación de constraints a nivel método/parámetro (bean validation fuera de @Valid).
  // Sin este handler caía en el catch-all de Exception.class y se reportaba como 500.
  @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
  public ResponseEntity<ErrorResponse> handleConstraintViolation(
      jakarta.validation.ConstraintViolationException e, WebRequest request) {
    String message =
        e.getConstraintViolations().isEmpty()
            ? e.getMessage()
            : e.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .collect(Collectors.joining("; "));
    ErrorResponse error =
        ErrorResponse.builder()
            .error("Datos inválidos")
            .message(message)
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.BAD_REQUEST.value())
            .timestamp(LocalDateTime.now())
            .build();

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
  }

  // 400 - Fecha/hora inválida (parseo)
  @ExceptionHandler(java.time.format.DateTimeParseException.class)
  public ResponseEntity<ErrorResponse> handleDateTimeParse(
      java.time.format.DateTimeParseException e, WebRequest request) {
    ErrorResponse error =
        ErrorResponse.builder()
            .error("Fecha/Hora inválida")
            .message("Formato de fecha u hora inválido: " + e.getParsedString())
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.BAD_REQUEST.value())
            .timestamp(LocalDateTime.now())
            .build();

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
  }

  // 400 - JSON malformado o cuerpo de solicitud no legible
  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(
      HttpMessageNotReadableException e, WebRequest request) {
    log.warn(
        "Malformed request body at [{}]: {}",
        request.getDescription(false),
        e.getMostSpecificCause() != null ? e.getMostSpecificCause().getMessage() : e.getMessage());
    ErrorResponse error =
        ErrorResponse.builder()
            .error("Cuerpo de solicitud inválido")
            .message("El formato del JSON es inválido o no se pudo procesar")
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.BAD_REQUEST.value())
            .timestamp(LocalDateTime.now())
            .build();

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
  }

  // 400 - Tipo de argumento / parámetro de ruta incompatible (ej: string en path variable de tipo
  // Long)
  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatch(
      MethodArgumentTypeMismatchException e, WebRequest request) {
    String paramName = e.getName();
    String requiredType =
        e.getRequiredType() != null ? e.getRequiredType().getSimpleName() : "desconocido";
    String message =
        String.format("El parámetro '%s' debe ser de tipo numérico (%s)", paramName, requiredType);

    log.warn(
        "Parameter type mismatch at [{}]: param '{}' requires type '{}'",
        request.getDescription(false),
        paramName,
        requiredType);

    ErrorResponse error =
        ErrorResponse.builder()
            .error("Tipo de parámetro inválido")
            .message(message)
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.BAD_REQUEST.value())
            .timestamp(LocalDateTime.now())
            .build();

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
  }

  // 500 - Error interno del servidor
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGenericException(Exception e, WebRequest request) {
    log.error(
        "Unhandled server exception at [{}]: {}", request.getDescription(false), e.getMessage(), e);

    // Construir una respuesta de error mínima sin stackTrace/causa para evitar filtrar información
    // interna
    ErrorResponse error =
        ErrorResponse.builder()
            .error("Error interno del servidor")
            .message("Ha ocurrido un error inesperado")
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .timestamp(LocalDateTime.now())
            .build();

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
  }

  // 404 - ResourceNotFoundException (propagada desde services)
  @ExceptionHandler(com.dh.dentalClinicMVC.exception.ResourceNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleResourceNotFound(
      com.dh.dentalClinicMVC.exception.ResourceNotFoundException e, WebRequest request) {
    ErrorResponse error =
        ErrorResponse.builder()
            .error("Recurso no encontrado")
            .message(e.getMessage())
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.NOT_FOUND.value())
            .timestamp(LocalDateTime.now())
            .build();

    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
  }

  // 403 - Acceso denegado
  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ErrorResponse> handleAccessDenied(
      AccessDeniedException e, WebRequest request) {
    ErrorResponse error =
        ErrorResponse.builder()
            .error("Acceso denegado")
            .message("No tienes permisos para realizar esta acción")
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.FORBIDDEN.value())
            .timestamp(LocalDateTime.now())
            .build();

    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
  }

  // 409 - Recurso duplicado
  @ExceptionHandler(DuplicateResourceException.class)
  public ResponseEntity<ErrorResponse> handleDuplicateResource(
      DuplicateResourceException e, WebRequest request) {
    ErrorResponse error =
        ErrorResponse.builder()
            .error("Recurso duplicado")
            .message(e.getMessage())
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.CONFLICT.value())
            .timestamp(LocalDateTime.now())
            .build();
    return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
  }

  // 409 - Transición de estado inválida
  @ExceptionHandler(InvalidStatusTransitionException.class)
  public ResponseEntity<ErrorResponse> handleInvalidStatusTransition(
      InvalidStatusTransitionException e, WebRequest request) {
    ErrorResponse error =
        ErrorResponse.builder()
            .error("Transición de estado inválida")
            .message(e.getMessage())
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.CONFLICT.value())
            .timestamp(LocalDateTime.now())
            .build();
    return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
  }

  // 401 - JWT válido pero sin fila de respaldo (users/Patient/Dentist eliminada). Mensaje
  // uniforme en todos los sitios: no debe filtrar CUÁL lookup falló (info-disclosure).
  @ExceptionHandler(StalePrincipalException.class)
  public ResponseEntity<ErrorResponse> handleStalePrincipal(
      StalePrincipalException e, WebRequest request) {
    ErrorResponse error =
        ErrorResponse.builder()
            .error("No autenticado")
            .message("La sesión ya no es válida. Iniciá sesión nuevamente.")
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.UNAUTHORIZED.value())
            .timestamp(LocalDateTime.now())
            .build();

    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
  }

  // 401 - Fila users existente con `role` nulo (fallo de integridad de datos). Mismo
  // cuerpo que handleStalePrincipal: el cliente no debe distinguir QUÉ falló.
  @ExceptionHandler(InvalidPrincipalRoleException.class)
  public ResponseEntity<ErrorResponse> handleInvalidPrincipalRole(
      InvalidPrincipalRoleException e, WebRequest request) {
    ErrorResponse error =
        ErrorResponse.builder()
            .error("No autenticado")
            .message("La sesión ya no es válida. Iniciá sesión nuevamente.")
            .path(request.getDescription(false).replace("uri=", ""))
            .status(HttpStatus.UNAUTHORIZED.value())
            .timestamp(LocalDateTime.now())
            .build();

    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
  }
}
