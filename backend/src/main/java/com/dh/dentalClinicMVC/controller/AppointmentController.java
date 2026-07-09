package com.dh.dentalClinicMVC.controller;

import com.dh.dentalClinicMVC.dto.AppointmentDTO;
import com.dh.dentalClinicMVC.dto.AppointmentRequestDTO;
import com.dh.dentalClinicMVC.dto.AppointmentRequestMapper;
import com.dh.dentalClinicMVC.entity.AppointmentStatus;
import com.dh.dentalClinicMVC.entity.Dentist;
import com.dh.dentalClinicMVC.entity.Patient;
import com.dh.dentalClinicMVC.entity.Role;
import com.dh.dentalClinicMVC.entity.User;
import com.dh.dentalClinicMVC.exception.ResourceNotFoundException;
import com.dh.dentalClinicMVC.exception.StalePrincipalException;
import com.dh.dentalClinicMVC.security.AuthorizationUtils;
import com.dh.dentalClinicMVC.service.IAppointmentService;
import com.dh.dentalClinicMVC.service.IDentistService;
import com.dh.dentalClinicMVC.service.IPatientService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/appointments")
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
  @PostMapping
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
  public ResponseEntity<?> save(
      @Valid @RequestBody AppointmentRequestDTO dto, Authentication auth) {
    // Fix 1: PATIENT can only create appointments for themselves
    if (AuthorizationUtils.hasRole(auth, "ROLE_PATIENT")) {
      Patient patient =
          patientService.findByEmail(auth.getName()).orElseThrow(StalePrincipalException::new);
      dto.setPatientId(patient.getId());
    }

    AppointmentDTO mapped = AppointmentRequestMapper.toServiceDTO(dto, null);
    AppointmentDTO saved = appointmentService.save(mapped);
    return ResponseEntity.ok(saved);
  }

  // Este endpoint busca un turno por ID
  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST')")
  public ResponseEntity<AppointmentDTO> findById(@PathVariable Long id, Authentication auth) {
    Optional<AppointmentDTO> found = appointmentService.findById(id);

    if (found.isEmpty()) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    // Fix 5: DENTIST can only view their own appointments by ID
    if (AuthorizationUtils.hasRole(auth, "ROLE_DENTIST")) {
      Dentist dentist =
          dentistService.findByEmail(auth.getName()).orElseThrow(StalePrincipalException::new);
      if (!found.get().getDentist_id().equals(dentist.getId())) {
        log.warn(
            "IDOR attempt: dentist {} requested appointment {} owned by dentist {}",
            dentist.getId(),
            id,
            found.get().getDentist_id());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
      }
    }

    return ResponseEntity.ok(found.get());
  }

  // Este endpoint actualiza un turno
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
      Dentist dentist =
          dentistService.findByEmail(auth.getName()).orElseThrow(StalePrincipalException::new);
      if (!existing.getDentist_id().equals(dentist.getId())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
      }
    }

    AppointmentDTO mapped = AppointmentRequestMapper.toServiceDTO(dto, id);
    AppointmentDTO updated = appointmentService.update(mapped);
    return ResponseEntity.ok(updated);
  }

  // Este endpoint elimina un turno
  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<String> delete(@PathVariable Long id) throws ResourceNotFoundException {
    appointmentService.delete(id);
    return ResponseEntity.ok("Se elimino el turno con id: " + id);
  }

  // Este endpoint consulta todos los turnos (filtrado por rol del usuario autenticado)
  @GetMapping
  @PreAuthorize("hasAnyRole('ADMIN','DENTIST','PATIENT')")
  public ResponseEntity<List<AppointmentDTO>> findAll(Authentication auth) {
    if (auth == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
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
      @RequestParam(defaultValue = "10") int size) {
    Pageable pageable = PageRequest.of(page, size);
    return ResponseEntity.ok(
        appointmentService.searchAppointments(
            patient, dentist, status, fromDate, toDate, pageable));
  }

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
      Dentist dentist =
          dentistService.findByEmail(auth.getName()).orElseThrow(StalePrincipalException::new);
      if (!existing.getDentist_id().equals(dentist.getId())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
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
