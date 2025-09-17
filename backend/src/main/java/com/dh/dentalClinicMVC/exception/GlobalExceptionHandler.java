package com.dh.dentalClinicMVC.exception;

import org.hibernate.exception.ConstraintViolationException;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import jakarta.persistence.EntityNotFoundException;

import java.sql.SQLIntegrityConstraintViolationException;
import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler extends RuntimeException {
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

    // 500 - Error interno del servidor
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception e, WebRequest request) {
        ErrorResponse error = ErrorResponse.builder().error("Error interno del servidor").message("Ha ocurrido un error inesperado").path(request.getDescription(false).replace("uri=", "")).status(HttpStatus.INTERNAL_SERVER_ERROR.value()).timestamp(LocalDateTime.now()).build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<String> handleEmailExists(EmailAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
    }
}
