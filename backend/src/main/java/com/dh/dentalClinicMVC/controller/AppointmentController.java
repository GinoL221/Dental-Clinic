package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.dto.AppointmentRequestDTO;
import com.dh.dentalClinicMVC.dto.AppointmentRequestMapper;
import com.dh.dentalClinicMVC.dto.DentistResponseDTO;
import com.dh.dentalClinicMVC.dto.PatientResponseDTO;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.entity.User;
import com.dh.dentalClinicMVC.exception.ErrorResponse;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.exception.StalePrincipalException;
import com.dh.dentalClinicMVC.security.AuthorizationUtils;
import com.dh.dentalClinicMVC.service.IAppointmentService;
import com.dh.dentalClinicMVC.service.IDentistService;
import com.dh.dentalClinicMVC.service.IPatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/appointments")
@Tag(name = "Turnos", description = "Gestión de turnos con filtros por rol del usuario autenticado")
public class AppointmentController {

  private static final Logger log = LoggerFactory.getLogger(AppointmentController.class);

  private final IAppointmentService appointmentService;
  private final IDentistService dentistService;
  private final IPatientService patientService;

  public AppointmentController(
      IAppointmentService appointmentService,
      IDentistService dentistService,
      IPatientService patientService) {
    this.appointmentService = appointmentService;
    this.dentistService = dentistService;
    this.patientService = patientService;
  }

  // Este endpoint guarda un turno
  @Operation(summary = "Registra un nuevo turno")
  @ApiResponse(
      responseCode = "409",
      description = "El odontólogo ya tiene un turno en esa fecha y hora",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @PostMapping
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
  public ResponseEntity<AppointmentDTO> save(
      @Valid @RequestBody AppointmentRequestDTO dto, Authentication auth) {
    // Fix 1: PATIENT can only create appointments for themselves
    if (AuthorizationUtils.hasRole(auth, "ROLE_PATIENT")) {
      PatientResponseDTO patient =
          patientService.findByEmailAsDTO(auth.getName()).orElseThrow(StalePrincipalException::new);
      dto.setPatientId(patient.getId());
    }

    AppointmentDTO mapped = AppointmentRequestMapper.toServiceDTO(dto, null);
    AppointmentDTO saved = appointmentService.save(mapped);
    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
  }

  // Este endpoint busca un turno por ID
  @Operation(summary = "Obtiene un turno por ID (un odontólogo solo puede ver los suyos)")
  @ApiResponse(
      responseCode = "404",
      description = "Turno no encontrado",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
  public ResponseEntity<AppointmentDTO> findById(@PathVariable Long id, Authentication auth)
      throws ResourceNotFoundException {
    Optional<AppointmentDTO> found = appointmentService.findById(id);

    if (found.isEmpty()) {
      throw new ResourceNotFoundException("Turno no encontrado con ID: " + id);
    }

    // Fix 5: DENTIST can only view their own appointments by ID
    if (AuthorizationUtils.hasRole(auth, "ROLE_DENTIST")) {
      DentistResponseDTO dentist =
          dentistService.findByEmailAsDTO(auth.getName()).orElseThrow(StalePrincipalException::new);
      if (!found.get().getDentistId().equals(dentist.getId())) {
        log.warn(
            "IDOR attempt: dentist {} requested appointment {} owned by dentist {}",
            dentist.getId(),
            id,
            found.get().getDentistId());
        throw new AccessDeniedException("No tienes permisos para realizar esta acción");
      }
    }

    return ResponseEntity.ok(found.get());
  }

  // Este endpoint actualiza un turno
  @Operation(summary = "Actualiza un turno (un odontólogo solo puede actualizar los suyos)")
  @ApiResponse(
      responseCode = "404",
      description = "Turno no encontrado",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @ApiResponse(
      responseCode = "409",
      description = "Conflicto de horario del odontólogo",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
  public ResponseEntity<AppointmentDTO> update(
      @PathVariable Long id, @Valid @RequestBody AppointmentRequestDTO dto, Authentication auth)
      throws ResourceNotFoundException {

    // Fix 3: DENTIST can only update their own appointments
    if (AuthorizationUtils.hasRole(auth, "ROLE_DENTIST")) {
      AppointmentDTO existing =
          appointmentService
              .findById(id)
              .orElseThrow(
                  () -> new ResourceNotFoundException("Turno no encontrado con ID: " + id));
      DentistResponseDTO dentist =
          dentistService.findByEmailAsDTO(auth.getName()).orElseThrow(StalePrincipalException::new);
      if (!Objects.equals(existing.getDentistId(), dentist.getId())) {
        throw new AccessDeniedException("No tienes permisos para realizar esta acción");
      }
      if (!Objects.equals(existing.getDentistId(), dto.getDentistId())) {
        log.warn(
            "Reassignment attempt: dentist {} tried to reassign appointment {} from dentist {} to dentist {}",
            dentist.getId(),
            id,
            existing.getDentistId(),
            dto.getDentistId());
        throw new AccessDeniedException("No tienes permisos para realizar esta acción");
      }
    }

    AppointmentDTO mapped = AppointmentRequestMapper.toServiceDTO(dto, id);
    AppointmentDTO updated = appointmentService.update(mapped);
    return ResponseEntity.ok(updated);
  }

  // Este endpoint elimina un turno
  @Operation(summary = "Elimina un turno por ID")
  @ApiResponse(
      responseCode = "404",
      description = "Turno no encontrado",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<Void> delete(@PathVariable Long id) throws ResourceNotFoundException {
    appointmentService.delete(id);
    return ResponseEntity.noContent().build();
  }

  // Este endpoint consulta todos los turnos (filtrado por rol del usuario autenticado)
  @Operation(summary = "Lista los turnos visibles según el rol del usuario")
  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
  public ResponseEntity<List<AppointmentDTO>> findAll(Authentication auth) {
    if (auth == null) {
      // Defensive: @PreAuthorize above makes an unauthenticated request
      // unreachable here (the filter chain answers 401 first), but if the
      // principal is ever missing, route through the ErrorResponse contract.
      throw new StalePrincipalException();
    }
    String email;
    Role role;
    if (auth.getPrincipal() instanceof User currentUser) {
      // Autenticación JWT normal: principal es nuestra entidad User
      email = currentUser.getEmail();
      role = currentUser.getRole();
    } else {
      // Autenticación sin JWT (ej: tests con @WithMockUser): derivar rol desde authorities
      email = auth.getName();
      role =
          AuthorizationUtils.hasRole(auth, "ROLE_ADMIN")
              ? Role.ADMIN
              : AuthorizationUtils.hasRole(auth, "ROLE_DENTIST") ? Role.DENTIST : Role.PATIENT;
    }
    return ResponseEntity.ok(appointmentService.findAllForCurrentUser(email, role));
  }

  @Operation(summary = "Busca turnos con filtros y paginación")
  @GetMapping("/search")
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
  public ResponseEntity<Page<AppointmentDTO>> searchAppointments(
      @RequestParam(required = false) String patient,
      @RequestParam(required = false) String dentist,
      @RequestParam(required = false) AppointmentStatus status,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate fromDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
          LocalDate toDate,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      Authentication auth) {
    if (auth == null) {
      // Defensive: @PreAuthorize above makes an unauthenticated request
      // unreachable here (the filter chain answers 401 first), but if the
      // principal is ever missing, route through the ErrorResponse contract.
      throw new StalePrincipalException();
    }

    String scopedPatient = patient;
    String scopedDentist = dentist;
    if (!AuthorizationUtils.hasRole(auth, "ROLE_ADMIN")
        && AuthorizationUtils.hasRole(auth, "ROLE_PATIENT")) {
      PatientResponseDTO currentPatient =
          patientService.findByEmailAsDTO(auth.getName()).orElseThrow(StalePrincipalException::new);
      scopedPatient = currentPatient.getId().toString();
    } else if (!AuthorizationUtils.hasRole(auth, "ROLE_ADMIN")
        && AuthorizationUtils.hasRole(auth, "ROLE_DENTIST")) {
      DentistResponseDTO currentDentist =
          dentistService.findByEmailAsDTO(auth.getName()).orElseThrow(StalePrincipalException::new);
      scopedDentist = currentDentist.getId().toString();
    }

    Pageable pageable = PageRequest.of(page, size);
    return ResponseEntity.ok(
        appointmentService.searchAppointments(
            scopedPatient, scopedDentist, status, fromDate, toDate, pageable));
  }

  @Operation(summary = "Cambia el estado de un turno")
  @ApiResponse(
      responseCode = "404",
      description = "Turno no encontrado",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @ApiResponse(
      responseCode = "409",
      description = "Transición de estado inválida",
      content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
  @PatchMapping("/{id}/status")
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
  public ResponseEntity<?> updateStatus(
      @PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth)
      throws ResourceNotFoundException {
    // Fix 4: DENTIST can only change status of their own appointments
    if (AuthorizationUtils.hasRole(auth, "ROLE_DENTIST")) {
      AppointmentDTO existing =
          appointmentService
              .findById(id)
              .orElseThrow(
                  () -> new ResourceNotFoundException("Turno no encontrado con ID: " + id));
      DentistResponseDTO dentist =
          dentistService.findByEmailAsDTO(auth.getName()).orElseThrow(StalePrincipalException::new);
      if (!existing.getDentistId().equals(dentist.getId())) {
        throw new AccessDeniedException("No tienes permisos para realizar esta acción");
      }
    }

    String s = body.get("status");
    if (s == null) {
      throw new IllegalArgumentException("El campo 'status' es obligatorio");
    }
    try {
      AppointmentStatus status = AppointmentStatus.valueOf(s);
      AppointmentDTO updated = appointmentService.updateStatus(id, status);
      return ResponseEntity.ok(updated);
    } catch (IllegalArgumentException ex) {
      throw new IllegalArgumentException("Status inválido: " + s);
    }
  }
}
