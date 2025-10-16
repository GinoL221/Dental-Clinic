package com.dh.dentalClinicMVC.exception;

import org.hibernate.exception.ConstraintViolationException;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import jakarta.persistence.EntityNotFoundException;

import java.sql.SQLIntegrityConstraintViolationException;
import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {
    // 404 - Recurso no encontrado
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(EntityNotFoundException e, WebRequest request) {
        ErrorResponse error = ErrorResponse.builder().error("Recurso no encontrado").message(e.getMessage()).path(request.getDescription(false).replace("uri=", "")).status(HttpStatus.NOT_FOUND.value()).timestamp(LocalDateTime.now()).build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    // 400 - Error de integridad de datos (email duplicado, DNI duplicado, etc.)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<String> handleDataIntegrityViolation(DataIntegrityViolationException e) {
        String message = "Error de datos duplicados";
        if (e.getMessage().contains("email")) {
            message = "El email ya está registrado";
        } else if (e.getMessage().contains("card_identity")) {
            message = "El número de documento ya está registrado";
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(message);
    }

    // 401 - Credenciales incorrectas
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException e, WebRequest request) {
        ErrorResponse error = ErrorResponse.builder().error("Credenciales inválidas").message("Email o contraseña incorrectos").path(request.getDescription(false).replace("uri=", "")).status(HttpStatus.UNAUTHORIZED.value()).timestamp(LocalDateTime.now()).build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    // 400 - Argumentos inválidos
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException e, WebRequest request) {
        ErrorResponse error = ErrorResponse.builder().error("Argumento inválido").message(e.getMessage()).path(request.getDescription(false).replace("uri=", "")).status(HttpStatus.BAD_REQUEST.value()).timestamp(LocalDateTime.now()).build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // 400 - Fecha/hora inválida (parseo)
    @ExceptionHandler(java.time.format.DateTimeParseException.class)
    public ResponseEntity<ErrorResponse> handleDateTimeParse(java.time.format.DateTimeParseException e, WebRequest request) {
        ErrorResponse error = ErrorResponse.builder()
                .error("Fecha/Hora inválida")
                .message("Formato de fecha u hora inválido: " + e.getParsedString())
                .path(request.getDescription(false).replace("uri=", ""))
                .status(HttpStatus.BAD_REQUEST.value())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    // 500 - Error interno del servidor
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception e, WebRequest request) {
    // Construir una respuesta de error mínima sin stackTrace/causa para evitar filtrar información interna
    ErrorResponse error = ErrorResponse.builder()
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
    public ResponseEntity<ErrorResponse> handleResourceNotFound(com.dh.dentalClinicMVC.exception.ResourceNotFoundException e, WebRequest request) {
    ErrorResponse error = ErrorResponse.builder()
        .error("Recurso no encontrado")
        .message(e.getMessage())
        .path(request.getDescription(false).replace("uri=", ""))
        .status(HttpStatus.NOT_FOUND.value())
        .timestamp(LocalDateTime.now())
        .build();

    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    // 401 - No se enviaron credenciales o son inválidas
    @ExceptionHandler(AuthenticationCredentialsNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleAuthCredentialsNotFound(AuthenticationCredentialsNotFoundException e, WebRequest request) {
        ErrorResponse error = ErrorResponse.builder()
                .error("No autenticado")
                .message("Faltan credenciales de autenticación")
                .path(request.getDescription(false).replace("uri=", ""))
                .status(HttpStatus.UNAUTHORIZED.value())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    // 403 - Acceso denegado
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException e, WebRequest request) {
        ErrorResponse error = ErrorResponse.builder()
                .error("Acceso denegado")
                .message("No tienes permisos para realizar esta acción")
                .path(request.getDescription(false).replace("uri=", ""))
                .status(HttpStatus.FORBIDDEN.value())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<String> handleEmailExists(EmailAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
    }
}
